// drivers.routes.js — CRUD for drivers, org-scoped + role-gated.
//
// Role matrix:
//   GET /               → dispatcher, admin, superadmin (drivers cannot list the fleet)
//   GET /me/current-route → driver only
//   GET /:id            → dispatcher, admin, superadmin
//   POST /              → admin, superadmin only (only admins add fleet members)
//   PUT /:id            → admin, superadmin only (includes user_id linking — see note)
//   DELETE /:id         → admin, superadmin only
//
// user_id linking (PUT /:id):
//   - Restricted to admin/superadmin — not dispatcher, never driver.
//   - The user_id supplied must belong to the same org as the driver record.
//     This prevents cross-tenant linking (org A user linked into org B driver).

import { Router } from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { dispatcherOrAbove, adminOrAbove, driverOnly } from "../middleware/requireRole.js";

const router = Router();

// All driver routes require a valid JWT first
router.use(authenticateToken);

// ─── GET / ── list all drivers for the org ───────────────────────────────────
// Drivers cannot see the fleet — that's dispatcher/admin territory.
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
// Resolves: JWT user → drivers record → most recent route with ≥1 pending stop.
//
// "Today's route" scoping:
//   We filter by routes created within the last 24 hours (routes.created_at >= NOW() - INTERVAL '24 hours').
//   This prevents a stale route from a previous day (with a leftover 'failed' or 'pending' stop
//   that nobody cleaned up) from surfacing as the driver's current route.
//   If the dispatcher solves routes daily before the shift, this 24-hour window is always correct.
router.get("/me/current-route", driverOnly, async (req, res) => {
    try {
        // 1. Resolve driver record from the logged-in user account
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

        // 2. Find the most recent route created in the last 24 hours that has at least one pending stop.
        //    The 24h window prevents stale routes from previous days surfacing here.
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

        // 3. Fetch stops with order details
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

// ─── POST / ── create a new driver (admin/superadmin only) ───────────────────
// Optional: pass user_id to link the driver record to an existing login account.
// The user_id is validated to belong to the same org before insertion.
router.post("/", adminOrAbove, async (req, res) => {
    const { name, phone, vehicle_capacity_kg, home_lat, home_lng, user_id } = req.body;

    if (!name || vehicle_capacity_kg == null || home_lat == null || home_lng == null) {
        return res.status(400).json({
            message: "name, vehicle_capacity_kg, home_lat, and home_lng are required"
        });
    }

    try {
        // If user_id is provided, verify it belongs to the same org (cross-tenant guard)
        if (user_id != null) {
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
            `INSERT INTO drivers (org_id, user_id, name, phone, vehicle_capacity_kg, home_lat, home_lng)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, user_id, name, phone, vehicle_capacity_kg, home_lat, home_lng, is_active, created_at`,
            [req.user.orgId, user_id ?? null, name, phone || null, vehicle_capacity_kg, home_lat, home_lng]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("create driver error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── PUT /:id ── update a driver (admin/superadmin only) ─────────────────────
// user_id linking is the most sensitive field here. Restrictions:
//   1. Only admin/superadmin can call this endpoint at all.
//   2. If user_id is being set, the user must belong to the same org as the driver.
//   3. A driver cannot change their own user_id via any other endpoint.
router.put("/:id", adminOrAbove, async (req, res) => {
    const { name, phone, vehicle_capacity_kg, home_lat, home_lng, is_active, user_id } = req.body;

    try {
        // Cross-tenant guard: if user_id is explicitly being set (not undefined),
        // verify the target user belongs to the same org.
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

        // Use CASE instead of COALESCE for user_id so callers can explicitly set it to NULL
        // (to unlink an account from a driver) by passing user_id: null.
        // COALESCE($7, user_id) would silently ignore null and keep the old value.
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
                user_id !== undefined,   // $7: true = "caller wants to change user_id"
                user_id ?? null,         // $8: the new value (can be null to unlink)
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
