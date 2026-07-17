//trigger and poll solve jobs. when the dispatcher clicks "optimize routes", this is the endpoint that gets called

import { Router } from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// all job routes require authentication
router.use(authenticateToken);

// ─── POST / ── create (trigger) a new solve job ──────────────
router.post("/", async (req, res) => {
    try {
        const result = await pool.query(
            "INSERT INTO solve_jobs (org_id) VALUES ($1) RETURNING id, org_id, status, requested_at, completed_at, error_message",
            [req.user.orgId]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("create job error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── GET / ── list all solve jobs for the org ────────────────
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, status, requested_at, completed_at, error_message FROM solve_jobs WHERE org_id = $1 ORDER BY requested_at DESC",
            [req.user.orgId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("list jobs error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

// ─── GET /:id ── poll a specific job's status ────────────────
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, status, requested_at, completed_at, error_message FROM solve_jobs WHERE id = $1 AND org_id = $2",
            [req.params.id, req.user.orgId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "job not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("get job error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

export default router;