// Backend/src/controllers/staff.controller.js
import { db } from '../db/index.js';
import { customers, invoices, payments, users } from '../db/schema.js';
import { eq, and, lt, sql } from 'drizzle-orm';

// --- 1. DASHBOARD ---
export const getDashboardSummary = async (req, res, next) => {
  try {
    const [customerCount] = await db.select({ count: sql`count(*)` }).from(customers);
    const [pendingInvoices] = await db.select({ count: sql`count(*)` }).from(invoices).where(eq(invoices.status, 'CONFIRMED'));
    
    res.json({
      totalCustomers: Number(customerCount.count),
      pendingInvoices: Number(pendingInvoices.count),
      dailySummary: "All systems operational" // Placeholder
    });
  } catch (err) { next(err); }
};

// --- 2. CUSTOMERS ---
export const getCustomers = async (req, res, next) => {
  try {
    const all = await db.select().from(customers);
    res.json(all);
  } catch (err) { next(err); }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const [cust] = await db.select().from(customers).where(eq(customers.id, req.params.id));
    if (!cust) return res.status(404).json({ error: "Customer not found" });
    res.json(cust);
  } catch (err) { next(err); }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, companyName } = req.body;
    const [newCust] = await db.insert(customers).values({ name, email, phone, companyName }).returning();
    res.status(201).json(newCust);
  } catch (err) { next(err); }
};

// --- 3. INVOICES ---
export const getInvoices = async (req, res, next) => {
  try {
    const all = await db.select().from(invoices);
    res.json(all);
  } catch (err) { next(err); }
};

export const confirmInvoice = async (req, res, next) => {
  try {
    const [updated] = await db.update(invoices)
      .set({ status: 'CONFIRMED' })
      .where(and(eq(invoices.id, req.params.id), eq(invoices.status, 'DRAFT')))
      .returning();
      
    if (!updated) return res.status(400).json({ error: "Invoice not found or not in DRAFT status" });
    res.json(updated);
  } catch (err) { next(err); }
};

// --- 4. PAYMENTS ---
export const recordPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, method } = req.body;
    
    // 1. Insert payment
    const [payment] = await db.insert(payments).values({
      invoiceId, amount, method: method || 'CASH'
    }).returning();

    // 2. Update Invoice amountPaid
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    const newAmountPaid = Number(invoice.amountPaid) + Number(amount);
    const isPaid = newAmountPaid >= Number(invoice.totalAmount);

    await db.update(invoices)
      .set({ 
        amountPaid: newAmountPaid.toString(),
        status: isPaid ? 'PAID' : invoice.status
      })
      .where(eq(invoices.id, invoiceId));

    res.status(201).json({ payment, invoiceStatus: isPaid ? 'PAID' : invoice.status });
  } catch (err) { next(err); }
};

// --- 5. OVERDUE INVOICES ---
export const getOverdueInvoices = async (req, res, next) => {
  try {
    // Logic: Status is CONFIRMED, dueDate < today, amountPaid < totalAmount
    const today = new Date().toISOString().split('T')[0];
    const overdue = await db.select().from(invoices).where(
      and(
        eq(invoices.status, 'CONFIRMED'),
        lt(invoices.dueDate, today),
        sql`${invoices.amountPaid} < ${invoices.totalAmount}`
      )
    );
    res.json(overdue);
  } catch (err) { next(err); }
};