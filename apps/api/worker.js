// BullMQ Background Worker Process
// Usage: node worker.js
// Runs asynchronously in its own process outside Express HTTP handlers.
// Subscribes to the Redis 'solve-jobs' queue, calls Python solver microservice, and writes route results to PostgreSQL.

import { Worker } from "bullmq"; // Worker class from BullMQ for processing Redis background queues
import { pool } from "./db.js";    // PostgreSQL database connection pool

// Target URL for external Python OR-Tools solver service
const SOLVER_URL = process.env.SOLVER_URL || "http://localhost:8001";
// Redis connection configuration object
const redisConnection = { host: "localhost", port: 6379 };

/**
 * Instantiate BullMQ Worker on 'solve-jobs' queue.
 * Automatically polls Redis and executes async callback whenever a new job is enqueued.
 */
const worker = new Worker("solve-jobs", async (job) => {
    // Unpack job payload parameters added by solve.routes.js
    const { jobId, orgId, orders, drivers } = job.data;

    console.log(`Worker picked up job ${jobId} (org ${orgId})`);

    // Step 1: Update job status in PostgreSQL from 'queued' to 'running'
    await pool.query(
        "UPDATE solve_jobs SET status = 'running' WHERE id = $1",
        [jobId]
    );

    try {
        // Step 2: Send HTTP POST request to Python CVRPTW solver service
        const solverRes = await fetch(`${SOLVER_URL}/solve/cvrptw`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orders, drivers })
        });

        // Check if solver returned non-200 HTTP status error
        if (!solverRes.ok) {
            const errText = await solverRes.text();
            // Mark job as failed in PostgreSQL database and record error message
            await pool.query(
                "UPDATE solve_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
                [`solver error: ${errText}`.slice(0, 500), jobId]
            );
            return; // Abort job execution on solver error
        }

        // Parse solver JSON response
        const solverData = await solverRes.json();
        const { routes: solverRoutes, unassigned_order_ids } = solverData;

        // Step 3: Write routes and stop assignments into PostgreSQL database using a transaction
        const client = await pool.connect(); // Acquire dedicated DB client for transaction
        try {
            await client.query("BEGIN"); // Begin SQL transaction
            const route_ids = [];

            // Iterate over each computed driver route returned by solver
            for (const r of solverRoutes) {
                // Convert route drive duration from seconds to minutes
                const totalDurationMin = r.total_duration_seconds / 60.0;
                // Serialize polyline geometry points array to JSON string
                const serializedGeometry = r.geometry ? JSON.stringify(r.geometry) : null;

                // Insert route manifest record into 'routes' table
                const routeInsert = await client.query(
                    "INSERT INTO routes (org_id, solve_job_id, driver_id, total_distance_km, total_duration_min, geometry) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
                    [orgId, jobId, r.driver_id, r.total_distance_km || 0.0, totalDurationMin, serializedGeometry]
                );
                const routeId = routeInsert.rows[0].id; // Extract generated route ID
                route_ids.push(routeId);

                // Insert individual delivery stops in sequence into 'route_stops' table
                for (let i = 0; i < r.stop_order.length; i++) {
                    const orderId = r.stop_order[i];
                    // Insert route stop sequence association
                    await client.query(
                        "INSERT INTO route_stops (route_id, order_id, sequence_no) VALUES ($1, $2, $3)",
                        [routeId, orderId, i + 1]
                    );
                    // Update order status from 'unassigned' to 'assigned'
                    await client.query(
                        "UPDATE orders SET status = 'assigned' WHERE id = $1 AND org_id = $2",
                        [orderId, orgId]
                    );
                }
            }

            // Step 4: Update solve_jobs table marking status = 'done', saving generated route_ids and unassigned orders
            await client.query(
                `UPDATE solve_jobs
                 SET status = 'done',
                     route_ids = $1,
                     unassigned_order_ids = $2,
                     completed_at = NOW()
                 WHERE id = $3`,
                [route_ids, unassigned_order_ids || [], jobId]
            );

            // Commit transaction changes
            await client.query("COMMIT");
            console.log(`Job ${jobId} done — routes: [${route_ids.join(', ')}], unassigned: [${(unassigned_order_ids || []).join(', ')}]`);
        } catch (txnError) {
            // Roll back transaction on error
            await client.query("ROLLBACK");
            throw txnError;
        } finally {
            // Release client connection back to pool
            client.release();
        }

    } catch (err) {
        // Global error handler: log failure and set job status = 'failed' in DB
        console.error(`Job ${jobId} failed:`, err);
        await pool.query(
            "UPDATE solve_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
            [err.message.slice(0, 500), jobId]
        );
    }
}, { connection: redisConnection });

// Listen for worker process error events
worker.on("failed", (job, err) => {
    console.error(`Worker reported job ${job?.id} failed:`, err.message);
});

console.log("Solver worker started, watching 'solve-jobs' queue...");