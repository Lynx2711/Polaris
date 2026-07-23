import { Router } from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

// ─── GET /:id ── get route by ID (org-scoped) ────────────────
router.get("/:id", async (req, res) => {
    try {
        // Query the route, scoped by org_id
        const routeResult = await pool.query(
            "SELECT id, org_id, solve_job_id, driver_id, total_distance_km, total_duration_min, geometry FROM routes WHERE id = $1 AND org_id = $2",
            [req.params.id, req.user.orgId]
        );

        if (routeResult.rows.length === 0) {
            return res.status(404).json({ message: "route not found" });
        }

        const route = routeResult.rows[0];

        // Query route stops and join with orders, ordered by sequence_no
        const stopsResult = await pool.query(
            `SELECT rs.sequence_no, rs.eta, rs.status, o.id as order_id,
                    o.address, o.lat, o.lng
             FROM route_stops rs
             JOIN orders o ON o.id = rs.order_id
             WHERE rs.route_id = $1
             ORDER BY rs.sequence_no`,
            [route.id]
        );

        // Format stops array
        const stops = stopsResult.rows.map(s => ({
            order_id: s.order_id,
            sequence_no: s.sequence_no,
            eta: s.eta,
            status: s.status,
            lat: parseFloat(s.lat),
            lng: parseFloat(s.lng),
            address: s.address
        }));

        // Parse geometry safely from JSONB column
        let parsedGeometry = null;
        if (route.geometry) {
            parsedGeometry = typeof route.geometry === "string" ? JSON.parse(route.geometry) : route.geometry;
        }

        res.json({
            id: route.id,
            driver_id: route.driver_id,
            total_distance_km: route.total_distance_km ? parseFloat(route.total_distance_km) : 0.0,
            total_duration_min: route.total_duration_min ? parseFloat(route.total_duration_min) : 0.0,
            stops: stops,
            geometry: parsedGeometry
        });
    } catch (err) {
        console.error("get route error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

export default router;
