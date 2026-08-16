// Main Express API Gateway & WebSocket HTTP Server Entrypoint
// Responsibilities:
// 1. Loads configuration from .env and verifies critical environment variables.
// 2. Configures CORS, Cookie Parsing, JSON Body Parsing middleware.
// 3. Mounts REST API routes for authentication, drivers, orders, jobs, solver, routes, and admin.
// 4. Attaches Socket.IO engine to the HTTP server for real-time WebSocket communications.

import express from "express";               // Web framework for Node.js
import { createServer } from "http";         // Native Node.js HTTP server module
import dotenv from "dotenv";                 // Environment variable loader
import cors from "cors";                     // Cross-Origin Resource Sharing middleware
import cookieParser from "cookie-parser";     // Cookie parser middleware
import authRoutes from "./routes/authRoutes.js";          // Authentication router
import driversRoutes from "./routes/drivers.routes.js";   // Drivers management router
import ordersRoutes from "./routes/orders.routes.js";     // Delivery orders router
import jobsRoutes from "./routes/jobs.routes.js";         // Async optimization job router
import solveRoutes from "./routes/solve.routes.js";       // Synchronous route solver proxy router
import routesRoutes from "./routes/routes.routes.js";     // Finalized route manifest router
import platformAdminRoutes from "./routes/platformAdmin.routes.js"; // Superadmin dashboard router
import contactRoutes from "./routes/contact.routes.js";   // Public contact form router
import geocodeRoutes from "./routes/geocode.routes.js";   // Server-side Nominatim geocoding proxy
import { initSocket } from "./src/socket.js";            // Socket.io initialization function

// Load environment variables from .env file into process.env
dotenv.config();

// ── Startup guard: fail fast if JWT_SECRET is missing ──
if (!process.env.JWT_SECRET) {
  console.error("[api] FATAL: JWT_SECRET is not set in .env — aborting.");
  process.exit(1); // Exit process with error status code 1 if secret key missing
}

// Instantiate Express application
const app = express();

// Allowed origins array for CORS white-listing (Vite dev server ports)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
];

// Configure CORS middleware with credentials support
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback for dev environments
    }
  },
  credentials: true // Allow cookies and authorization headers cross-origin
}));

// Enable cookie parsing middleware
app.use(cookieParser());
// Enable JSON body parsing middleware for incoming POST/PUT request bodies
app.use(express.json());

// Set server listening port from environment or default to 4000
const port = process.env.PORT || 4000;

// Optional org-id header extraction middleware for multi-tenant support
app.use((req, res, next) => {
  // Skip org-id extraction for public or health check routes
  if (req.path === '/health' || req.path.startsWith('/api/auth') || req.path === '/api/contact' || req.path.startsWith('/api/geocode')) return next();
  const orgId = req.headers['x-org-id'];
  if (orgId) {
    req.orgId = orgId; // Attach extracted tenant organization ID to request object
  }
  next();
});

// Mount Express API Router Modules under distinct path prefixes
app.use('/api/auth', authRoutes);                   // /api/auth/* -> Registration, Login, SSO
app.use('/api/drivers', driversRoutes);             // /api/drivers/* -> Drivers CRUD & status
app.use('/api/orders', ordersRoutes);               // /api/orders/* -> Orders CRUD & batch imports
app.use('/api/jobs', jobsRoutes);                   // /api/jobs/* -> Route optimization background job status
app.use('/api/solve', solveRoutes);                 // /api/solve/* -> Direct proxy to Python solver service
app.use('/api/routes', routesRoutes);               // /api/routes/* -> Computed driver routes & manifests
app.use('/api/platform-admin', platformAdminRoutes);// /api/platform-admin/* -> Platform superadmin dashboard metrics
app.use('/api/contact', contactRoutes);             // /api/contact/* -> Contact form submissions
app.use('/api/geocode', geocodeRoutes);             // /api/geocode/* -> Server-side Nominatim proxy

// Server health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Create HTTP server instance and attach Socket.IO WebSocket engine ──
const httpServer = createServer(app);
const io = initSocket(httpServer); // Initialize Socket.io on the HTTP server

// Global error handler for HTTP server port conflicts
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[api] FATAL: Port ${port} is already in use by another process.`);
    console.error(`[api] Fix: Kill the process using port ${port} or set PORT=${Number(port) + 1} in .env`);
    process.exit(1); // Exit process if port in use
  } else {
    console.error('[api] Server error:', err);
  }
});

// Start listening for incoming HTTP and WebSocket connections
httpServer.listen(port, () => {
  console.log(`[api] Polaris API running on port ${port}`);
  console.log(`[ws]  Socket.IO attached and listening`);
});

