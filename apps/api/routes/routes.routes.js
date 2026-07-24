import { Router } from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { dispatcherOrAbove, driverOnly } from "../middleware/requireRole.js";

const router = Router();
router.use(authenticateToken);

// ─── GET /:id ── get route by ID (org-scoped) ─────────────────────────────────
// Used by: dispatcher to view routes, driver page (after resolving their route ID)
router.get("/:id", dispatcherOrAbove, async (req, res) => {
    try {
        const routeResult = await pool.query(
            "SELECT id, org_id, solve_job_id, driver_id, total_distance_km, total_duration_min, geometry FROM routes WHERE id = $1 AND org_id = $2",
            [req.params.id, req.user.orgId]
        );

        if (routeResult.rows.length === 0) {
            return res.status(404).json({ message: "route not found" });
        }

        const route = routeResult.rows[0];

        const stopsResult = await pool.query(
            `SELECT rs.id as stop_id, rs.sequence_no, rs.eta, rs.status, o.id as order_id,
                    o.address, o.lat, o.lng, o.weight_kg, o.deadline_end
             FROM route_stops rs
             JOIN orders o ON o.id = rs.order_id
             WHERE rs.route_id = $1
             ORDER BY rs.sequence_no`,
            [route.id]
        );

        const stops = stopsResult.rows.map(s => ({
            stop_id: s.stop_id,
            order_id: s.order_id,
            sequence_no: s.sequence_no,
            eta: s.eta,
            status: s.status,
            lat: parseFloat(s.lat),
            lng: parseFloat(s.lng),
            address: s.address,
            weight_kg: parseFloat(s.weight_kg),
            deadline_end: s.deadline_end,
        }));

        let parsedGeometry = null;
        if (route.geometry) {
            parsedGeometry = typeof route.geometry === "string" ? JSON.parse(route.geometry) : route.geometry;
        }

        res.json({
            id: route.id,
            driver_id: route.driver_id,
            total_distance_km: route.total_distance_km ? parseFloat(route.total_distance_km) : 0.0,
            total_duration_min: route.total_duration_min ? parseFloat(route.total_duration_min) : 0.0,
            stops,
            geometry: parsedGeometry
        });
    } catch (err) {
        console.error("get route error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── PATCH /:id/stops/:orderId ── mark a stop as delivered ───────────────────
// Called by the driver app when they tap "Mark Delivered" on a stop.
// Updates route_stops.status → 'delivered' and orders.status → 'delivered'.
// Also records the actual delivery time (sets eta to NOW() if not already set).
router.patch("/:id/stops/:orderId", driverOnly, async (req, res) => {
    const routeId = parseInt(req.params.id, 10);
    const orderId = parseInt(req.params.orderId, 10);
    const { status = "delivered" } = req.body; // allow 'arrived' | 'delivered'

    const VALID_STATUSES = ["arrived", "delivered", "failed"];
    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Verify the route belongs to this org
        const routeCheck = await client.query(
            "SELECT id, driver_id FROM routes WHERE id = $1 AND org_id = $2",
            [routeId, req.user.orgId]
        );
        if (routeCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "route not found" });
        }

        // Verify the stop exists on this route
        const stopCheck = await client.query(
            "SELECT id FROM route_stops WHERE route_id = $1 AND order_id = $2",
            [routeId, orderId]
        );
        if (stopCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "stop not found on this route" });
        }

        // Update route_stops.status (and record actual delivery time as eta if delivering)
        const stopUpdate = await client.query(
            `UPDATE route_stops
             SET status = $1,
                 eta    = CASE WHEN $1 = 'delivered' AND eta IS NULL THEN NOW() ELSE eta END
             WHERE route_id = $2 AND order_id = $3
             RETURNING id, sequence_no, status, eta`,
            [status, routeId, orderId]
        );

        // Mirror to orders.status
        const orderStatus = status === "delivered" ? "delivered"
                          : status === "failed"    ? "failed"
                          : "in_transit";

        await client.query(
            "UPDATE orders SET status = $1 WHERE id = $2 AND org_id = $3",
            [orderStatus, orderId, req.user.orgId]
        );

        await client.query("COMMIT");

        res.json({
            stop_id: stopUpdate.rows[0].id,
            sequence_no: stopUpdate.rows[0].sequence_no,
            order_id: orderId,
            status: stopUpdate.rows[0].status,
            eta: stopUpdate.rows[0].eta,
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("mark stop delivered error:", err);
        res.status(500).json({ message: "internal server error" });
    } finally {
        client.release();
    }
});

export default router;
