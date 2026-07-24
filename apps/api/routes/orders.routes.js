// orders.routes.js — CRUD for delivery orders, org-scoped + role-gated.
//
// Role matrix:
//   GET /     → dispatcher, admin, superadmin (drivers don't browse raw orders)
//   GET /:id  → dispatcher, admin, superadmin
//   POST /    → dispatcher, admin, superadmin (dispatchers create orders)
//   PUT /:id  → dispatcher, admin, superadmin
//   DELETE /  → admin, superadmin only (destructive — dispatcher can only read/create)

import { Router } from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { dispatcherOrAbove, adminOrAbove } from "../middleware/requireRole.js";

const router = Router();

// All order routes require a valid JWT
router.use(authenticateToken);

// ─── GET / ── list all orders for the org (optional ?status= filter) ─────────
router.get("/", dispatcherOrAbove, async (req, res) => {
    try {
        const { status } = req.query;
        let query = `SELECT id, address, lat, lng, weight_kg,
                            deadline_start, deadline_end, status, created_at
                     FROM orders
                     WHERE org_id = $1`;
        const params = [req.user.orgId];

        if (status) {
            query += " AND status = $2";
            params.push(status);
        }

        query += " ORDER BY created_at DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("list orders error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── GET /:id ── get a single order ──────────────────────────────────────────
router.get("/:id", dispatcherOrAbove, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, address, lat, lng, weight_kg,
                    deadline_start, deadline_end, status, created_at
             FROM orders
             WHERE id = $1 AND org_id = $2`,
            [req.params.id, req.user.orgId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "order not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("get order error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── POST / ── create a new order ────────────────────────────────────────────
router.post("/", dispatcherOrAbove, async (req, res) => {
    const { address, lat, lng, weight_kg, deadline_start, deadline_end } = req.body;

    if (!address || lat == null || lng == null || weight_kg == null || !deadline_start || !deadline_end) {
        return res.status(400).json({
            message: "address, lat, lng, weight_kg, deadline_start, and deadline_end are required"
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO orders (org_id, address, lat, lng, weight_kg, deadline_start, deadline_end)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, address, lat, lng, weight_kg, deadline_start, deadline_end, status, created_at`,
            [req.user.orgId, address, lat, lng, weight_kg, deadline_start, deadline_end]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("create order error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── PUT /:id ── update an order ─────────────────────────────────────────────
router.put("/:id", dispatcherOrAbove, async (req, res) => {
    const { address, lat, lng, weight_kg, deadline_start, deadline_end, status } = req.body;

    try {
        const result = await pool.query(
            `UPDATE orders
             SET address        = COALESCE($1, address),
                 lat            = COALESCE($2, lat),
                 lng            = COALESCE($3, lng),
                 weight_kg      = COALESCE($4, weight_kg),
                 deadline_start = COALESCE($5, deadline_start),
                 deadline_end   = COALESCE($6, deadline_end),
                 status         = COALESCE($7, status)
             WHERE id = $8 AND org_id = $9
             RETURNING id, address, lat, lng, weight_kg, deadline_start, deadline_end, status, created_at`,
            [address, lat, lng, weight_kg, deadline_start, deadline_end, status, req.params.id, req.user.orgId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "order not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("update order error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── DELETE /:id ── delete an order (admin/superadmin only) ──────────────────
// Destructive — restricted to admin. Dispatchers can create and edit but not destroy.
router.delete("/:id", adminOrAbove, async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM orders WHERE id = $1 AND org_id = $2 RETURNING id",
            [req.params.id, req.user.orgId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "order not found" });
        }
        res.json({ message: "order deleted" });
    } catch (err) {
        console.error("delete order error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

export default router;
