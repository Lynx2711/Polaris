// Direct Authentication Routes Module (PostgreSQL Transactional Register & Login)
// Provides standalone REST API endpoints for user registration with organization creation and password login.

import { Router } from "express";     // Express Router class
import bcrypt from "bcryptjs";        // Password hashing library
import jwt from "jsonwebtoken";       // JWT library for session tokens
import { pool } from "../db.js";       // PostgreSQL database connection pool

const router = Router(); // Instantiate router instance

// ─── POST /register ──────────────────────────────────────────
/**
 * Registers a new organization and admin user within a single atomic database transaction.
 * Payload: { email, password, name, orgName, orgSlug }
 */
router.post("/register", async (req, res) => {
    const { email, password, name, orgName, orgSlug } = req.body;

    // Step 1: Validate mandatory input parameters
    if (!email || !password || !name || !orgName || !orgSlug) {
        return res.status(400).json({ message: "all fields are required (email, password, name, orgName, orgSlug)" });
    }

    // Acquire dedicated client from connection pool for atomic transaction management
    const client = await pool.connect();
    try {
        await client.query("BEGIN"); // Begin PostgreSQL transaction

        // Step 2: Verify email uniqueness in database
        const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "email already exists" });
        }

        // Step 3: Verify organization slug uniqueness
        const existingOrg = await client.query("SELECT id FROM organizations WHERE slug = $1", [orgSlug]);
        if (existingOrg.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "organization slug already taken" });
        }

        // Step 4: Insert new organization record
        const org = await client.query(
            "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id",
            [orgName, orgSlug]
        );
        const orgId = org.rows[0].id; // Get created organization ID

        // Step 5: Hash raw password with bcrypt salt rounds = 10
        const hashedPassword = await bcrypt.hash(password, 10);

        // Step 6: Insert new user record assigned as 'admin' of newly created organization
        const user = await client.query(
            "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'admin') RETURNING id, org_id, email, name, role, created_at",
            [orgId, email, hashedPassword, name]
        );

        // Commit transaction changes to database
        await client.query("COMMIT");

        // Step 7: Generate signed JWT token containing user ID, org ID, and role claims
        const token = jwt.sign(
            { id: user.rows[0].id, orgId: user.rows[0].org_id, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Return 201 Created with JWT token and created user record
        res.status(201).json({ token, user: user.rows[0] });
    } catch (err) {
        await client.query("ROLLBACK"); // Roll back transaction on error
        console.error("register error:", err);
        res.status(500).json({ message: "internal server error" });
    } finally {
        client.release(); // Release client connection back to pool
    }
});

// ─── POST /login ─────────────────────────────────────────────
/**
 * Authenticates user credentials and returns signed JWT token.
 * Payload: { email, password }
 */
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Step 1: Validate payload parameters
    if (!email || !password) {
        return res.status(400).json({ message: "email and password are required" });
    }

    try {
        // Step 2: Query database for matching user by email
        const result = await pool.query(
            "SELECT id, org_id, email, password_hash, name, role FROM users WHERE email = $1",
            [email]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "user not found" });
        }

        const user = result.rows[0];

        // Step 3: Compare submitted password against stored password hash
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: "invalid password" });
        }

        // Step 4: Generate signed JWT session token
        const token = jwt.sign(
            { id: user.id, orgId: user.org_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Strip password_hash field before sending user object back to client
        const { password_hash, ...safeUser } = user;
        res.status(200).json({ token, user: safeUser });
    } catch (err) {
        console.error("login error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

export default router; // Export router

