import pool from '../config/db.js';

// In-Memory user storage for offline fallback in development mode
const MEMORY_USERS = [];
let nextId = 1;

const isDev = process.env.NODE_ENV !== 'production';

// Helper to run query with fallback
const executeWithFallback = async (dbQueryFn, fallbackFn) => {
  try {
    return await dbQueryFn();
  } catch (error) {
    if (isDev) {
      console.warn('\n======================================================');
      console.warn('DATABASE CONNECTION FAILED: using local memory fallback.');
      console.warn('Error detail:', error.message);
      console.warn('======================================================\n');
      return fallbackFn();
    }
    throw error;
  }
};

export const User = {
  async create({ fullName, email, passwordHash = null, role = 'user', googleId = null, avatarUrl = null }) {
    return executeWithFallback(
      async () => {
        const [result] = await pool.execute(
          `INSERT INTO users (full_name, email, password_hash, role, google_id, avatar_url) VALUES (?, ?, ?, ?, ?, ?)`,
          [fullName, email, passwordHash, role, googleId, avatarUrl]
        );
        return { id: result.insertId, fullName, email, role, googleId, avatarUrl };
      },
      () => {
        const user = {
          id: nextId++,
          full_name: fullName,
          fullName,
          email,
          password_hash: passwordHash,
          passwordHash,
          role,
          google_id: googleId,
          googleId,
          avatar_url: avatarUrl,
          avatarUrl,
          created_at: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        MEMORY_USERS.push(user);
        return user;
      }
    );
  },

  async findByEmail(email) {
    return executeWithFallback(
      async () => {
        const [rows] = await pool.execute(
          `SELECT * FROM users WHERE email = ?`,
          [email]
        );
        return rows[0] || null;
      },
      () => {
        const user = MEMORY_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        return user || null;
      }
    );
  },

  async findByGoogleId(googleId) {
    return executeWithFallback(
      async () => {
        const [rows] = await pool.execute(
          `SELECT * FROM users WHERE google_id = ?`,
          [googleId]
        );
        return rows[0] || null;
      },
      () => {
        const user = MEMORY_USERS.find(u => u.google_id === googleId);
        return user || null;
      }
    );
  },

  async findById(id) {
    const numericId = Number(id);
    return executeWithFallback(
      async () => {
        const [rows] = await pool.execute(
          `SELECT id, full_name as fullName, email, role, google_id as googleId, avatar_url as avatarUrl, created_at as createdAt, updated_at as updatedAt FROM users WHERE id = ?`,
          [numericId]
        );
        return rows[0] || null;
      },
      () => {
        const user = MEMORY_USERS.find(u => Number(u.id) === numericId);
        if (!user) return null;
        return {
          id: user.id,
          fullName: user.full_name || user.fullName,
          email: user.email,
          role: user.role,
          googleId: user.google_id || user.googleId,
          avatarUrl: user.avatar_url || user.avatarUrl,
          createdAt: user.created_at || user.createdAt
        };
      }
    );
  },

  async updateProfile(id, { fullName, email }) {
    const numericId = Number(id);
    return executeWithFallback(
      async () => {
        await pool.execute(
          `UPDATE users SET full_name = ?, email = ? WHERE id = ?`,
          [fullName, email, numericId]
        );
        return this.findById(numericId);
      },
      () => {
        const user = MEMORY_USERS.find(u => Number(u.id) === numericId);
        if (user) {
          user.full_name = fullName;
          user.fullName = fullName;
          user.email = email;
        }
        return this.findById(numericId);
      }
    );
  },

  async updatePassword(id, passwordHash) {
    const numericId = Number(id);
    return executeWithFallback(
      async () => {
        await pool.execute(
          `UPDATE users SET password_hash = ? WHERE id = ?`,
          [passwordHash, numericId]
        );
        return true;
      },
      () => {
        const user = MEMORY_USERS.find(u => Number(u.id) === numericId);
        if (user) {
          user.password_hash = passwordHash;
          user.passwordHash = passwordHash;
        }
        return true;
      }
    );
  },

  async saveResetToken(id, token, expiresAt) {
    const numericId = Number(id);
    return executeWithFallback(
      async () => {
        await pool.execute(
          `UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?`,
          [token, expiresAt, numericId]
        );
        return true;
      },
      () => {
        const user = MEMORY_USERS.find(u => Number(u.id) === numericId);
        if (user) {
          user.reset_token = token;
          user.reset_token_expires_at = expiresAt;
        }
        return true;
      }
    );
  },

  async findByResetToken(token) {
    return executeWithFallback(
      async () => {
        const [rows] = await pool.execute(
          `SELECT * FROM users WHERE reset_token = ? AND reset_token_expires_at > NOW()`,
          [token]
        );
        return rows[0] || null;
      },
      () => {
        const user = MEMORY_USERS.find(u => u.reset_token === token && new Date(u.reset_token_expires_at) > new Date());
        return user || null;
      }
    );
  },

  async clearResetToken(id) {
    const numericId = Number(id);
    return executeWithFallback(
      async () => {
        await pool.execute(
          `UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?`,
          [numericId]
        );
        return true;
      },
      () => {
        const user = MEMORY_USERS.find(u => Number(u.id) === numericId);
        if (user) {
          user.reset_token = null;
          user.reset_token_expires_at = null;
        }
        return true;
      }
    );
  }
};
