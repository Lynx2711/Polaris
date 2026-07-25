import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('polaris_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Order Endpoints ──
export async function getOrders(status) {
  const params = status ? { status } : {};
  const res = await api.get('/api/orders', { params });
  return res.data;
}

export async function createOrder(orderData) {
  const res = await api.post('/api/orders', orderData);
  return res.data;
}

// ── Driver Endpoints ──
export async function getDrivers() {
  const res = await api.get('/api/drivers');
  return res.data;
}

export async function createDriver(driverData) {
  const res = await api.post('/api/drivers', driverData);
  return res.data;
}

// ── Solver & Jobs Endpoints ──
export async function submitSolve(order_ids, driver_ids) {
  const res = await api.post('/api/solve', { order_ids, driver_ids });
  return res.data; // { job_id, status: "queued" }
}

export async function getJobStatus(jobId) {
  const res = await api.get(`/api/jobs/${jobId}`);
  return res.data; // { id, status, route_ids, unassigned_order_ids, error_message }
}

export async function getRoute(routeId) {
  const res = await api.get(`/api/routes/${routeId}`);
  return res.data; // { id, driver_id, total_distance_km, total_duration_min, stops, geometry }
}

// ── Seed Demo Data Helper ──
export async function seedDemoData() {
  // Pre-configured coordinates in the Jalandhar-Phagwara corridor
  const sampleDrivers = [
    { name: 'Amanpreet Singh', phone: '+91 98765 43210', vehicle_capacity_kg: 500, home_lat: 31.298, home_lng: 75.577 },
    { name: 'Gurjit Sharma', phone: '+91 98123 45678', vehicle_capacity_kg: 350, home_lat: 31.325, home_lng: 75.612 },
    { name: 'Harish Verma', phone: '+91 99887 76655', vehicle_capacity_kg: 600, home_lat: 31.279, home_lng: 75.647 }
  ];

  const now = new Date();
  const sampleOrders = [
    {
      address: 'Model Town, Market Complex, Jalandhar',
      lat: 31.315,
      lng: 75.585,
      weight_kg: 120,
      deadline_start: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      deadline_end: new Date(now.getTime() + 1000 * 60 * 90).toISOString() // Risk: within 1.5 hrs
    },
    {
      address: 'Phagwara Main Bus Stand, GT Road',
      lat: 31.224,
      lng: 75.771,
      weight_kg: 85,
      deadline_start: new Date(now.getTime()).toISOString(),
      deadline_end: new Date(now.getTime() + 1000 * 60 * 300).toISOString()
    },
    {
      address: 'Urban Estate Phase 2, Jalandhar',
      lat: 31.292,
      lng: 75.602,
      weight_kg: 210,
      deadline_start: new Date(now.getTime()).toISOString(),
      deadline_end: new Date(now.getTime() + 1000 * 60 * 75).toISOString() // Risk: within 1.25 hrs
    },
    {
      address: 'Industrial Area Focal Point, Phagwara',
      lat: 31.241,
      lng: 75.752,
      weight_kg: 150,
      deadline_start: new Date(now.getTime()).toISOString(),
      deadline_end: new Date(now.getTime() + 1000 * 60 * 240).toISOString()
    }
  ];

  const createdDrivers = [];
  for (const d of sampleDrivers) {
    try {
      const created = await createDriver(d);
      createdDrivers.push(created);
    } catch (e) {
      console.warn('Seed driver failed:', e.message);
    }
  }

  const createdOrders = [];
  for (const o of sampleOrders) {
    try {
      const created = await createOrder(o);
      createdOrders.push(created);
    } catch (e) {
      console.warn('Seed order failed:', e.message);
    }
  }

  return { drivers: createdDrivers, orders: createdOrders };
}

// ── Platform Admin Endpoints ──
export async function getOrganizations() {
  const res = await api.get('/api/platform-admin/organizations');
  return res.data;
}

export async function createOrganization(orgData) {
  const res = await api.post('/api/platform-admin/organizations', orgData);
  return res.data;
}

export async function getOrgUsers(orgId) {
  const res = await api.get(`/api/platform-admin/organizations/${orgId}/users`);
  return res.data;
}

export async function createOrgUser(orgId, userData) {
  const res = await api.post(`/api/platform-admin/organizations/${orgId}/users`, userData);
  return res.data;
}

export default api;
