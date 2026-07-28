// drivers.routes.js — CRUD for drivers, org-scoped + role-gated.
//
// Role matrix:
//   GET /               → dispatcher, admin, superadmin (drivers cannot list the fleet)
//   GET /me/current-route → driver only
//   GET /:id            → dispatcher, admin, superadmin
//   POST /              → dispatcher, admin, superadmin (dispatchers can add fleet members)
//   PUT /:id            → dispatcher, admin, superadmin (dispatchers can update driver info)
//   DELETE /:id         → admin, superadmin only (destructive — deactivates fleet member)

import { Router } from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { dispatcherOrAbove, adminOrAbove, driverOnly } from "../middleware/requireRole.js";
import bcrypt from "bcryptjs";

const router = Router();

// All driver routes require a valid JWT first
router.use(authenticateToken);

// ─── GET / ── list all drivers for the org ───────────────────────────────────
router.get("/", dispatcherOrAbove, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, user_id, name, phone, vehicle_capacity_kg,
                    home_lat, home_lng, is_active, created_at
             FROM drivers
             WHERE org_id = $1
             ORDER BY created_at DESC`,
            [req.user.orgId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("list drivers error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── GET /me/current-route ── driver's active route (driver only) ─────────────
router.get("/me/current-route", driverOnly, async (req, res) => {
    try {
        const driverResult = await pool.query(
            "SELECT id FROM drivers WHERE user_id = $1 AND org_id = $2 AND is_active = TRUE",
            [req.user.id, req.user.orgId]
        );
        if (driverResult.rows.length === 0) {
            return res.status(404).json({
                message: "No active driver profile is linked to your account. Ask your dispatcher to assign your account to a driver record."
            });
        }
        const driverId = driverResult.rows[0].id;

        const routeResult = await pool.query(
            `SELECT r.id, r.total_distance_km, r.total_duration_min
             FROM routes r
             WHERE r.driver_id = $1
               AND r.org_id = $2
               AND r.created_at >= NOW() - INTERVAL '24 hours'
               AND EXISTS (
                   SELECT 1 FROM route_stops rs
                   WHERE rs.route_id = r.id
                     AND rs.status NOT IN ('delivered', 'failed')
               )
             ORDER BY r.created_at DESC
             LIMIT 1`,
            [driverId, req.user.orgId]
        );
        if (routeResult.rows.length === 0) {
            return res.status(404).json({
                message: "No active route found for today. All stops may be complete, or the dispatcher hasn't run optimization yet."
            });
        }
        const route = routeResult.rows[0];

        const stopsResult = await pool.query(
            `SELECT rs.id AS stop_id, rs.sequence_no, rs.eta, rs.status,
                    o.id AS order_id, o.address, o.lat, o.lng, o.weight_kg, o.deadline_end
             FROM route_stops rs
             JOIN orders o ON o.id = rs.order_id
             WHERE rs.route_id = $1
             ORDER BY rs.sequence_no`,
            [route.id]
        );
        const stops = stopsResult.rows.map(s => ({
            stop_id:     s.stop_id,
            order_id:    s.order_id,
            sequence_no: s.sequence_no,
            eta:         s.eta,
            status:      s.status,
            lat:         parseFloat(s.lat),
            lng:         parseFloat(s.lng),
            address:     s.address,
            weight_kg:   parseFloat(s.weight_kg),
            deadline_end: s.deadline_end,
        }));

        res.json({
            route_id:           route.id,
            driver_id:          driverId,
            total_distance_km:  route.total_distance_km  ? parseFloat(route.total_distance_km)  : 0,
            total_duration_min: route.total_duration_min ? parseFloat(route.total_duration_min) : 0,
            stops,
        });
    } catch (err) {
        console.error("current-route error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── GET /:id ── get a single driver ─────────────────────────────────────────
router.get("/:id", dispatcherOrAbove, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, user_id, name, phone, vehicle_capacity_kg,
                    home_lat, home_lng, is_active, created_at
             FROM drivers
             WHERE id = $1 AND org_id = $2`,
            [req.params.id, req.user.orgId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "driver not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("get driver error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── POST / ── create a new driver (dispatcher/admin/superadmin) ────────────
router.post("/", dispatcherOrAbove, async (req, res) => {
    const { name, email, phone, vehicle_capacity_kg, home_lat, home_lng, user_id } = req.body;

    if (!name || vehicle_capacity_kg == null || home_lat == null || home_lng == null) {
        return res.status(400).json({
            message: "name, vehicle_capacity_kg, home_lat, and home_lng are required"
        });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        let userId = user_id || null;

        // If email is passed and no explicit user_id, provision user account for driver
        if (email && !userId) {
            const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
            if (existing.rows.length > 0) {
                await client.query("ROLLBACK");
                return res.status(409).json({ message: "Email already in use" });
            }

            const passwordHash = await bcrypt.hash("password123", 10);
            const userResult = await client.query(
                `INSERT INTO users (org_id, email, password_hash, name, role)
                 VALUES ($1, $2, $3, $4, 'driver')
                 RETURNING id`,
                [req.user.orgId, email, passwordHash, name]
            );
            userId = userResult.rows[0].id;
        } else if (userId != null) {
            const userCheck = await client.query(
                "SELECT id FROM users WHERE id = $1 AND org_id = $2",
                [userId, req.user.orgId]
            );
            if (userCheck.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                    message: "user_id does not belong to your organization"
                });
            }
        }

        const result = await client.query(
            `INSERT INTO drivers (org_id, user_id, name, phone, vehicle_capacity_kg, home_lat, home_lng)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, user_id, name, phone, vehicle_capacity_kg, home_lat, home_lng, is_active, created_at`,
            [req.user.orgId, userId, name, phone || null, vehicle_capacity_kg, home_lat, home_lng]
        );

        await client.query("COMMIT");
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("create driver error:", err);
        res.status(500).json({ message: "internal server error" });
    } finally {
        client.release();
    }
});

