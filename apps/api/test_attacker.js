// Security & Access Control Attacker Tests
// Verifies RBAC controls, cross-tenant isolation, and temporal route filters.

import { pool } from "./db.js";
import bcrypt from "bcryptjs";

const BASE = "http://localhost:4000";

async function apiCall(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log("=================================================");
  console.log("    POLARIS ATTACKER & RBAC SECURITY TEST SUITE  ");
  console.log("=================================================\n");

  const passwordHash = await bcrypt.hash("DriverPassword123!", 10);

  // Setup Test Driver User in Org 3
  await pool.query(`DELETE FROM drivers WHERE user_id IN (SELECT id FROM users WHERE email = 'driver_attacker@test.com')`);
  await pool.query(`DELETE FROM users WHERE email = 'driver_attacker@test.com'`);
  const driverUserRes = await pool.query(
    `INSERT INTO users (org_id, email, password_hash, name, role)
     VALUES (3, 'driver_attacker@test.com', $1, 'Test Driver', 'driver')
     RETURNING id, org_id, role, email`,
    [passwordHash]
  );
  const driverUser = driverUserRes.rows[0];
  console.log(`[Setup] Created driver user: id=${driverUser.id}, role=${driverUser.role}, org_id=${driverUser.org_id}`);

  // Setup Test Driver Record in drivers table linked to driverUser
  const driverRecRes = await pool.query(
    `INSERT INTO drivers (org_id, user_id, name, phone, vehicle_capacity_kg, home_lat, home_lng)
     VALUES (3, $1, 'Test Driver', '+919999999999', 400, 31.3, 75.6)
     RETURNING id`,
    [driverUser.id]
  );
  const driverRecordId = driverRecRes.rows[0].id;
  console.log(`[Setup] Linked driver record id=${driverRecordId} to user_id=${driverUser.id}\n`);

  // Log in as Driver to get Driver JWT Token
  const driverLoginRes = await apiCall("/api/auth/login", {
    method: "POST",
    body: { email: "driver_attacker@test.com", password: "DriverPassword123!" },
  });
  const driverToken = driverLoginRes.data.token;
  console.log(`[Setup] Driver login token obtained: ${driverToken ? 'YES' : 'NO'}\n`);

  // Log in as Org Admin (Org 3)
  const adminLoginRes = await apiCall("/api/auth/login", {
    method: "POST",
    body: { email: "aditiverma@gmail.com", password: "aditi1234" },
  });
  const adminToken = adminLoginRes.data.token;
  console.log(`[Setup] Admin login token obtained (Org 3): ${adminToken ? 'YES' : 'NO'}\n`);

  let passedTests = 0;
  let totalTests = 4;

  // -------------------------------------------------------------
  // TEST 1: Log in as driver, try POST /api/solve directly -> expect 403
  // -------------------------------------------------------------
  console.log("── TEST 1: Driver attempts POST /api/solve (Bypass Check) ──");
  const test1Res = await apiCall("/api/solve", {
    method: "POST",
    token: driverToken,
    body: { order_ids: [11], driver_ids: [driverRecordId] },
  });
  console.log(`  Response Status: ${test1Res.status}`);
  console.log(`  Response Body:`, test1Res.data);
  if (test1Res.status === 403) {
    console.log("  ✅ PASSED: POST /api/solve blocked for driver (403 Forbidden)");
    passedTests++;
  } else {
    console.log(`  ❌ FAILED: Expected 403 Forbidden, got ${test1Res.status}`);
  }
  console.log("");

  // -------------------------------------------------------------
  // TEST 2: Log in as driver, try PUT /api/drivers/:id -> expect 403
  // -------------------------------------------------------------
  console.log("── TEST 2: Driver attempts PUT /api/drivers/:id (Privilege Escalation) ──");
  const test2Res = await apiCall(`/api/drivers/${driverRecordId}`, {
    method: "PUT",
    token: driverToken,
    body: { vehicle_capacity_kg: 99999 },
  });
  console.log(`  Response Status: ${test2Res.status}`);
  console.log(`  Response Body:`, test2Res.data);
  if (test2Res.status === 403) {
    console.log("  ✅ PASSED: PUT /api/drivers/:id blocked for driver (403 Forbidden)");
    passedTests++;
  } else {
    console.log(`  ❌ FAILED: Expected 403 Forbidden, got ${test2Res.status}`);
  }
  console.log("");

  // -------------------------------------------------------------
  // TEST 3: Admin from Org A tries linking user_id from Org B -> expect 400
  // -------------------------------------------------------------
  console.log("── TEST 3: Org A Admin attempts linking User from Org B (Cross-Tenant Attack) ──");
  // User 2 belongs to Org 2 (Fast Couriers Jalandhar)
  // Admin is from Org 3 (Aditi Verma's Org)
  const test3Res = await apiCall(`/api/drivers/${driverRecordId}`, {
    method: "PUT",
    token: adminToken,
    body: { user_id: 2 }, // User 2 is in Org 2!
  });
  console.log(`  Response Status: ${test3Res.status}`);
  console.log(`  Response Body:`, test3Res.data);
  if (test3Res.status === 400 && test3Res.data?.message?.includes("does not belong to your organization")) {
    console.log("  ✅ PASSED: Cross-tenant user_id linking rejected (400 Bad Request)");
    passedTests++;
  } else {
    console.log(`  ❌ FAILED: Expected 400 with tenant violation error, got ${test3Res.status}`);
  }
  console.log("");

  // -------------------------------------------------------------
  // TEST 4: Insert route/route_stops row with old created_at (>24h) and incomplete stop -> confirm /me/current-route ignores it
  // -------------------------------------------------------------
  console.log("── TEST 4: Stale Route Filter (GET /api/drivers/me/current-route) ──");
  
  // Create a dummy order for route_stops
  const dummyOrderRes = await pool.query(
    `INSERT INTO orders (org_id, address, lat, lng, weight_kg, deadline_start, deadline_end, status)
     VALUES (3, 'Old Test Location', 31.3, 75.6, 10, NOW() - INTERVAL '48 hours', NOW() - INTERVAL '40 hours', 'pending')
     RETURNING id`
  );
  const oldOrderId = dummyOrderRes.rows[0].id;

  // Create a dummy solve_job
  const dummyJobRes = await pool.query(
    `INSERT INTO solve_jobs (org_id, status, requested_at) VALUES (3, 'done', NOW() - INTERVAL '30 hours') RETURNING id`
  );
  const oldJobId = dummyJobRes.rows[0].id;

  // Insert a route created 30 hours ago (>24h window)
  const oldRouteRes = await pool.query(
    `INSERT INTO routes (org_id, solve_job_id, driver_id, total_distance_km, total_duration_min, created_at)
     VALUES (3, $1, $2, 15.5, 45, NOW() - INTERVAL '30 hours')
     RETURNING id`,
    [oldJobId, driverRecordId]
  );
  const oldRouteId = oldRouteRes.rows[0].id;

  // Insert an incomplete/pending stop on that old route
  await pool.query(
    `INSERT INTO route_stops (route_id, order_id, sequence_no, status)
     VALUES ($1, $2, 1, 'pending')`,
    [oldRouteId, oldOrderId]
  );

  console.log(`  Inserted stale route id=${oldRouteId} (created 30 hours ago) with incomplete stop.`);

  // Driver fetches current route
  const test4Res = await apiCall("/api/drivers/me/current-route", {
    token: driverToken,
  });
  console.log(`  Response Status: ${test4Res.status}`);
  console.log(`  Response Body:`, test4Res.data);

  if (test4Res.status === 404 && test4Res.data?.message?.includes("No active route found for today")) {
    console.log("  ✅ PASSED: Stale route older than 24 hours was correctly ignored by /me/current-route (404)");
    passedTests++;
  } else {
    console.log(`  ❌ FAILED: Stale route was incorrectly returned! Status=${test4Res.status}`);
  }
  console.log("");

  // Clean up test database rows
  console.log("── CLEANUP ──");
  await pool.query(`DELETE FROM route_stops WHERE route_id = $1`, [oldRouteId]);
  await pool.query(`DELETE FROM routes WHERE id = $1`, [oldRouteId]);
  await pool.query(`DELETE FROM solve_jobs WHERE id = $1`, [oldJobId]);
  await pool.query(`DELETE FROM orders WHERE id = $1`, [oldOrderId]);
  await pool.query(`DELETE FROM drivers WHERE id = $1`, [driverRecordId]);
  await pool.query(`DELETE FROM users WHERE id = $1`, [driverUser.id]);
  console.log("  Temporary test records cleaned up.");

  console.log("\n=================================================");
  console.log(`   ATTACKER SECURITY SUITE RESULT: ${passedTests}/${totalTests} PASSED`);
  console.log("=================================================");

  await pool.end();
}

main().catch((err) => {
  console.error("FATAL TEST ERROR:", err);
  process.exit(1);
});
