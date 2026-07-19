import pool from '../config/db.js';

export const User = {
  async create({ fullName, email, passwordHash = null, role = 'user', googleId = null, avatarUrl = null }) {
    const [result] = await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, role, google_id, avatar_url) VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, email, passwordHash, role, googleId, avatarUrl]
    );
    return { id: result.insertId, fullName, email, role, googleId, avatarUrl };
  },

  async findByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );
    return rows[0] || null;
  },

  async findByGoogleId(googleId) {
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE google_id = ?`,
      [googleId]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, full_name as fullName, email, role, google_id as googleId, avatar_url as avatarUrl, created_at as createdAt, updated_at as updatedAt FROM users WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async updateProfile(id, { fullName, email }) {
    await pool.execute(
      `UPDATE users SET full_name = ?, email = ? WHERE id = ?`,
      [fullName, email, id]
    );
    return this.findById(id);
  },

  async updatePassword(id, passwordHash) {
    await pool.execute(
      `UPDATE users SET password_hash = ? WHERE id = ?`,
      [passwordHash, id]
    );
    return true;
  },

  async saveResetToken(id, token, expiresAt) {
    await pool.execute(
      `UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?`,
      [token, expiresAt, id]
    );
    return true;
  },

  async findByResetToken(token) {
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE reset_token = ? AND reset_token_expires_at > NOW()`,
      [token]
    );
    return rows[0] || null;
  },

  async clearResetToken(id) {
    await pool.execute(
      `UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?`,
      [id]
    );
    return true;
  }
};
