import { pool } from '../db.js';

// Check the unassigned orders
const orders = await pool.query(`
  SELECT id, address, lat, lng, weight_kg, deadline_start, deadline_end, status
  FROM orders WHERE id IN (33, 37)
`);
console.log('\n=== Unassigned Orders (33, 37) ===');
console.table(orders.rows.map(o => ({
  id: o.id,
  address: o.address?.substring(0, 40),
  lat: parseFloat(o.lat).toFixed(4),
  lng: parseFloat(o.lng).toFixed(4),
  weight_kg: o.weight_kg,
  status: o.status,
  window_start: new Date(o.deadline_start).toLocaleTimeString(),
  window_end: new Date(o.deadline_end).toLocaleTimeString(),
  is_expired: new Date(o.deadline_end) < new Date() ? 'YES ⚠️' : 'no',
})));

// Check all stops in the latest routes — where are the assigned orders?
const stops = await pool.query(`
  SELECT rs.route_id, rs.sequence_no, rs.order_id, o.address, o.lat, o.lng, 
    o.deadline_start, o.deadline_end
  FROM route_stops rs
  JOIN orders o ON o.id = rs.order_id
  WHERE rs.route_id IN (41, 42, 43, 44, 45, 46)
  ORDER BY rs.route_id, rs.sequence_no
`);
console.log('\n=== Stops in all Job 34 routes ===');
console.table(stops.rows.map(s => ({
  route_id: s.route_id,
  seq: s.sequence_no,
  order_id: s.order_id,
  address: s.address?.substring(0, 30),
  lat: parseFloat(s.lat).toFixed(4),
  lng: parseFloat(s.lng).toFixed(4),
  window_end: new Date(s.deadline_end).toLocaleTimeString(),
})));

// Check driver1's home vs live ping
const d1 = await pool.query(`SELECT home_lat, home_lng FROM drivers WHERE id = 19`);
const ping = await pool.query(`SELECT lat, lng, recorded_at FROM location_pings WHERE driver_id = 19 ORDER BY recorded_at DESC LIMIT 1`);
console.log('\n=== Driver1 position comparison ===');
console.log('  Home (always used as fallback):  ', d1.rows[0]);
console.log('  Live ping (used if within 10min):', ping.rows[0] || 'NONE');

await pool.end();
