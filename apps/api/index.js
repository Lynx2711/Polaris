import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import driversRoutes from "./routes/drivers.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import solveRoutes from "./routes/solve.routes.js";
import routesRoutes from "./routes/routes.routes.js";
import platformAdminRoutes from "./routes/platformAdmin.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import { initSocket } from "./src/socket.js";

dotenv.config();

// ── Startup guard: fail fast if JWT_SECRET is missing ──
if (!process.env.JWT_SECRET) {
  console.error("[api] FATAL: JWT_SECRET is not set in .env — aborting.");
  process.exit(1);
}

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback for dev environments
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
const port = process.env.PORT || 4000;

// Optional org-id header extraction middleware for multi-tenant support
app.use((req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/api/auth') || req.path === '/api/contact') return next();
  const orgId = req.headers['x-org-id'];
  if (orgId) {
    req.orgId = orgId;
  }
  next();
});

// Mount route files
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/solve', solveRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/platform-admin', platformAdminRoutes);
app.use('/api/contact', contactRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Create HTTP server and attach Socket.IO ──
const httpServer = createServer(app);
const io = initSocket(httpServer);

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[api] FATAL: Port ${port} is already in use by another process.`);
    console.error(`[api] Fix: Kill the process using port ${port} or set PORT=${Number(port) + 1} in .env`);
    process.exit(1);
  } else {
    console.error('[api] Server error:', err);
  }
});

httpServer.listen(port, () => {
  console.log(`[api] Polaris API running on port ${port}`);
  console.log(`[ws]  Socket.IO attached and listening`);
});
