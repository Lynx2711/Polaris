// PostgreSQL Connection Pool Setup
// Opening a new database connection for every incoming HTTP request is expensive and slow.
// A connection pool maintains a reusable set of active connections to improve performance and throughput.

import pg from "pg";         // PostgreSQL client library for Node.js
import dotenv from "dotenv"; // dotenv loads environment variables from a .env file into process.env

// Load environment variables from .env file into Node's process.env object
dotenv.config();

// Create a new PostgreSQL connection pool instance using the connection string URI
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL, // Database connection string (e.g. postgresql://user:pass@localhost:5432/dbname)
});

// Export the database connection pool so other modules (controllers, routes) can execute SQL queries
export { pool };

