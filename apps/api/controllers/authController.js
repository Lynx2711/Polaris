// authController.js — rewritten to use the real PostgreSQL pool (pg),
// matching the actual schema from docs/db-schema.sql.
// Replaces the previous MySQL/in-memory stub.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { pool } from '../db.js'; // ← real pg pool (DATABASE_URL → postgres)

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
  }
  return null;
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Creates an organization + admin user in one transaction.
// Expects: { fullName, email, password, orgName?, orgSlug? }
// orgName/orgSlug are optional — if omitted, auto-derived from fullName/email.
export const register = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { fullName, email, password, orgName, orgSlug } = req.body;

  // Derive org values if not provided
  const resolvedOrgName = orgName || `${fullName}'s Organization`;
  const resolvedOrgSlug = orgSlug ||
    email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check email uniqueness
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email already in use' });
    }

    // 2. Create organization
    const orgResult = await client.query(
      "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id",
      [resolvedOrgName, resolvedOrgSlug]
    );
    const orgId = orgResult.rows[0].id;

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Insert user (schema col is 'name', not 'full_name')
    const userResult = await client.query(
      `INSERT INTO users (org_id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, org_id, email, name, role, created_at`,
      [orgId, email, passwordHash, fullName]
    );

    await client.query('COMMIT');

    res.status(201).json({ message: 'Account created successfully. Please log in.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[register] error:', err);
    if (err.code === '23505') { // unique_violation (e.g. org slug collision)
      return res.status(409).json({ error: 'Organization slug already taken. Try a different email or org name.' });
    }
    res.status(500).json({ error: 'Internal server error during registration' });
  } finally {
    client.release();
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Returns: { token, user: { id, name, email, role, orgId } }
// Token is signed with { id, orgId, role } — same shape all protected routes expect.
export const login = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, org_id, email, password_hash, name, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign token with id, orgId, role — required by authenticateToken middleware
    const token = jwt.sign(
      { id: user.id, orgId: user.org_id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set httpOnly cookie (browser-based session)
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Also return token in the body so the frontend can store it in localStorage
    // for attaching to /api/* requests
    res.json({
      token,
      user: {
        id: user.id,
        orgId: user.org_id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    console.error('[login] error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
export const logout = async (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'lax' });
  res.json({ message: 'Logged out successfully' });
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Returns the current logged-in user's info (requires protect middleware).
export const me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, org_id, email, name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = result.rows[0];
    res.json({ id: u.id, orgId: u.org_id, name: u.name, email: u.email, role: u.role });
  } catch (err) {
    console.error('[me] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { fullName, email } = req.body;
  const userId = req.user.id;

  try {
    const clash = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );
    if (clash.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use by another account' });
    }

    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, org_id, email, name, role',
      [fullName, email, userId]
    );
    const u = result.rows[0];
    res.json({ id: u.id, orgId: u.org_id, name: u.name, email: u.email, role: u.role });
  } catch (err) {
    console.error('[updateProfile] error:', err);
    res.status(500).json({ error: 'Internal server error during profile update' });
  }
};

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
export const changePassword = async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid current password' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('[changePassword] error:', err);
    res.status(500).json({ error: 'Internal server error during password change' });
  }
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      // In production: send email. For now, log the reset token to console.
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      console.log(`\n====== PASSWORD RESET FOR: ${email} ======`);
      console.log(`Token: ${token}`);
      console.log(`Reset URL: http://localhost:5174/reset-password/${token}`);
      console.log('==========================================\n');
    }
    // Always return 200 to protect user privacy
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[forgotPassword] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
export const resetPassword = async (req, res) => {
  res.status(501).json({ message: 'Password reset via token not yet implemented.' });
};

import { OAuth2Client } from 'google-auth-library';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');

// ─── POST /api/auth/google ────────────────────────────────────────────────────
export const googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    let email, name, googleId;

    if (process.env.GOOGLE_CLIENT_ID && credential) {
      // Real Google verification
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      googleId = payload.sub;
    } else if (credential) {
      // Mock Google Login fallback if GOOGLE_CLIENT_ID is not configured
      const decoded = jwt.decode(credential);
      if (decoded) {
        email = decoded.email;
        name = decoded.name || decoded.email.split('@')[0];
        googleId = decoded.sub || 'mock_google_id_' + Date.now();
      } else {
        email = credential.includes('@') ? credential : 'dispatcher@fastcouriers.com';
        name = 'Fast Couriers Demo User';
        googleId = 'mock_google_id_123';
      }
    } else {
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    // 1. Look up user by email in PostgreSQL
    const userResult = await pool.query(
      'SELECT id, org_id, email, name, role FROM users WHERE email = $1',
      [email]
    );

    let user;
    if (userResult.rows.length > 0) {
      user = userResult.rows[0];
    } else {
      // Create user under a default demo organization
      const orgResult = await pool.query('SELECT id FROM organizations LIMIT 1');
      let orgId;
      if (orgResult.rows.length > 0) {
        orgId = orgResult.rows[0].id;
      } else {
        const newOrg = await pool.query(
          "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id",
          ["Fast Couriers Jalandhar", "fastcouriers-jal"]
        );
        orgId = newOrg.rows[0].id;
      }

      const newUser = await pool.query(
        `INSERT INTO users (org_id, email, name, role)
         VALUES ($1, $2, $3, 'admin')
         RETURNING id, org_id, email, name, role`,
        [orgId, email, name]
      );
      user = newUser.rows[0];
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, orgId: user.org_id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      token,
      user: {
        id: user.id,
        orgId: user.org_id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });

  } catch (err) {
    console.error('[googleLogin] error:', err);
    res.status(500).json({ error: 'Internal server error during Google login' });
  }
};
