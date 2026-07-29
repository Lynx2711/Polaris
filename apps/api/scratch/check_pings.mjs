import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query(`
  SELECT driver_id, lat, lng, recorded_at,
    NOW() - recorded_at AS age
  FROM location_pings
  ORDER BY recorded_at DESC
  LIMIT 10
`);
console.log('\n=== Recent location_pings ===');
if (r.rows.length === 0) {
  console.log('  [EMPTY] No location pings exist in DB — driver GPS was never received/saved');
} else {
  console.table(r.rows.map(row => ({
    driver_id: row.driver_id,
    lat: parseFloat(row.lat).toFixed(5),
    lng: parseFloat(row.lng).toFixed(5),
    recorded_at: new Date(row.recorded_at).toLocaleTimeString(),
    age_seconds: Math.round(parseFloat(row.age) / 1000 / 1000), // interval in microseconds
  })));
}

// Check what the solver would see right now (10-min window)
const fresh = await pool.query(`
  SELECT DISTINCT ON (driver_id) driver_id, lat, lng, recorded_at
  FROM location_pings
  WHERE recorded_at > NOW() - INTERVAL '10 minutes'
  ORDER BY driver_id, recorded_at DESC
`);
console.log(`\n=== Fresh pings (within 10 min) — WHAT SOLVER USES ===`);
if (fresh.rows.length === 0) {
  console.log('  [NONE] Solver would use home_lat/home_lng for ALL drivers — live location NOT applied');
} else {
  console.table(fresh.rows);
}

await pool.end();
