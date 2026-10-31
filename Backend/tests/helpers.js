import { pool } from '../src/db/index.js';

export async function truncateAll() {
  await pool.query(
    'TRUNCATE TABLE users, customers, password_reset_tokens, invoices, payments, subscriptions, plans, quotation_templates RESTART IDENTITY CASCADE'
  );
}

export async function closeDb() {
  await pool.end();
}