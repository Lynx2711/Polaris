// Protect Middleware
// Verifies JWT tokens provided via HTTP cookies or Authorization Bearer header,
// queries PostgreSQL database for user details, and attaches user record to req.user.

import { verifyToken } from '../utils/jwt.js'; // Import token verification helper
import { pool } from '../db.js';                 // Import database connection pool

/**
 * Route protection middleware that validates user session and fetches active user profile.
 */
export const protect = async (req, res, next) => {
  let token; // Variable to store extracted token string

  // Check if token exists in HTTP-only cookies first
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  // Fallback: check if token exists in Authorization header ("Bearer <token>")
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token was found in cookies or headers, return 401 Unauthorized
  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    // Cryptographically verify and decode the token
    const decoded = verifyToken(token);
    // If decoding failed or missing user ID claim, reject request
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Not authorized, invalid token' });
    }

    // Query PostgreSQL database to fetch fresh user details by ID
    const userResult = await pool.query(
      'SELECT id, org_id as "orgId", email, name, role FROM users WHERE id = $1',
      [decoded.id]
    );

    // If user record no longer exists in database, reject request
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    // Attach full authenticated user object (id, orgId, email, name, role) to request
    req.user = userResult.rows[0];
    // Proceed to downstream route handler
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

