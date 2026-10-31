// Backend/src/services/staff.service.js
import { db } from '../db/index.js';
import { users, customers, invoices, payments, subscriptions, plans, quotationTemplates, products } from '../db/schema.js';
import { eq, and, desc, lt, sql } from 'drizzle-orm';

export async function getDashboardStats() {
  const [
    customerCount,
    productCount,
    activeSubscriptionCount,
    invoiceCount,
    pendingInvoiceCount,
    overdueInvoiceCount,
    receivedPayments,
    outstandingBalance,
    recentInvoices,
    recentCustomers,
  ] = await Promise.all([
    db.select({ count: sql`count(*)::int` })
      .from(customers)
      .innerJoin(users, eq(customers.userId, users.id))
      .where(eq(users.role, 'CUSTOMER')),
    db.select({ count: sql`count(*)::int` }).from(products),
    db.select({ count: sql`count(*)::int` }).from(subscriptions)
      .where(sql`${subscriptions.status} in ('ACTIVE', 'CONFIRMED')`),
    db.select({ count: sql`count(*)::int` }).from(invoices),
    db.select({ count: sql`count(*)::int` }).from(invoices)
      .where(eq(invoices.status, 'CONFIRMED')),
    db.select({ count: sql`count(*)::int` }).from(invoices)
      .where(sql`${invoices.status} = 'CONFIRMED' and ${invoices.dueDate} < current_date and ${invoices.amountPaid} < ${invoices.totalAmount}`),
    db.select({ amount: sql`coalesce(sum(${payments.amount}), 0)` }).from(payments),
    db.select({
      amount: sql`coalesce(sum(greatest(${invoices.totalAmount} - ${invoices.amountPaid}, 0)), 0)`,
    }).from(invoices)
      .where(sql`${invoices.status} not in ('PAID', 'CANCELLED')`),
    db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerName: customers.name,
      totalAmount: invoices.totalAmount,
      amountPaid: invoices.amountPaid,
      status: invoices.status,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
    })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(invoices.id))
      .limit(6),
    db.select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      companyName: customers.companyName,
    })
      .from(customers)
      .innerJoin(users, eq(customers.userId, users.id))
      .where(eq(users.role, 'CUSTOMER'))
      .orderBy(desc(customers.id))
      .limit(6),
  ]);

  const totalCustomers = Number(customerCount[0].count);
  const pendingInvoices = Number(pendingInvoiceCount[0].count);
  return {
    totalCustomers,
    pendingInvoices,
    dailySummary: "Workspace data loaded",
    metrics: {
      totalCustomers,
      totalProducts: Number(productCount[0].count),
      activeSubscriptions: Number(activeSubscriptionCount[0].count),
      totalInvoices: Number(invoiceCount[0].count),
      pendingInvoices,
      overdueInvoices: Number(overdueInvoiceCount[0].count),
      revenue: Number(receivedPayments[0].amount),
      outstandingAmount: Number(outstandingBalance[0].amount),
    },
    recentInvoices,
    recentCustomers,
  };
}

export async function getAllCustomers() {
  return await db.select({
    id: customers.id,
    userId: customers.userId,
    name: customers.name,
    email: customers.email,
    companyName: customers.companyName,
    phone: customers.phone,
    address: customers.address,
  })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(eq(users.role, 'CUSTOMER'))
    .orderBy(desc(customers.id));
}

export async function getCustomer(id) {
  const [cust] = await db.select({
    id: customers.id,
    userId: customers.userId,
    name: customers.name,
    email: customers.email,
    companyName: customers.companyName,
    phone: customers.phone,
    address: customers.address,
  })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(and(eq(customers.id, id), eq(users.role, 'CUSTOMER')));
  return cust;
}

export async function createCustomer(data) {
  const [newCust] = await db.insert(customers).values(data).returning();
  return newCust;
}

export async function getAllInvoices() {
  return await db.select().from(invoices);
}

export async function confirmDraftInvoice(id) {
  const [updated] = await db.update(invoices)
    .set({ status: 'CONFIRMED' })
    .where(and(eq(invoices.id, id), eq(invoices.status, 'DRAFT')))
    .returning();
  return updated;
}

export async function recordPayment({ invoiceId, amount, method }) {
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

  // 3. Activate Subscription if fully paid
  let updatedSub = null;
  if (isPaid && invoice.subscriptionId) {
    const [sub] = await db.update(subscriptions)
      .set({ status: 'ACTIVE' })
      .where(eq(subscriptions.id, invoice.subscriptionId))
      .returning();
    updatedSub = sub;
  }

  return { payment, invoiceStatus: isPaid ? 'PAID' : invoice.status, subscriptionStatus: updatedSub?.status };
}

export async function getOverdueInvoices() {
  const today = new Date().toISOString().split('T')[0];
  return await db.select().from(invoices).where(
    and(
      eq(invoices.status, 'CONFIRMED'),
      lt(invoices.dueDate, today),
      sql`${invoices.amountPaid} < ${invoices.totalAmount}`
    )
  );
}

export async function createQuotation({ customerId, templateId, startDate, createdBy }) {
  const [sub] = await db.insert(subscriptions).values({
    subscriptionNumber: `QT-${Date.now()}`,
    customerId,
    planId: 1, // Defaulting for hackathon
    templateId,
    startDate: startDate || new Date().toISOString().split('T')[0],
    status: 'PENDING_PAYMENT',
    source: 'ADMIN',
    createdBy
  }).returning();
  return sub;
}

export async function confirmQuotation(id) {
  const [updated] = await db.update(subscriptions)
    .set({ 
      status: 'CONFIRMED',
      nextBillingDate: new Date().toISOString().split('T')[0]
    })
    .where(and(
      eq(subscriptions.id, id),
      eq(subscriptions.status, 'PENDING_PAYMENT') // Changed from QUOTATION to match new schema
    )).returning();
  return updated;
}

export async function updateStaffProfile(userId, { name, email }) {
  const [updated] = await db.update(users)
    .set({ name, email })
    .where(eq(users.id, userId))
    .returning();
  return { id: updated.id, name: updated.name, email: updated.email };
}