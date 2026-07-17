//crud for drivers, scoped to current user's org so that dispatchers can add/edit/view their fleet

import { Router } from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// all driver routes require authentication
router.use(authenticateToken);

// ─── GET / ── list all drivers for the org ───────────────────
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, phone, vehicle_capacity_kg, home_lat, home_lng, is_active, created_at FROM drivers WHERE org_id = $1 ORDER BY created_at DESC",
            [req.user.orgId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("list drivers error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── GET /:id ── get a single driver ─────────────────────────
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, phone, vehicle_capacity_kg, home_lat, home_lng, is_active, created_at FROM drivers WHERE id = $1 AND org_id = $2",
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

// ─── POST / ── create a new driver ───────────────────────────
router.post("/", async (req, res) => {
    const { name, phone, vehicle_capacity_kg, home_lat, home_lng } = req.body;

    if (!name || vehicle_capacity_kg == null || home_lat == null || home_lng == null) {
        return res.status(400).json({ message: "name, vehicle_capacity_kg, home_lat, and home_lng are required" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO drivers (org_id, name, phone, vehicle_capacity_kg, home_lat, home_lng)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, name, phone, vehicle_capacity_kg, home_lat, home_lng, is_active, created_at`,
            [req.user.orgId, name, phone || null, vehicle_capacity_kg, home_lat, home_lng]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("create driver error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── PUT /:id ── update a driver ─────────────────────────────
router.put("/:id", async (req, res) => {
    const { name, phone, vehicle_capacity_kg, home_lat, home_lng, is_active } = req.body;

    try {
        const result = await pool.query(
            `UPDATE drivers
             SET name = COALESCE($1, name),
                 phone = COALESCE($2, phone),
                 vehicle_capacity_kg = COALESCE($3, vehicle_capacity_kg),
                 home_lat = COALESCE($4, home_lat),
                 home_lng = COALESCE($5, home_lng),
                 is_active = COALESCE($6, is_active)
             WHERE id = $7 AND org_id = $8
             RETURNING id, name, phone, vehicle_capacity_kg, home_lat, home_lng, is_active, created_at`,
            [name, phone, vehicle_capacity_kg, home_lat, home_lng, is_active, req.params.id, req.user.orgId]
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

// ─── DELETE /:id ── soft-delete a driver ─────────────────────
router.delete("/:id", async (req, res) => {
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
