// End-to-end flow test: login → list drivers → add drivers → list orders → add order
const BASE = 'http://localhost:4000';

async function apiCall(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log('=== POLARIS END-TO-END FLOW TEST ===\n');

  // 1. Login
  console.log('── Step 1: LOGIN ──');
  const loginRes = await apiCall('/api/auth/login', {
    method: 'POST',
    body: { email: 'aditiverma11448@gmail.com', password: 'Universe@27' }
  });
  console.log(`  Status: ${loginRes.status} (${loginRes.ok ? 'OK' : 'FAIL'})`);
  
  if (!loginRes.ok) {
    console.log('  ERROR:', loginRes.data);
    process.exit(1);
  }
  
  const token = loginRes.data.token;
  const user = loginRes.data.user;
  console.log(`  User: id=${user.id}, orgId=${user.orgId}, name=${user.name}, role=${user.role}`);
  console.log(`  Token received: ${token ? 'YES (' + token.substring(0,20) + '...)' : 'NO'}`);

  // 2. List current drivers
  console.log('\n── Step 2: LIST DRIVERS ──');
  const driversRes = await apiCall('/api/drivers', { token });
  console.log(`  Status: ${driversRes.status} (${driversRes.ok ? 'OK' : 'FAIL'})`);
  if (driversRes.ok) {
    console.log(`  Drivers for org ${user.orgId}: ${driversRes.data.length} found`);
    driversRes.data.forEach(d => console.log(`    [${d.id}] ${d.name} — ${d.vehicle_capacity_kg}kg, active=${d.is_active}`));
  } else {
    console.log('  ERROR:', driversRes.data);
  }

  // 3. Add multiple drivers
  console.log('\n── Step 3: ADD DRIVERS ──');
  const newDrivers = [
    { name: 'Amanpreet Singh', phone: '+91 98765 43210', vehicle_capacity_kg: 500, home_lat: 31.298, home_lng: 75.577 },
    { name: 'Gurjit Sharma', phone: '+91 98123 45678', vehicle_capacity_kg: 350, home_lat: 31.325, home_lng: 75.612 },
    { name: 'Harish Verma', phone: '+91 99887 76655', vehicle_capacity_kg: 600, home_lat: 31.279, home_lng: 75.647 }
  ];

  for (const d of newDrivers) {
    const res = await apiCall('/api/drivers', { method: 'POST', token, body: d });
    console.log(`  Add "${d.name}": ${res.status} (${res.ok ? 'OK' : 'FAIL'})`);
    if (res.ok) {
      console.log(`    Created: id=${res.data.id}, org_id scoped to JWT's orgId`);
    } else {
      console.log(`    ERROR:`, res.data);
    }
  }

  // 4. List drivers again
  console.log('\n── Step 4: LIST DRIVERS (after adding) ──');
  const drivers2 = await apiCall('/api/drivers', { token });
  console.log(`  Drivers count: ${drivers2.data.length}`);
  drivers2.data.forEach(d => console.log(`    [${d.id}] ${d.name} — ${d.vehicle_capacity_kg}kg`));

  // 5. List current orders
  console.log('\n── Step 5: LIST ORDERS ──');
  const ordersRes = await apiCall('/api/orders', { token });
  console.log(`  Status: ${ordersRes.status} (${ordersRes.ok ? 'OK' : 'FAIL'})`);
  if (ordersRes.ok) {
    console.log(`  Orders for org ${user.orgId}: ${ordersRes.data.length} found`);
    ordersRes.data.forEach(o => console.log(`    [${o.id}] ${o.address} — ${o.weight_kg}kg, status=${o.status}`));
  } else {
    console.log('  ERROR:', ordersRes.data);
  }

  // 6. Add orders
  console.log('\n── Step 6: ADD ORDERS ──');
  const now = new Date();
  const newOrders = [
    {
      address: 'Model Town, Market Complex, Jalandhar',
      lat: 31.315, lng: 75.585, weight_kg: 120,
      deadline_start: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      deadline_end: new Date(now.getTime() + 1000 * 60 * 90).toISOString()
    },
    {
      address: 'Phagwara Main Bus Stand, GT Road',
      lat: 31.224, lng: 75.771, weight_kg: 85,
      deadline_start: new Date(now.getTime()).toISOString(),
      deadline_end: new Date(now.getTime() + 1000 * 60 * 300).toISOString()
    },
    {
      address: 'Urban Estate Phase 2, Jalandhar',
      lat: 31.292, lng: 75.602, weight_kg: 210,
      deadline_start: new Date(now.getTime()).toISOString(),
      deadline_end: new Date(now.getTime() + 1000 * 60 * 75).toISOString()
    },
    {
      address: 'Industrial Area Focal Point, Phagwara',
      lat: 31.241, lng: 75.752, weight_kg: 150,
      deadline_start: new Date(now.getTime()).toISOString(),
      deadline_end: new Date(now.getTime() + 1000 * 60 * 240).toISOString()
    }
  ];

  for (const o of newOrders) {
    const res = await apiCall('/api/orders', { method: 'POST', token, body: o });
    console.log(`  Add "${o.address}": ${res.status} (${res.ok ? 'OK' : 'FAIL'})`);
    if (res.ok) {
      console.log(`    Created: id=${res.data.id}, status=${res.data.status}`);
    } else {
      console.log(`    ERROR:`, res.data);
    }
  }

  // 7. Final listing
  console.log('\n── Step 7: FINAL STATE ──');
  const finalDrivers = await apiCall('/api/drivers', { token });
  const finalOrders = await apiCall('/api/orders', { token });
  console.log(`  Drivers: ${finalDrivers.data.length}`);
  console.log(`  Orders: ${finalOrders.data.length}`);

  // 8. Test without token (should fail)
  console.log('\n── Step 8: TEST WITHOUT TOKEN (expect 401) ──');
  const noTokenRes = await apiCall('/api/drivers');
  console.log(`  GET /api/drivers without token: ${noTokenRes.status} — ${noTokenRes.data?.message || 'no message'}`);

  console.log('\n=== TEST COMPLETE ===');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
