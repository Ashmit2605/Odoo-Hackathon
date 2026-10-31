import { Router } from "express";
import { and, asc, eq, getTableColumns } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import * as schema from "../db/schema.js";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const resources = {
  users: schema.users,
  "password-reset-tokens": schema.passwordResetTokens,
  customers: schema.customers,
  "tax-rates": schema.taxRates,
  products: schema.products,
  "product-variants": schema.productVariants,
  plans: schema.plans,
  "quotation-templates": schema.quotationTemplates,
  "quotation-template-items": schema.quotationTemplateItems,
  subscriptions: schema.subscriptions,
  "subscription-items": schema.subscriptionItems,
  discounts: schema.discounts,
  "discount-products": schema.discountProducts,
  "discount-subscriptions": schema.discountSubscriptions,
  invoices: schema.invoices,
  "invoice-items": schema.invoiceItems,
  payments: schema.payments,
};

function adminOnly(request, response) {
  if (request.auth?.role !== "ADMIN") {
    response.status(403).json({ error: "Administrator access required" });
    return false;
  }
  return true;
}

function publicRows(resource, rows) {
  return resource === "users" ? rows.map(({ passwordHash, ...row }) => row) : rows;
}

function parseId(config, raw) {
  const values = raw.split(",");
  if (values.length !== config.primaryKeys.length || values.some((value) => !/^\d+$/.test(value))) return null;
  const ids = values.map(Number);
  return ids.every((value) => Number.isSafeInteger(value) && value > 0) ? ids : null;
}

for (const [resource, table] of Object.entries(resources)) {
  const config = getTableConfig(table);
  const tableColumns = getTableColumns(table);
  const keyByColumnName = new Map(Object.entries(tableColumns).map(([key, column]) => [column.name, key]));
  const columns = new Map(Object.entries(tableColumns));
  const primaryColumnNames = config.primaryKeys.length
    ? config.primaryKeys.flatMap((key) => key.columns.map((column) => column.name))
    : config.columns.filter((column) => column.primary).map((column) => column.name);
  const primaryKeys = primaryColumnNames.map((name) => keyByColumnName.get(name));
  const hideHash = resource === "users";
  const endpoint = `/${resource}`;

  router.get(endpoint, requireAuth, async (request, response, next) => {
    try {
      if (!adminOnly(request, response)) return;
      const limit = Math.min(Math.max(Number.parseInt(request.query.limit, 10) || 50, 1), 100);
      const offset = Math.max(Number.parseInt(request.query.offset, 10) || 0, 0);
      const rows = await db.select().from(table).orderBy(...primaryKeys.map((key) => asc(table[key]))).limit(limit).offset(offset);
      return response.json({ data: publicRows(resource, rows), pagination: { limit, offset } });
    } catch (error) { return next(error); }
  });

  router.get(`${endpoint}/:id`, requireAuth, async (request, response, next) => {
    try {
      if (!adminOnly(request, response)) return;
      const ids = parseId(config, request.params.id);
      if (!ids) return response.status(400).json({ error: `id must contain ${primaryKeys.length} numeric key value(s), comma-separated` });
      const where = and(...primaryKeys.map((key, index) => eq(table[ key ], ids[index])));
      const [row] = await db.select().from(table).where(where).limit(1);
      return row ? response.json({ data: publicRows(resource, [row])[0] }) : response.status(404).json({ error: "Record not found" });
    } catch (error) { return next(error); }
  });

  router.post(endpoint, requireAuth, async (request, response, next) => {
    try {
      if (!adminOnly(request, response)) return;
      if (!request.body || Array.isArray(request.body) || typeof request.body !== "object") return response.status(400).json({ error: "A JSON object is required" });
      const invalid = Object.keys(request.body).filter((key) => !columns.has(key));
      if (invalid.length) return response.status(400).json({ error: "Unknown field(s)", fields: invalid });
      const values = { ...request.body };
      if (hideHash && typeof values.passwordHash === "string") {
        const bcrypt = await import("bcryptjs");
        values.passwordHash = await bcrypt.default.hash(values.passwordHash, 12);
      }
      if (hideHash && !values.passwordHash) return response.status(400).json({ error: "passwordHash is required for administrator-created users" });
      const [row] = await db.insert(table).values(values).returning();
      return response.status(201).json({ data: publicRows(resource, [row])[0] });
    } catch (error) { return next(error); }
  });

  router.put(`${endpoint}/:id`, requireAuth, async (request, response, next) => {
    try {
      if (!adminOnly(request, response)) return;
      const ids = parseId(config, request.params.id);
      if (!ids) return response.status(400).json({ error: `id must contain ${primaryKeys.length} numeric key value(s), comma-separated` });
      if (!request.body || Array.isArray(request.body) || typeof request.body !== "object" || !Object.keys(request.body).length) return response.status(400).json({ error: "A non-empty JSON object is required" });
      const invalid = Object.keys(request.body).filter((key) => !columns.has(key) || primaryKeys.includes(key));
      if (invalid.length) return response.status(400).json({ error: "Unknown or immutable field(s)", fields: invalid });
      const values = { ...request.body };
      if (hideHash && values.passwordHash) {
        const bcrypt = await import("bcryptjs");
        values.passwordHash = await bcrypt.default.hash(values.passwordHash, 12);
      }
      const where = and(...primaryKeys.map((key, index) => eq(table[key], ids[index])));
      const [row] = await db.update(table).set(values).where(where).returning();
      return row ? response.json({ data: publicRows(resource, [row])[0] }) : response.status(404).json({ error: "Record not found" });
    } catch (error) { return next(error); }
  });

  router.delete(`${endpoint}/:id`, requireAuth, async (request, response, next) => {
    try {
      if (!adminOnly(request, response)) return;
      const ids = parseId(config, request.params.id);
      if (!ids) return response.status(400).json({ error: `id must contain ${primaryKeys.length} numeric key value(s), comma-separated` });
      const where = and(...primaryKeys.map((key, index) => eq(table[key], ids[index])));
      const [row] = await db.delete(table).where(where).returning();
      return row ? response.json({ message: "Record deleted" }) : response.status(404).json({ error: "Record not found" });
    } catch (error) { return next(error); }
  });
}

export default router;
