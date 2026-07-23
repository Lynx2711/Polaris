// worker.js — CONSUMER side. Run as its own separate process:
//     node worker.js
// NOT started by Express, NOT part of the request/response cycle. This file
// has no routes, no `app.listen()` — its entire life is: watch the
// "solve-jobs" queue in Redis, and whenever a job appears, do the slow work
// (call the solver, write routes/route_stops), then mark the job done/failed.
//
// This is literally the same logic that used to live inline in
// solve.routes.js's POST handler (steps 5-6 from before) — just relocated
// here so it runs on its own time, not blocking any HTTP request.

import { Worker } from "bullmq";
import { pool } from "./db.js";

const SOLVER_URL = process.env.SOLVER_URL || "http://localhost:8001";
const redisConnection = { host: "localhost", port: 6379 };

// `new Worker(queueName, processorFunction, options)` — BullMQ handles the
// "keep checking Redis for new jobs" loop for you. Whenever a job shows up
// on the "solve-jobs" queue (added by solveQueue.add() in solve.routes.js),
// this processor function runs automatically with that job's data.
const worker = new Worker("solve-jobs", async (job) => {
    const { jobId, orgId, orders, drivers } = job.data;

    console.log(`Worker picked up job ${jobId} (org ${orgId})`);

    // Mark as actually running now (it was 'queued' before; now a worker
    // has picked it up and started real work on it).
    await pool.query(
        "UPDATE solve_jobs SET status = 'running' WHERE id = $1",
        [jobId]
    );

    try {
        // 1. Call the CVRPTW solver microservice — same call as before,
        //    just happening here instead of inline in the route handler.
        //    This is the slow part (OSRM + OR-Tools), now running in the
        //    background where a slow response doesn't block anyone.
        const solverRes = await fetch(`${SOLVER_URL}/solve/cvrptw`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orders, drivers })
        });

        if (!solverRes.ok) {
            const errText = await solverRes.text();
            await pool.query(
                "UPDATE solve_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
                [`solver error: ${errText}`.slice(0, 500), jobId]
            );
            return; // stop here — nothing to write to routes/route_stops
        }

        const solverData = await solverRes.json();
        const { routes: solverRoutes, unassigned_order_ids } = solverData;

        // 2. Write results to Postgres inside a transaction — same logic as
        //    before, unchanged, just running here instead of in the route handler.
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const route_ids = [];

            for (const r of solverRoutes) {
                const totalDurationMin = r.total_duration_seconds / 60.0;
                const serializedGeometry = r.geometry ? JSON.stringify(r.geometry) : null;

                const routeInsert = await client.query(
                    "INSERT INTO routes (org_id, solve_job_id, driver_id, total_distance_km, total_duration_min, geometry) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
                    [orgId, jobId, r.driver_id, r.total_distance_km || 0.0, totalDurationMin, serializedGeometry]
                );
                const routeId = routeInsert.rows[0].id;
                route_ids.push(routeId);

                for (let i = 0; i < r.stop_order.length; i++) {
                    const orderId = r.stop_order[i];
                    await client.query(
                        "INSERT INTO route_stops (route_id, order_id, sequence_no) VALUES ($1, $2, $3)",
                        [routeId, orderId, i + 1]
                    );
                    await client.query(
                        "UPDATE orders SET status = 'assigned' WHERE id = $1 AND org_id = $2",
                        [orderId, orgId]
                    );
                }
            }

            // 3. Mark the job done — this is what the dispatcher's polling
            //    (GET /api/jobs/:id) is waiting to see flip from 'running' to 'done'.
            await client.query(
                "UPDATE solve_jobs SET status = 'done', completed_at = NOW() WHERE id = $1",
                [jobId]
            );

            await client.query("COMMIT");
            console.log(`Job ${jobId} done — routes: ${route_ids}, unassigned: ${unassigned_order_ids}`);
        } catch (txnError) {
            await client.query("ROLLBACK");
            throw txnError;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error(`Job ${jobId} failed:`, err);
        await pool.query(
            "UPDATE solve_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
            [err.message.slice(0, 500), jobId]
        );
    }
}, { connection: redisConnection });

worker.on("failed", (job, err) => {
    console.error(`Worker reported job ${job?.id} failed:`, err.message);
});

console.log("Solver worker started, watching 'solve-jobs' queue...");