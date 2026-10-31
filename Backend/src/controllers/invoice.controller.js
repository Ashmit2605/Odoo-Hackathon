import { eq, desc, and, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  invoices, invoiceItems, payments, customers, products, taxRates,
  subscriptions, subscriptionItems, plans,
} from '../db/schema.js';

let _subCounter = Date.now();
const nextSubNumber = () => `SUB-${++_subCounter}`;

/* get or create a sentinel plan used for direct product purchases */
let _productPlanId = null;
async function getProductPlanId(tx = db) {
  if (_productPlanId) return _productPlanId;
  const [existing] = await tx.select({ id: plans.id })
    .from(plans).where(eq(plans.name, 'Product Purchase')).limit(1);
  if (existing) { _productPlanId = existing.id; return _productPlanId; }
  const [created] = await tx.insert(plans).values({
    name: 'Product Purchase',
    price: '0',
    billingFrequency: 'MONTHLY',
  }).returning({ id: plans.id });
  _productPlanId = created.id;
  return _productPlanId;
}

/* resolve customerId for the logged-in user */
async function getCustomerId(userId) {
  const [row] = await db.select({ id: customers.id })
    .from(customers).where(eq(customers.userId, userId)).limit(1);
  return row?.id ?? null;
}

/* shared helper: resolve product + compute amounts */
async function resolveProduct(productId, quantity) {
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return null;
  let taxPct = '0';
  if (product.taxRateId) {
    const [tax] = await db.select().from(taxRates).where(eq(taxRates.id, product.taxRateId)).limit(1);
    if (tax) taxPct = tax.percentage;
  }
  const unitPrice = Number(product.salesPrice);
  const qty = Math.max(1, Number(quantity));
  const subtotal = unitPrice * qty;
  const taxAmount = subtotal * (Number(taxPct) / 100);
  return { product, taxPct, unitPrice, qty, subtotal, taxAmount, total: subtotal + taxAmount };
}

/* ── Customer: Buy Now — creates invoice + subscription (ACTIVE) ── */
export async function createInvoiceFromProduct(req, res, next) {
  try {
    const customerId = await getCustomerId(req.auth.sub);
    if (!customerId) return res.status(400).json({ error: 'Customer profile not found for this user' });

    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const resolved = await resolveProduct(productId, quantity);
    if (!resolved) return res.status(404).json({ error: 'Product not found' });
    const { product, taxPct, unitPrice, qty, subtotal, taxAmount, total } = resolved;

    const today = new Date().toISOString().slice(0, 10);
    const planId = await getProductPlanId();

    const result = await db.transaction(async (tx) => {
      // Create subscription (ACTIVE)
      const [sub] = await tx.insert(subscriptions).values({
        subscriptionNumber: nextSubNumber(),
        customerId,
        planId,
        startDate: today,
        status: 'ACTIVE',
      }).returning();

      await tx.insert(subscriptionItems).values({
        subscriptionId: sub.id,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        taxPercentage: taxPct,
        amount: (unitPrice * qty).toFixed(2),
      });

      // Create invoice
      const [inv] = await tx.insert(invoices).values({
        invoiceNumber: `INV-${Date.now()}`,
        customerId,
        subscriptionId: sub.id,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: total.toFixed(2),
        status: 'CONFIRMED',
      }).returning();

      await tx.insert(invoiceItems).values({
        invoiceId: inv.id,
        productName: product.name,
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        taxPercentage: taxPct,
        amount: (unitPrice * qty).toFixed(2),
      });

      return inv;
    });

    res.status(201).json({ data: result });
  } catch (err) { next(err); }
}

/* ── Customer: Request Quotation — creates QUOTATION subscription (no invoice) ── */
export async function requestQuotation(req, res, next) {
  try {
    const customerId = await getCustomerId(req.auth.sub);
    if (!customerId) return res.status(400).json({ error: 'Customer profile not found for this user' });

    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const resolved = await resolveProduct(productId, quantity);
    if (!resolved) return res.status(404).json({ error: 'Product not found' });
    const { product, taxPct, unitPrice, qty } = resolved;

    const today = new Date().toISOString().slice(0, 10);
    const validUntil = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const planId = await getProductPlanId();

    const sub = await db.transaction(async (tx) => {
      const [s] = await tx.insert(subscriptions).values({
        subscriptionNumber: nextSubNumber(),
        customerId,
        planId,
        startDate: today,
        quotationValidUntil: validUntil,
        status: 'QUOTATION',
      }).returning();

      await tx.insert(subscriptionItems).values({
        subscriptionId: s.id,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        taxPercentage: taxPct,
        amount: (unitPrice * qty).toFixed(2),
      });

      return s;
    });

    res.status(201).json({ data: sub });
  } catch (err) { next(err); }
}

