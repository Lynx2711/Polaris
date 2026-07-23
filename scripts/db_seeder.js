import pg from "pg";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const { Pool } = pg;
const dbUrl = "postgresql://postgres:devpassword@localhost:5432/polaris";
const pool = new Pool({ connectionString: dbUrl });

async function seed() {
    console.log("Seeding database...");
    
    // Clear existing data to avoid constraint/duplicate issues
    await pool.query("TRUNCATE route_stops, routes, solve_jobs, orders, drivers, users, organizations CASCADE");
    
    // Create organization
    const orgRes = await pool.query(
        "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id",
        ["Fast Couriers Jalandhar", "fastcouriers-jal"]
    );
    const orgId = orgRes.rows[0].id;
    console.log(`Created organization with ID: ${orgId}`);

    // Create user
    const passwordHash = await bcrypt.hash("password123", 10);
    const userRes = await pool.query(
        "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [orgId, "dispatcher@fastcouriers.com", passwordHash, "John Doe", "dispatcher"]
    );
    const userId = userRes.rows[0].id;
    console.log(`Created user with ID: ${userId}`);

    // Load drivers
    const drivers = JSON.parse(fs.readFileSync("d:/Polaris/fixtures/drivers.json", "utf8"));
    for (const d of drivers) {
        await pool.query(
            "INSERT INTO drivers (org_id, name, phone, vehicle_capacity_kg, home_lat, home_lng) VALUES ($1, $2, $3, $4, $5, $6)",
            [orgId, d.name, d.phone, d.vehicle_capacity_kg, d.home_lat, d.home_lng]
        );
    }
    console.log(`Seeded ${drivers.length} drivers.`);

    // Load orders
    const orders = JSON.parse(fs.readFileSync("d:/Polaris/fixtures/orders.json", "utf8"));
    for (const o of orders) {
        await pool.query(
            "INSERT INTO orders (org_id, address, lat, lng, weight_kg, deadline_start, deadline_end) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [orgId, o.address, o.lat, o.lng, o.weight_kg, o.deadline_start, o.deadline_end]
        );
    }
    console.log(`Seeded ${orders.length} orders.`);

    await pool.end();
    console.log("Seeding complete.");
}

seed().catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
