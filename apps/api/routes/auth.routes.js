//user gets their jwt tokens here. two endpoints: /register and /login.

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = Router();

// ─── POST /register ──────────────────────────────────────────
router.post("/register", async (req, res) => {
    const { email, password, name, orgName, orgSlug } = req.body;

    //1. validate the incoming data
    if (!email || !password || !name || !orgName || !orgSlug) {
        return res.status(400).json({ message: "all fields are required (email, password, name, orgName, orgSlug)" });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        //2. check if the email already exists
        const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "email already exists" });
        }

        //3. check if the org slug is taken
        const existingOrg = await client.query("SELECT id FROM organizations WHERE slug = $1", [orgSlug]);
        if (existingOrg.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "organization slug already taken" });
        }

        //4. create the organization
        const org = await client.query(
            "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id",
            [orgName, orgSlug]
        );
        const orgId = org.rows[0].id;

        //5. hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        //6. insert the new user as admin of the new org
        const user = await client.query(
            "INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'admin') RETURNING id, org_id, email, name, role, created_at",
            [orgId, email, hashedPassword, name]
        );

        await client.query("COMMIT");

        //7. create a jwt token with orgId and role
        const token = jwt.sign(
            { id: user.rows[0].id, orgId: user.rows[0].org_id, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(201).json({ token, user: user.rows[0] });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("register error:", err);
        res.status(500).json({ message: "internal server error" });
    } finally {
        client.release();
    }
});

// ─── POST /login ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    //1. validate the incoming data
    if (!email || !password) {
        return res.status(400).json({ message: "email and password are required" });
    }

    try {
        //2. find the user by email
        const result = await pool.query(
            "SELECT id, org_id, email, password_hash, name, role FROM users WHERE email = $1",
            [email]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "user not found" });
        }

        const user = result.rows[0];

        //3. compare the password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: "invalid password" });
        }

        //4. create a jwt token with orgId and role
        const token = jwt.sign(
            { id: user.id, orgId: user.org_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // don't send password_hash back to the client
        const { password_hash, ...safeUser } = user;
        res.status(200).json({ token, user: safeUser });
    } catch (err) {
        console.error("login error:", err);
        res.status(500).json({ message: "internal server error" });
    }
});

export default router;
