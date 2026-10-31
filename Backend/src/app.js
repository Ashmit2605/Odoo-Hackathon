import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import healthRouter from "./routes/health.routes.js";
import authRouter from "./routes/auth.routes.js";
import resourcesRouter from "./routes/resources.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || false }));
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api", resourcesRouter);

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({ error: "Invalid JSON body" });
  }
  if (["23502", "22P02", "22001", "22003", "22007", "22008", "23514"].includes(error.code)) {
    return response.status(400).json({ error: "Request violates a database constraint" });
  }
  if (error.code === "23505") return response.status(409).json({ error: "A record with these unique values already exists" });
  if (error.code === "23503") return response.status(409).json({ error: "A referenced record does not exist or is still in use" });
  console.error(error);
  return response.status(500).json({ error: "Internal server error" });
});

export default app;
