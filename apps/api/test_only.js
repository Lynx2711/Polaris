import jwt from "jsonwebtoken";
import pg from "pg";

const { Pool } = pg;
const dbUrl = "postgresql://postgres:devpassword@localhost:5432/polaris";
const jwtSecret = "some-long-random-string-change-this-in-production";

const pool = new Pool({ connectionString: dbUrl });

async function runTests() {
    console.log("Starting verification tests against running servers...");

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
        id: user.id,
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

        for (const routeId of solveData.route_ids) {
            // Test GET /api/routes/:id (Valid Access)
            console.log(`\n--- Testing GET /api/routes/${routeId} (Valid Access) ---`);
            const getRouteRes = await fetch(`http://localhost:4000/api/routes/${routeId}`, {
                headers: authHeaders
            });
            
            console.log(`GET route status: ${getRouteRes.status}`);
            const routeData = await getRouteRes.json();
            console.log("GET /api/routes/:id response payload preview:");
            console.log(`- ID: ${routeData.id}`);
            console.log(`- Driver ID: ${routeData.driver_id}`);
            console.log(`- Total Distance (km): ${routeData.total_distance_km}`);
            console.log(`- Total Duration (min): ${routeData.total_duration_min}`);
            console.log(`- Stops Assigned count: ${routeData.stops.length}`);
            console.log(`- Geometry has ${routeData.geometry ? routeData.geometry.length : 0} coordinate points.`);
            if (routeData.geometry && routeData.geometry.length > 0) {
                console.log(`- First coordinate point: ${JSON.stringify(routeData.geometry[0])}`);
                console.log(`- Last coordinate point: ${JSON.stringify(routeData.geometry[routeData.geometry.length - 1])}`);
            }
        }

        // Test GET /api/routes/:id (Invalid Access / Cross-Tenant Security Check)
        // Sign token for a DIFFERENT org_id (e.g. orgId: 99999)
        const hackerToken = jwt.sign({ id: 999, orgId: 99999, role: "dispatcher" }, jwtSecret);
        console.log(`\n--- Testing GET /api/routes/${solveData.route_ids[0]} (Cross-Tenant Unauthorized Check) ---`);
        const hackerRes = await fetch(`http://localhost:4000/api/routes/${solveData.route_ids[0]}`, {
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
        await pool.end();
    }
}

runTests();
