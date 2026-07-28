//this file does the fast, cheap parts (checking order/driver
// ids are valid and belong to this org — just SELECT queries), pushes the
// actual slow work onto a Redis-backed queue, and responds immediately with
// a job_id. The dispatcher polls GET /api/jobs/:id (already built) until it
// flips to 'done'. The slow part (solver call + DB writes) now happens in
// worker.js, a completely separate running process — see that file.

import { Router } from "express";
import { Queue } from "bullmq";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { dispatcherOrAbove } from "../middleware/requireRole.js";

const router = Router();
router.use(authenticateToken);

// Connection details for Redis — same Redis instance the worker will connect to.
// Both this file and worker.js must point at the SAME Redis, since that's how
// they communicate: this file writes a job into the queue, the worker reads it
// back out. Neither process talks to the other directly.
const redisConnection = { host: "localhost", port: 6379 };

// The named queue — think of this as a specific "inbox" inside Redis that
// this producer writes to and the worker watches. The name string ("solve-jobs")
// must match exactly on both sides.
const solveQueue = new Queue("solve-jobs", { connection: redisConnection });

// Helper to convert a timestamp into "seconds since midnight" — the format
// the solver's time-window logic expects. Unchanged from before.
const getSecondsFromMidnight = (dateVal) => {
  const date = new Date(dateVal);
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
};

// ─── POST / ── enqueue a solve job (dispatcher/admin only) ──────────────────
router.post("/", dispatcherOrAbove, async (req, res) => {
    const { order_ids, driver_ids } = req.body;
    if (!Array.isArray(order_ids) || !Array.isArray(driver_ids) || order_ids.length === 0 || driver_ids.length === 0) {
        return res.status(400).json({ message: "order_ids and driver_ids must be non-empty arrays" });
    }

    const client = await pool.connect();
    let jobId;

    try {
        // 1. Create the job row immediately, status 'queued' (not 'running' —
        //    it isn't running yet, it's just been added to the queue).
        //    This row is what GET /api/jobs/:id will read to report status.
        const job = await client.query(
            "INSERT INTO solve_jobs (org_id, status) VALUES ($1, 'queued') RETURNING id",
            [req.user.orgId]
        );
        jobId = job.rows[0].id;
    } catch (err) {
        client.release();
        console.error("create job error:", err);
        return res.status(500).json({ message: "internal server error" });
    }

    try {
        // 2. Validate order_ids exist and belong to this org.
        //    This is a cheap SELECT — fine to do synchronously here, it's not
        //    the slow part. Doing it here (not in the worker) means a bad
        //    request fails fast with a proper 404, instead of silently
        //    failing inside a background job the user has to poll to discover.
        const ordersResult = await client.query(
            "SELECT id, lat, lng, weight_kg, deadline_start, deadline_end FROM orders WHERE id = ANY($1) AND org_id = $2",
            [order_ids, req.user.orgId]
        );

        if (ordersResult.rows.length !== order_ids.length) {
            await client.query(
                "UPDATE solve_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
                ["one or more order_ids not found for this org", jobId]
            );
            client.release();
            return res.status(404).json({ message: "one or more order_ids not found" });
        }

        // 3. Same validation for driver_ids, org-scoped.
        const driversResult = await client.query(
            "SELECT id, home_lat, home_lng, vehicle_capacity_kg FROM drivers WHERE id = ANY($1) AND org_id = $2",
            [driver_ids, req.user.orgId]
        );

        if (driversResult.rows.length !== driver_ids.length) {
            await client.query(
                "UPDATE solve_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
                ["one or more driver_ids not found for this org", jobId]
            );
            client.release();
            return res.status(404).json({ message: "one or more driver_ids not found" });
        }

        client.release();

        // 4. Format the payload the solver expects — same shape as before,
        //    just built here instead of right before the solver call, since
        //    the solver call itself no longer happens in this file.
        const orders = ordersResult.rows.map(o => ({
            id: o.id,
            lat: parseFloat(o.lat),
            lng: parseFloat(o.lng),
            demand_kg: parseFloat(o.weight_kg),
            window_start: getSecondsFromMidnight(o.deadline_start),
            window_end: getSecondsFromMidnight(o.deadline_end)
        }));

        const drivers = driversResult.rows.map(d => ({
            id: d.id,
            lat: parseFloat(d.home_lat),
            lng: parseFloat(d.home_lng),
            capacity_kg: parseFloat(d.vehicle_capacity_kg)
        }));

        // 5. THE ACTUAL CHANGE: instead of `await fetch(solver...)` right here,
        //    we push everything the worker will need into the queue and return
        //    immediately. solveQueue.add() is fast (just writes to Redis) —
        //    it does NOT wait for the solve to finish. That's the whole point.
        try {
            await solveQueue.add("solve", {
                jobId,
                orgId: req.user.orgId,
                orders,
                drivers
            }, { timeout: 1500 });

            res.status(202).json({
                job_id: jobId,
                status: "queued"
            });
        } catch (queueErr) {
            console.log("[solve] Redis queue unavailable or timed out; running solver inline...");
            const SOLVER_URL = process.env.SOLVER_URL || "http://localhost:8000";
            const solverRes = await fetch(`${SOLVER_URL}/solve/cvrptw`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orders, drivers })
            });

            if (!solverRes.ok) {
                const errText = await solverRes.text();
                await pool.query(
                    "UPDATE solve_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
                    [errText.slice(0, 500), jobId]
                );
                return res.status(500).json({ message: "Solver error: " + errText });
            }

            const solverData = await solverRes.json();
            const { routes: solverRoutes, unassigned_order_ids } = solverData;
            const createdRouteIds = [];

            for (const r of solverRoutes) {
                if (!r.stop_order || r.stop_order.length === 0) continue;
                const routeRes = await pool.query(
                    `INSERT INTO routes (org_id, driver_id, total_distance_km, total_duration_min, geometry, status)
                     VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id`,
                    [req.user.orgId, r.driver_id, r.total_distance_km || 0, Math.round((r.total_duration_seconds || 0) / 60), JSON.stringify(r.geometry || [])]
                );
                const routeId = routeRes.rows[0].id;
                createdRouteIds.push(routeId);

                for (let i = 0; i < r.stop_order.length; i++) {
                    const orderId = r.stop_order[i];
                    await pool.query(
                        `INSERT INTO route_stops (route_id, order_id, sequence) VALUES ($1, $2, $3)`,
                        [routeId, orderId, i + 1]
                    );
                    await pool.query(
                        `UPDATE orders SET status = 'assigned' WHERE id = $1`,
                        [orderId]
                    );
                }
            }

            await pool.query(
                `UPDATE solve_jobs SET status = 'done', route_ids = $1, unassigned_order_ids = $2, completed_at = NOW() WHERE id = $3`,
                [createdRouteIds, unassigned_order_ids || [], jobId]
            );

            return res.status(200).json({
                job_id: jobId,
                status: "done",
                route_ids: createdRouteIds
            });
        }
    } catch (err) {
        console.error("solve error:", err);
        try {
            if (jobId) {
                await pool.query(
                    "UPDATE solve_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
                    [err.message.slice(0, 500), jobId]
                );
            }
        } catch (dbErr) {
            console.error("failed to mark job as failed:", dbErr);
        }
        res.status(500).json({ message: "internal server error: " + err.message });
    }
});

export default router;