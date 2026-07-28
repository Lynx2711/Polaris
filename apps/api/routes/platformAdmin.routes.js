import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Middleware to restrict access to superadmins
const verifySuperadmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Platform Admin access required' });
  }
};

// Apply protect and superadmin verification to all routes below
router.use(protect);
router.use(verifySuperadmin);

// GET /api/platform-admin/stats - Global Platform Stats from DB
router.get('/stats', async (req, res) => {
  try {
    const orgsRes = await pool.query('SELECT COUNT(*) FROM organizations');
    const usersRes = await pool.query('SELECT COUNT(*) FROM users');
    const driversRes = await pool.query('SELECT COUNT(*) FROM drivers');
    const ordersRes = await pool.query('SELECT COUNT(*) FROM orders');
    const routesRes = await pool.query('SELECT COUNT(*) FROM routes');

    res.json({
      organizationsCount: parseInt(orgsRes.rows[0].count, 10),
      usersCount: parseInt(usersRes.rows[0].count, 10),
      driversCount: parseInt(driversRes.rows[0].count, 10),
      ordersCount: parseInt(ordersRes.rows[0].count, 10),
      routesCount: parseInt(routesRes.rows[0].count, 10),
    });
  } catch (err) {
    console.error('[platformAdmin/getStats] error:', err);
    res.status(500).json({ error: 'Internal server error fetching platform stats' });
  }
});

// GET /api/platform-admin/users - All platform users across organizations
router.get('/users', async (req, res) => {
  try {
    const usersQuery = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.created_at,
        o.name as org_name,
        o.slug as org_slug
      FROM users u
      LEFT JOIN organizations o ON u.org_id = o.id
      ORDER BY u.created_at DESC
    `);
    res.json(usersQuery.rows);
  } catch (err) {
    console.error('[platformAdmin/getAllUsers] error:', err);
    res.status(500).json({ error: 'Internal server error fetching users' });
  }
});

// GET /api/platform-admin/organizations - Get all organizations with stats
router.get('/organizations', async (req, res) => {
  try {
    const orgsQuery = await pool.query(`
      SELECT 
        o.id, 
        o.name, 
        o.slug, 
        o.plan, 
        o.created_at,
        (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id) as user_count,
        (SELECT COUNT(*) FROM drivers d WHERE d.org_id = o.id) as driver_count,
        (SELECT COUNT(*) FROM routes r WHERE r.org_id = o.id) as route_count
      FROM organizations o
      ORDER BY o.created_at DESC
    `);
    res.json(orgsQuery.rows);
  } catch (err) {
    console.error('[platformAdmin/getOrgs] error:', err);
    res.status(500).json({ error: 'Internal server error fetching organizations' });
  }
});

// POST /api/platform-admin/organizations - Add new organization & its initial admin
router.post('/organizations', async (req, res) => {
  const { name, slug, adminEmail, adminPassword, adminName } = req.body;

  if (!name || !slug || !adminEmail || !adminPassword || !adminName) {
    return res.status(400).json({ error: 'All fields are required (name, slug, adminEmail, adminPassword, adminName)' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check slug collision
    const existingOrg = await client.query('SELECT id FROM organizations WHERE slug = $1', [slug]);
    if (existingOrg.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Organization URL slug already taken' });
    }

    // Check email collision
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Admin email already exists in system' });
    }

    // 1. Insert organization
    const orgResult = await client.query(
      'INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id',
      [name, slug]
    );
    const orgId = orgResult.rows[0].id;

    // 2. Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // 3. Insert initial admin user
    await client.query(
      'INSERT INTO users (org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5)',
      [orgId, adminEmail, passwordHash, adminName, 'admin']
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Organization and initial admin created successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[platformAdmin/createOrg] error:', err);
    res.status(500).json({ error: 'Internal server error creating organization' });
  } finally {
    client.release();
  }
});

// GET /api/platform-admin/organizations/:id/users - Get all staff/users for an organization
router.get('/organizations/:id/users', async (req, res) => {
  try {
    const usersQuery = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE org_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(usersQuery.rows);
  } catch (err) {
    console.error('[platformAdmin/getOrgUsers] error:', err);
    res.status(500).json({ error: 'Internal server error fetching organization users' });
  }
});

// POST /api/platform-admin/organizations/:id/users - Add a new staff user to an organization
router.post('/organizations/:id/users', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    // Check email uniqueness
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash('password123', 10);

    const newUser = await pool.query(
      `INSERT INTO users (org_id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, 'dispatcher')
       RETURNING id, name, email, role, created_at`,
      [req.params.id, email, passwordHash, name]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error('[platformAdmin/addOrgUser] error:', err);
    res.status(500).json({ error: 'Internal server error adding user to organization' });
  }
});

export default router;
