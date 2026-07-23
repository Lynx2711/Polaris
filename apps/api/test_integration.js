import jwt from "jsonwebtoken";
import pg from "pg";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const { Pool } = pg;

// Read config from apps/api/.env
const dbUrl = "postgresql://postgres:devpassword@localhost:5432/polaris";
const jwtSecret = "some-long-random-string-change-this-in-production";

const pool = new Pool({ connectionString: dbUrl });

async function runTests() {
    console.log("Starting integration verification tests...");

    // 1. Fetch first user and their org
    const userRes = await pool.query("SELECT id, org_id, email, role FROM users LIMIT 1");
    if (userRes.rows.length === 0) {
        console.error("No users found in database. Run database seed first.");
        await pool.end();
        process.exit(1);
    }
    const user = userRes.rows[0];
    console.log(`Using test user: ${user.email} (Org ID: ${user.org_id})`);

    // 2. Generate a signed JWT token for the user
    const tokenPayload = {
        userId: user.id,
        orgId: user.org_id,
        role: user.role
    };
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: "1h" });
    const authHeaders = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    // 3. Query existing orders and drivers belonging to this org
    const ordersRes = await pool.query("SELECT id FROM orders WHERE org_id = $1 LIMIT 5", [user.org_id]);
    const driversRes = await pool.query("SELECT id FROM drivers WHERE org_id = $1 LIMIT 3", [user.org_id]);

    if (ordersRes.rows.length === 0 || driversRes.rows.length === 0) {
        console.error("Not enough orders or drivers in the DB for this org. Run seeding.");
        await pool.end();
        process.exit(1);
    }

    const order_ids = ordersRes.rows.map(o => o.id);
    const driver_ids = driversRes.rows.map(d => d.id);
    console.log(`Targeting Order IDs: ${order_ids}, Driver IDs: ${driver_ids}`);

    // 4. Start Python Solver Server
    console.log("Launching solver server...");
    const solverProc = spawn(
        "D:\\Polaris\\apps\\solver\\env\\Scripts\\python.exe",
        ["D:\\Polaris\\apps\\solver\\main.py"],
        { stdio: "ignore" }
    );

    // 5. Start API Server
    console.log("Launching API server...");
    const apiProc = spawn(
        "node",
        ["index.js"],
        { cwd: "D:\\Polaris\\apps\\api", stdio: "ignore" }
    );

    // Wait for servers to spin up
    await new Promise(resolve => setTimeout(resolve, 4000));

    try {
        // Test POST /api/solve
        console.log("\n--- Testing POST /api/solve ---");
        const solveRes = await fetch("http://localhost:4000/api/solve", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ order_ids, driver_ids })
        });
        
        console.log(`POST /api/solve status: ${solveRes.status}`);
        const solveData = await solveRes.json();
        console.log("POST /api/solve response:", JSON.stringify(solveData, null, 2));

        if (!solveData.route_ids || solveData.route_ids.length === 0) {
            throw new Error("No route IDs returned from solve endpoint.");
        }

        const validRouteId = solveData.route_ids[0];

        // Test GET /api/routes/:id (Valid Access)
        console.log(`\n--- Testing GET /api/routes/${validRouteId} (Valid Access) ---`);
        const getRouteRes = await fetch(`http://localhost:4000/api/routes/${validRouteId}`, {
            headers: authHeaders
        });
        
        console.log(`GET route status: ${getRouteRes.status}`);
        const routeData = await getRouteRes.json();
        console.log(`Route details (total_distance_km: ${routeData.total_distance_km}, total_duration_min: ${routeData.total_duration_min}):`);
        console.log(`Stops assigned count: ${routeData.stops.length}`);
        console.log(`Geometry contains: ${routeData.geometry ? routeData.geometry.length : 0} points`);

        // Test GET /api/routes/:id (Invalid Access / Cross-Tenant Security Check)
        // Sign token for a DIFFERENT org_id (e.g. orgId: 99999)
        const hackerToken = jwt.sign({ userId: 999, orgId: 99999, role: "dispatcher" }, jwtSecret);
        console.log(`\n--- Testing GET /api/routes/${validRouteId} (Cross-Tenant Unauthorized Check) ---`);
        const hackerRes = await fetch(`http://localhost:4000/api/routes/${validRouteId}`, {
            headers: { "Authorization": `Bearer ${hackerToken}` }
        });
        
        console.log(`Unauthorized status code (expecting 404): ${hackerRes.status}`);
        if (hackerRes.status === 404) {
            console.log("Success! Cross-tenant access prevented, returns 404.");
        } else {
            console.error("FAIL! Unauthorized tenant was able to access data or get a different status.");
        }

    } catch (err) {
        console.error("Test failed with error:", err);
    } finally {
        console.log("\nTerminating processes...");
        solverProc.kill();
        apiProc.kill();
        await pool.end();
        console.log("Cleanup done.");
    }
}

runTests();
