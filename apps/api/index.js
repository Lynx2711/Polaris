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
import { initSocket } from "./src/socket.js";

dotenv.config();

// ── Startup guard: fail fast if JWT_SECRET is missing ──
if (!process.env.JWT_SECRET) {
  console.error("[api] FATAL: JWT_SECRET is not set in .env — aborting.");
  process.exit(1);
}

const app = express();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
const port = process.env.PORT || 4000;

// NOTE: org-scoping is done inside each route via req.user.orgId (from JWT).
// There is NO separate x-org-id header middleware — the JWT is the single source of truth.
// (Main branch uses an x-org-id header middleware, but that was removed here because
//  orgId is now embedded in the signed JWT token — more secure and tamper-proof.)

// Mount route files
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/solve', solveRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Create HTTP server and attach Socket.IO ──
const httpServer = createServer(app);
const io = initSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`[api] Polaris API running on port ${port}`);
  console.log(`[ws]  Socket.IO attached and listening`);
});
