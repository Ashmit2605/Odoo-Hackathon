<<<<<<< HEAD
import 'dotenv/config';
import app from './app.js';                    // ✅ NOT './src/app.js'
import { connectDatabase, pool } from './db/index.js';  // ✅ NOT './src/db/index.js'

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    if (!process.env.JWT_SECRET?.trim()) {
      throw new Error('JWT_SECRET is required. Set it in Backend/.env before starting the API.');
    }
    await connectDatabase();
    console.log('✅ Database connected');
    app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
=======
import app from "./app.js";
import { connectDatabase, pool } from "./db/index.js";
import { processSubscriptionLifecycle } from "./controllers/business.controller.js";

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  const databaseReady = await connectDatabase();

  if (databaseReady) {
    console.log("Connected to PostgreSQL");
>>>>>>> 315d366 (done)
  }

  const server = app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
  });

  if (databaseReady) {
    const runBillingLifecycle = async () => {
      try {
        const result = await processSubscriptionLifecycle();
        if (
          result.renewalInvoices ||
          result.overdueInvoices ||
          result.pastDueSubscriptions ||
          result.expiredPendingSubscriptions ||
          result.canceledSubscriptions ||
          result.expiredSubscriptions
        ) {
          console.log("Billing lifecycle processed:", result);
        }
      } catch (error) {
        console.error("Billing lifecycle failed:", error);
      }
    };
    void runBillingLifecycle();
    const lifecycleTimer = setInterval(runBillingLifecycle, 24 * 60 * 60 * 1000);
    lifecycleTimer.unref();
  }

  const shutdown = (signal) => {
    console.log(`${signal} received; closing server`);
    server.close(async (error) => {
      if (error) {
        console.error("Failed to close HTTP server:", error);
        process.exitCode = 1;
      }

      try {
        await pool.end();
      } catch (poolError) {
        console.error("Failed to close PostgreSQL pool:", poolError);
        process.exitCode = 1;
      }
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

<<<<<<< HEAD
start();

process.on('SIGINT', async () => { await pool.end(); process.exit(0); });
process.on('SIGTERM', async () => { await pool.end(); process.exit(0); });
=======
startServer().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exitCode = 1;
});
>>>>>>> 315d366 (done)
