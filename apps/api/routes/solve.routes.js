// apps/api/routes/solve.routes.js
// checked the solve endpoint from sharvani's code
// Triggers a route-solve job. For now (Week 2), synchronous — calls the solver's
// /table endpoint to get a real OSRM drive-time matrix. Once C's OR-Tools TSP
// endpoint is ready, swap /table for that (see comment below).

import { Router } from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

const SOLVER_URL = process.env.SOLVER_URL || "http://localhost:8001";

// ─── POST / ── trigger a solve job ───────────────────────────
router.post("/", async (req, res) => {
    const { order_ids, driver_ids } = req.body;

    if (!Array.isArray(order_ids) || !Array.isArray(driver_ids) || order_ids.length === 0 || driver_ids.length === 0) {
        return res.status(400).json({ message: "order_ids and driver_ids must be non-empty arrays" });
    }

    const client = await pool.connect();
    try {
        // 1. create the job row, mark as running
        const job = await client.query(
            "INSERT INTO solve_jobs (org_id, status) VALUES ($1, 'running') RETURNING id, status, requested_at",
            [req.user.orgId]
        );
        const jobId = job.rows[0].id;

        // 2. fetch order coordinates, scoped to this org (security: prevents solving
        //    orders belonging to a different org even if IDs are guessed)
        const ordersResult = await client.query(
            "SELECT id, lat, lng FROM orders WHERE id = ANY($1) AND org_id = $2",
            [order_ids, req.user.orgId]
        );

        if (ordersResult.rows.length !== order_ids.length) {
            await client.query(
                "UPDATE solve_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
                ["one or more order_ids not found for this org", jobId]
            );
            return res.status(404).json({ message: "one or more order_ids not found" });
        }

        // 3. call the solver
        //    TODO: once C's OR-Tools TSP endpoint exists, replace "/table" below
        //    with "/solve/tsp" (or whatever it's named) — the rest of this logic
        //    (job tracking, DB writes) shouldn't need to change.
        const coordinates = ordersResult.rows.map(o => ({ lat: o.lat, lng: o.lng }));

        const solverRes = await fetch(`${SOLVER_URL}/table`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coordinates })
        });

        if (!solverRes.ok) {
            const errText = await solverRes.text();
            await client.query(
                "UPDATE solve_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
                [`solver error: ${errText}`.slice(0, 500), jobId]
            );
            return res.status(502).json({ message: "solver request failed" });
        }

        const solverData = await solverRes.json();

        // 4. mark job done
        await client.query(
            "UPDATE solve_jobs SET status = 'done', completed_at = NOW() WHERE id = $1",
            [jobId]
        );

        res.status(201).json({
            job_id: jobId,
            status: "done",
            order_ids,
            driver_ids,
            result: solverData
        });
    } catch (err) {
        console.error("solve error:", err);
        res.status(500).json({ message: "internal server error" });
    } finally {
        client.release();
    }
});

export default router;