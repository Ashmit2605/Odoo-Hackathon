import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import healthRouter from "./routes/health.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || false }));
app.use(express.json());

app.use("/api/health", healthRouter);

export default app;
