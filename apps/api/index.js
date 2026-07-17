import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import driversRoutes from "./routes/drivers.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT;

//mount route files
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/jobs', jobsRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});