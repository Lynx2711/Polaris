import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;
const dbUrl = "postgresql://postgres:devpassword@localhost:5432/polaris";
const pool = new Pool({ connectionString: dbUrl });

async function seed() {
    console.log("Seeding comprehensive multi-company database...");
    
    // Clear existing data cleanly
    await pool.query("TRUNCATE route_stops, routes, solve_jobs, orders, location_pings, drivers, users, organizations CASCADE");
    
    const defaultPasswordHash = await bcrypt.hash("password123", 10);
    const aditiPasswordHash = await bcrypt.hash("aditi1234", 10);
    const universePasswordHash = await bcrypt.hash("Universe@27", 10);

    // ============================================================
    // 1. SUPERADMIN (Platform Level - No Org)
    // ============================================================
    await pool.query(
        "INSERT INTO users (org_id, email, password_hash, name, role) VALUES (NULL, $1, $2, $3, 'superadmin')",
        ["admin@polaris.com", defaultPasswordHash, "Polaris Platform Superadmin"]
    );
    console.log("Created Platform Superadmin (admin@polaris.com)");

    // ============================================================
    // 2. COMPANY 1: Fast Couriers Jalandhar
    // ============================================================
    const org1 = await pool.query(
        "INSERT INTO organizations (name, slug, plan) VALUES ($1, $2, $3) RETURNING id",
        ["Fast Couriers Jalandhar", "fastcouriers-jal", "pro"]
    );
    const org1Id = org1.rows[0].id;

    // Users
    await pool.query(
        "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'admin')",
        [org1Id, "admin@fastcouriers.com", defaultPasswordHash, "FastCouriers Admin"]
    );
    await pool.query(
        "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'dispatcher')",
        [org1Id, "dispatcher@fastcouriers.com", defaultPasswordHash, "John Doe"]
    );
    const driver1User = await pool.query(
        "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'driver') RETURNING id",
        [org1Id, "driver@fastcouriers.com", defaultPasswordHash, "Rajesh Kumar"]
    );

    // Drivers
    const org1Drivers = [
        { name: "Rajesh Kumar", phone: "+91-9876543210", vehicle_capacity_kg: 500, home_lat: 31.3175, home_lng: 75.5866, user_id: driver1User.rows[0].id },
        { name: "Gurpreet Singh", phone: "+91-9988776655", vehicle_capacity_kg: 750, home_lat: 31.2223, home_lng: 75.7725, user_id: null },
        { name: "Amanpreet Singh", phone: "+91 98765 43210", vehicle_capacity_kg: 500, home_lat: 31.298, home_lng: 75.577, user_id: null },
        { name: "Gurjit Sharma", phone: "+91 98123 45678", vehicle_capacity_kg: 350, home_lat: 31.325, home_lng: 75.612, user_id: null },
        { name: "Harish Verma", phone: "+91 99887 76655", vehicle_capacity_kg: 600, home_lat: 31.279, home_lng: 75.647, user_id: null }
    ];
    for (const d of org1Drivers) {
        await pool.query(
            "INSERT INTO drivers (org_id, user_id, name, phone, vehicle_capacity_kg, home_lat, home_lng) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [org1Id, d.user_id, d.name, d.phone, d.vehicle_capacity_kg, d.home_lat, d.home_lng]
        );
    }

    // Orders for Org 1
    const now = new Date();
    const startWindow = new Date(now.getTime() - 1000 * 60 * 60).toISOString();
    const endWindow = new Date(now.getTime() + 1000 * 60 * 60 * 8).toISOString();

    const org1Orders = [
        { address: "Model Town, Market Complex, Jalandhar", lat: 31.315, lng: 75.585, weight_kg: 120 },
        { address: "Phagwara Main Bus Stand, GT Road", lat: 31.224, lng: 75.771, weight_kg: 85 },
        { address: "Urban Estate Phase 2, Jalandhar", lat: 31.292, lng: 75.602, weight_kg: 210 },
        { address: "Industrial Area Focal Point, Phagwara", lat: 31.241, lng: 75.752, weight_kg: 150 },
        { address: "DAV College, Jalandhar", lat: 31.3344, lng: 75.5683, weight_kg: 10 },
        { address: "Jalandhar Cantt Railway Station", lat: 31.2863, lng: 75.6322, weight_kg: 25 },
        { address: "LPU Campus (Law Gate), Phagwara", lat: 31.2536, lng: 75.7037, weight_kg: 50 },
        { address: "Phagwara Railway Station", lat: 31.2255, lng: 75.7727, weight_kg: 12.5 }
    ];
    for (const o of org1Orders) {
        await pool.query(
            "INSERT INTO orders (org_id, address, lat, lng, weight_kg, deadline_start, deadline_end) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [org1Id, o.address, o.lat, o.lng, o.weight_kg, startWindow, endWindow]
        );
    }
    console.log(`Seeded Fast Couriers Jalandhar (ID: ${org1Id})`);

    // ============================================================
    // 3. COMPANY 2: Swift Logistics (Aditi Verma's Org)
    // ============================================================
    const org2 = await pool.query(
        "INSERT INTO organizations (name, slug, plan) VALUES ($1, $2, $3) RETURNING id",
        ["Swift Logistics", "swift-logistics", "enterprise"]
    );
    const org2Id = org2.rows[0].id;

    // Users
    await pool.query(
        "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'admin')",
        [org2Id, "aditiverma@gmail.com", aditiPasswordHash, "Aditi Verma"]
    );
    await pool.query(
        "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'admin')",
        [org2Id, "aditiverma11448@gmail.com", universePasswordHash, "Aditi Verma"]
    );
    await pool.query(
        "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'dispatcher')",
        [org2Id, "dispatcher@swiftlogistics.com", defaultPasswordHash, "Simran Kaur"]
    );

    // Drivers
    const org2Drivers = [
        { name: "Vikramjit Singh", phone: "+91 98765 11223", vehicle_capacity_kg: 450, home_lat: 31.229, home_lng: 75.768 },
        { name: "Manpreet Kaur", phone: "+91 98765 33445", vehicle_capacity_kg: 400, home_lat: 31.312, home_lng: 75.592 },
        { name: "Davinder Singh", phone: "+91 98765 55667", vehicle_capacity_kg: 600, home_lat: 31.288, home_lng: 75.635 },
        { name: "Navjot Sandhu", phone: "+91 98111 22334", vehicle_capacity_kg: 500, home_lat: 31.341, home_lng: 75.562 }
    ];
    for (const d of org2Drivers) {
        await pool.query(
            "INSERT INTO drivers (org_id, name, phone, vehicle_capacity_kg, home_lat, home_lng) VALUES ($1, $2, $3, $4, $5, $6)",
            [org2Id, d.name, d.phone, d.vehicle_capacity_kg, d.home_lat, d.home_lng]
        );
    }

    const org2Orders = [
        { address: "Rama Mandi Chowk, Jalandhar", lat: 31.311, lng: 75.627, weight_kg: 95 },
        { address: "Nakodar Road Hub, Jalandhar", lat: 31.318, lng: 75.571, weight_kg: 140 },
        { address: "Phagwara Sugar Mill Area", lat: 31.233, lng: 75.761, weight_kg: 180 },
        { address: "Guru Nanak Dev University Regional Campus", lat: 31.348, lng: 75.549, weight_kg: 65 }
    ];
    for (const o of org2Orders) {
        await pool.query(
            "INSERT INTO orders (org_id, address, lat, lng, weight_kg, deadline_start, deadline_end) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [org2Id, o.address, o.lat, o.lng, o.weight_kg, startWindow, endWindow]
        );
    }
    console.log(`Seeded Swift Logistics (ID: ${org2Id})`);

    // ============================================================
    // 4. COMPANY 3: Metro Delivery Express
    // ============================================================
    const org3 = await pool.query(
        "INSERT INTO organizations (name, slug, plan) VALUES ($1, $2, $3) RETURNING id",
        ["Metro Delivery Express", "metro-delivery", "pro"]
    );
    const org3Id = org3.rows[0].id;

    await pool.query(
        "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'admin')",
        [org3Id, "admin@metrodelivery.com", defaultPasswordHash, "Sunil Verma"]
    );
    await pool.query(
        "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'dispatcher')",
        [org3Id, "dispatcher@metrodelivery.com", defaultPasswordHash, "Rohit Sharma"]
    );

    const org3Drivers = [
        { name: "Jaswinder Singh", phone: "+91 98711 22334", vehicle_capacity_kg: 550, home_lat: 31.305, home_lng: 75.589 },
        { name: "Balwinder Kumar", phone: "+91 98722 33445", vehicle_capacity_kg: 480, home_lat: 31.221, home_lng: 75.779 },
        { name: "Tarun Gill", phone: "+91 98733 44556", vehicle_capacity_kg: 520, home_lat: 31.328, home_lng: 75.599 }
    ];
    for (const d of org3Drivers) {
        await pool.query(
            "INSERT INTO drivers (org_id, name, phone, vehicle_capacity_kg, home_lat, home_lng) VALUES ($1, $2, $3, $4, $5, $6)",
            [org3Id, d.name, d.phone, d.vehicle_capacity_kg, d.home_lat, d.home_lng]
        );
    }

    const org3Orders = [
        { address: "Civil Lines Post, Jalandhar", lat: 31.325, lng: 75.582, weight_kg: 75 },
        { address: "GTB Nagar Market, Jalandhar", lat: 31.302, lng: 75.594, weight_kg: 110 },
        { address: "Phagwara Hargobind Nagar", lat: 31.218, lng: 75.782, weight_kg: 80 }
    ];
    for (const o of org3Orders) {
        await pool.query(
            "INSERT INTO orders (org_id, address, lat, lng, weight_kg, deadline_start, deadline_end) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [org3Id, o.address, o.lat, o.lng, o.weight_kg, startWindow, endWindow]
        );
    }
    console.log(`Seeded Metro Delivery Express (ID: ${org3Id})`);

    // ============================================================
    // 5. COMPANY 4: Apex Freight Solutions
    // ============================================================
    const org4 = await pool.query(
        "INSERT INTO organizations (name, slug, plan) VALUES ($1, $2, $3) RETURNING id",
        ["Apex Freight Solutions", "apex-freight", "free"]
    );
    const org4Id = org4.rows[0].id;

    await pool.query(
        "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'admin')",
        [org4Id, "admin@apexfreight.com", defaultPasswordHash, "Hardeep Singh"]
    );
    await pool.query(
        "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'dispatcher')",
        [org4Id, "dispatcher@apexfreight.com", defaultPasswordHash, "Preet Kaur"]
    );

    const org4Drivers = [
        { name: "Sandeep Gill", phone: "+91 98733 44556", vehicle_capacity_kg: 700, home_lat: 31.315, home_lng: 75.605 },
        { name: "Kuldeep Singh", phone: "+91 98744 55667", vehicle_capacity_kg: 650, home_lat: 31.245, home_lng: 75.748 }
    ];
    for (const d of org4Drivers) {
        await pool.query(
            "INSERT INTO drivers (org_id, name, phone, vehicle_capacity_kg, home_lat, home_lng) VALUES ($1, $2, $3, $4, $5, $6)",
            [org4Id, d.name, d.phone, d.vehicle_capacity_kg, d.home_lat, d.home_lng]
        );
    }

    const org4Orders = [
        { address: "Leather Complex, Kapurthala Road, Jalandhar", lat: 31.352, lng: 75.538, weight_kg: 250 },
        { address: "Phagwara Bypass Cargo Hub", lat: 31.239, lng: 75.735, weight_kg: 300 }
    ];
    for (const o of org4Orders) {
        await pool.query(
            "INSERT INTO orders (org_id, address, lat, lng, weight_kg, deadline_start, deadline_end) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [org4Id, o.address, o.lat, o.lng, o.weight_kg, startWindow, endWindow]
        );
    }
    console.log(`Seeded Apex Freight Solutions (ID: ${org4Id})`);

    await pool.end();
    console.log("Multi-company database seeding complete!");
}

seed().catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
