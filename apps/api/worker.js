// BullMQ Background Worker Process
// Usage: node worker.js
// Runs asynchronously in its own process outside Express HTTP handlers.
// Subscribes to the Redis 'solve-jobs' queue, calls Python solver microservice, and writes route results to PostgreSQL.

import { Worker } from "bullmq";
import { pool } from "./db.js";

const SOLVER_URL = process.env.SOLVER_URL || "http://localhost:8001";
const redisConnection = { host: "localhost", port: 6379 };

const worker = new Worker("solve-jobs", async (job) => {
    const { jobId, orgId, orders, drivers } = job.data;

    console.log(`Worker picked up job ${jobId} (org ${orgId})`);

    // Mark as running
    await pool.query(
        "UPDATE solve_jobs SET status = 'running' WHERE id = $1",
        [jobId]
    );

    try {
        // Call Python solver microservice
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
            return;
        }

        const solverData = await solverRes.json();
        const { routes: solverRoutes, unassigned_order_ids } = solverData;

        // Write routes and stop assignments in PostgreSQL inside a transaction
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const route_ids = [];

            for (const r of solverRoutes) {
                const totalDurationMin = (r.total_duration_seconds || 0) / 60.0;
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

            // Mark the job done
            await client.query(
                `UPDATE solve_jobs
                 SET status = 'done',
                     completed_at = NOW()
                 WHERE id = $1`,
                [jobId]
            );

            await client.query("COMMIT");
            console.log(`Job ${jobId} done — routes: [${route_ids.join(', ')}], unassigned: [${(unassigned_order_ids || []).join(', ')}]`);
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
