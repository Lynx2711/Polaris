import { verifyToken } from '../utils/jwt.js';
import { pool } from '../db.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Not authorized, invalid token' });
    }

    const userResult = await pool.query(
      'SELECT id, org_id as "orgId", email, name, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};
