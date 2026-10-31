import app from "./app.js";
import { connectDatabase, pool } from "./db/index.js";

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await connectDatabase();
    console.log("Connected to PostgreSQL");

    const server = app.listen(port, () => {
      console.log(`Backend server listening on port ${port}`);
    });

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
  } catch (error) {
    console.error("Failed to start backend:", error);
    await pool.end();
    process.exitCode = 1;
  }
}

startServer();
