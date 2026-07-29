import { pool } from '../apps/api/db.js';
import bcrypt from 'bcryptjs';

async function check() {
  try {
    const res = await pool.query("SELECT id, email, password_hash, role FROM users WHERE email = $1", ['driver1@demo.com']);
    if (res.rows.length === 0) {
      console.log("User driver1@demo.com not found in DB.");
      process.exit(1);
    }
    const user = res.rows[0];
    console.log("User found:", user);
    const isMatch = await bcrypt.compare("password123", user.password_hash);
    console.log("Does 'password123' match password_hash?", isMatch);
    process.exit(0);
  } catch (err) {
    console.error("Error checking:", err);
    process.exit(1);
  }
}

check();