// ─── PUT /:id ── update a driver (dispatcher/admin/superadmin) ──────────────
router.put("/:id", dispatcherOrAbove, async (req, res) => {
    const { name, phone, vehicle_capacity_kg, home_lat, home_lng, is_active, user_id } = req.body;

    try {
        if (user_id !== undefined && user_id !== null) {
            const userCheck = await pool.query(
                "SELECT id FROM users WHERE id = $1 AND org_id = $2",
                [user_id, req.user.orgId]
            );
            if (userCheck.rows.length === 0) {
                return res.status(400).json({
                    message: "user_id does not belong to your organization"
                });
            }
        }

        const result = await pool.query(
            `UPDATE drivers
             SET name               = COALESCE($1, name),
                 phone              = COALESCE($2, phone),
                 vehicle_capacity_kg = COALESCE($3, vehicle_capacity_kg),
                 home_lat           = COALESCE($4, home_lat),
                 home_lng           = COALESCE($5, home_lng),
                 is_active          = COALESCE($6, is_active),
                 user_id            = CASE WHEN $7::boolean THEN $8::int ELSE user_id END
             WHERE id = $9 AND org_id = $10
             RETURNING id, user_id, name, phone, vehicle_capacity_kg, home_lat, home_lng, is_active, created_at`,
            [
                name, phone, vehicle_capacity_kg, home_lat, home_lng, is_active,
                user_id !== undefined,
                user_id ?? null,
                req.params.id,
                req.user.orgId
            ]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "driver not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("update driver error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── DELETE /:id ── soft-delete a driver (admin/superadmin only) ──────────────
router.delete("/:id", adminOrAbove, async (req, res) => {
    try {
        const result = await pool.query(
            "UPDATE drivers SET is_active = FALSE WHERE id = $1 AND org_id = $2 RETURNING id",
            [req.params.id, req.user.orgId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "driver not found" });
        }
        res.json({ message: "driver deactivated" });
    } catch (err) {
        console.error("delete driver error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

export default router;
