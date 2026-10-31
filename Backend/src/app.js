<<<<<<< HEAD
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import resourcesRouter from './routes/resources.routes.js';
import productRouter from './routes/product.routes.js';
import invoiceRouter from './routes/invoice.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import staffRouter from './routes/staff.routes.js';
import quotationRouter from './routes/quotation.routes.js';
import adminRouter from './routes/admin.routes.js';
=======
import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import authRouter from "./routes/auth.routes.js";
import apiRouter from "./routes/api.routes.js";
import healthRouter from "./routes/health.routes.js";
import { listPublicPlans } from "./controllers/business.controller.js";
>>>>>>> 315d366 (done)

const app = express();

const configuredClientOrigins = (process.env.CLIENT_URL ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const developmentClientOrigins = process.env.NODE_ENV === 'production'
  ? []
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedClientOrigins = [
  ...new Set([...configuredClientOrigins, ...developmentClientOrigins]),
];

app.use(helmet());
<<<<<<< HEAD
app.use(cors({
  origin: allowedClientOrigins.length > 0 ? allowedClientOrigins : true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Health check — both root and /api/health (harmless, keeps both)
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/health', healthRouter);
=======
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);
app.use(express.json());

app.use("/api/health", healthRouter);
app.get("/api/public/plans", listPublicPlans);
app.use("/api/auth", authRouter);
app.use("/api", apiRouter);
>>>>>>> 315d366 (done)

// Auth endpoints
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/staff', staffRouter); // 👈 ADD THIS

// Products MVC
app.use('/api/products', productRouter);

// Invoices + Payments
app.use('/api/invoices', invoiceRouter);

// Generic resources are mounted after specific API routes.
app.use('/api', resourcesRouter);

// Postgres + JSON error handling (from teammate)
// Falls through to errorHandler via next(error) for anything else (ZodError, HttpError)
app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (['23502', '22P02', '22001', '22003', '22007', '22008', '23514'].includes(error.code)) {
    return res.status(400).json({ error: 'Request violates a database constraint' });
  }
  if (error.code === '23505') {
    return res.status(409).json({ error: 'A record with these unique values already exists' });
  }
  if (error.code === '23503') {
    return res.status(409).json({ error: 'A referenced record does not exist or is still in use' });
  }
  next(error);  // ← delegates to your errorHandler
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;