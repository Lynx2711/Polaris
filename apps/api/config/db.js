// MySQL Connection Pool Setup
// Manages reusable MySQL database connections using Promise-based API for async/await usage

import mysql from 'mysql2/promise'; // MySQL library with native Promises support
import dotenv from 'dotenv';         // Module to load environment variables from .env

// Load environment variables into process.env
dotenv.config();

// Create and configure a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',          // Database server hostname or IP address
  user: process.env.DB_USER || 'root',               // Database authentication username
  password: process.env.DB_PASSWORD || '',           // Database authentication password
  database: process.env.DB_NAME || 'polaris',        // Target database name
  port: parseInt(process.env.DB_PORT || '3306', 10), // Database port number (default 3306)
  waitForConnections: true,                          // Queue incoming queries when all connections are busy
  connectionLimit: 10,                               // Max number of active database connections in pool
  queueLimit: 0,                                     // Unlimited queued query requests
});

// Export default pool instance for use in database queries across the application
export default pool;

