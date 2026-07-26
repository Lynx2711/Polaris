import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import driversRoutes from "./routes/drivers.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import solveRoutes from "./routes/solve.routes.js";
import contactRoutes from "./routes/contact.routes.js";


dotenv.config();
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

// Middleware to extract org_id from headers (multi-tenant support)
app.use((req, res, next) => {
  // Exclude health check and contact submissions from needing org_id
  if (req.path === '/health' || req.path.startsWith('/api/auth') || req.path === '/api/contact') return next();
  
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
app.use('/api/contact', contactRoutes);


app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`[api] Polaris API running on port ${port}`);
});