/* ── Customer: list own subscriptions (ACTIVE/CONFIRMED) ── */
export async function listMySubscriptions(req, res, next) {
  try {
    const customerId = await getCustomerId(req.auth.sub);
    if (!customerId) return res.json({ data: [] });

    const rows = await db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.customerId, customerId),
        inArray(subscriptions.status, ['ACTIVE', 'CONFIRMED', 'PAUSED', 'CLOSED'])
      ))
      .orderBy(desc(subscriptions.id));

    const ids = rows.map((r) => r.id);
    const items = ids.length
      ? await db.select().from(subscriptionItems).where(
          ids.length === 1 ? eq(subscriptionItems.subscriptionId, ids[0]) : inArray(subscriptionItems.subscriptionId, ids)
        )
      : [];
    const itemsMap = {};
    items.forEach((i) => { (itemsMap[i.subscriptionId] ??= []).push(i); });

    res.json({ data: rows.map((r) => ({ ...r, items: itemsMap[r.id] ?? [] })) });
  } catch (err) { next(err); }
}

/* ── Customer: list own quotations (QUOTATION status) ── */
export async function listMyQuotations(req, res, next) {
  try {
    const customerId = await getCustomerId(req.auth.sub);
    if (!customerId) return res.json({ data: [] });

    const rows = await db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.status, 'QUOTATION')
      ))
      .orderBy(desc(subscriptions.id));

    const ids = rows.map((r) => r.id);
    const items = ids.length
      ? await db.select().from(subscriptionItems).where(
          ids.length === 1 ? eq(subscriptionItems.subscriptionId, ids[0]) : inArray(subscriptionItems.subscriptionId, ids)
        )
      : [];
    const itemsMap = {};
    items.forEach((i) => { (itemsMap[i.subscriptionId] ??= []).push(i); });

    res.json({ data: rows.map((r) => ({ ...r, items: itemsMap[r.id] ?? [] })) });
  } catch (err) { next(err); }
}

/* ── Customer: list own invoices ── */
export async function listMyInvoices(req, res, next) {
  try {
    const customerId = await getCustomerId(req.auth.sub);
    if (!customerId) return res.json({ data: [] });

    const rows = await db.select().from(invoices)
      .where(eq(invoices.customerId, customerId))
      .orderBy(desc(invoices.id));

    // attach items
    const ids = rows.map((r) => r.id);
    const allItems = ids.length
      ? await db.select().from(invoiceItems).where(
          ids.length === 1 ? eq(invoiceItems.invoiceId, ids[0]) : inArray(invoiceItems.invoiceId, ids)
        )
      : [];

    const itemsByInvoice = {};
    allItems.forEach((item) => { (itemsByInvoice[item.invoiceId] ??= []).push(item); });

    res.json({ data: rows.map((r) => ({ ...r, items: itemsByInvoice[r.id] ?? [] })) });
  } catch (err) { next(err); }
}

/* ── Customer: pay an invoice ── */
export async function payInvoice(req, res, next) {
  try {
    const customerId = await getCustomerId(req.auth.sub);
    if (!customerId) return res.status(403).json({ error: 'Customer profile not found' });

    const invoiceId = Number(req.params.id);
    const [invoice] = await db.select().from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.customerId, customerId))).limit(1);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'PAID') return res.status(400).json({ error: 'Invoice already paid' });
    if (invoice.status === 'CANCELLED') return res.status(400).json({ error: 'Invoice is cancelled' });

    const { method = 'CARD', note = '' } = req.body;
    const amount = Number(invoice.totalAmount) - Number(invoice.amountPaid);
    if (amount <= 0) return res.status(400).json({ error: 'No outstanding amount' });

    const result = await db.transaction(async (tx) => {
      const [payment] = await tx.insert(payments).values({
        invoiceId,
        method,
        amount: amount.toFixed(2),
        note: note || null,
      }).returning();

      const [updated] = await tx.update(invoices).set({
        amountPaid: Number(invoice.totalAmount).toFixed(2),
        status: 'PAID',
      }).where(eq(invoices.id, invoiceId)).returning();

      return { invoice: updated, payment };
    });

    res.json({ data: result });
  } catch (err) { next(err); }
}

/* ── Customer: list own payments ── */
export async function listMyPayments(req, res, next) {
  try {
    const customerId = await getCustomerId(req.auth.sub);
    if (!customerId) return res.json({ data: [] });

    const myInvoices = await db.select({ id: invoices.id, invoiceNumber: invoices.invoiceNumber })
      .from(invoices).where(eq(invoices.customerId, customerId));

    if (!myInvoices.length) return res.json({ data: [] });

    const ids = myInvoices.map((i) => i.id);
    const invoiceMap = Object.fromEntries(myInvoices.map((i) => [i.id, i.invoiceNumber]));

    const rows = await db.select().from(payments)
      .where(inArray(payments.invoiceId, ids))
      .orderBy(desc(payments.id));

    res.json({ data: rows.map((p) => ({ ...p, invoiceNumber: invoiceMap[p.invoiceId] })) });
  } catch (err) { next(err); }
}

/* ── Admin: list all invoices ── */
export async function listAllInvoices(req, res, next) {
  try {
    const rows = await db.select().from(invoices).orderBy(desc(invoices.id));
    res.json({ data: rows });
  } catch (err) { next(err); }
}

/* ── Admin: list all payments ── */
export async function listAllPayments(req, res, next) {
  try {
    const rows = await db.select().from(payments).orderBy(desc(payments.id));
    res.json({ data: rows });
  } catch (err) { next(err); }
}
