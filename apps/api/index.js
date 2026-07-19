import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import driversRoutes from "./routes/drivers.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import solveRoutes from "./routes/solve.routes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 4000;

// Middleware to extract org_id from headers (multi-tenant support)
app.use((req, res, next) => {
  // Exclude health check from needing org_id
  if (req.path === '/health' || req.path.startsWith('/api/auth')) return next();
  
  const orgId = req.headers['x-org-id'];
  if (!orgId) {
    return res.status(400).json({ error: 'Missing x-org-id header' });
  }
  req.orgId = orgId;
  next();
});

//mount route files
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/solve', solveRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`[api] Polaris API running on port ${port}`);
});
