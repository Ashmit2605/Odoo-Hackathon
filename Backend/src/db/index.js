import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

const { Pool } = pg;

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

export const pool = new Pool({
  ...(isDatabaseConfigured ? { connectionString: process.env.DATABASE_URL } : {}),
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });

export async function connectDatabase() {
  if (!isDatabaseConfigured) {
    console.warn(
      "DATABASE_URL is not configured. Set it in Backend/.env before using database features.",
    );
    return false;
  }

  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    console.warn(
      "Database connection unavailable; continuing without PostgreSQL. " +
        error.message
    );
    return false;
  }
}