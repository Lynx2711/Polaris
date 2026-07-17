//connection pool: openeing new db connection per request is slow. a pool keeps a set of connections open and reuses them

import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
})

export { pool }
