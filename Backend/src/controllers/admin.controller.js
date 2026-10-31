import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  customers,
  invoices,
  payments,
  products,
  subscriptions,
} from '../db/schema.js';

const countRows = async (table, condition) => {
  const query = db.select({ count: sql`count(*)::int` }).from(table);
  const [result] = condition ? await query.where(condition) : await query;
  return Number(result.count);
};

const sumPayments = async () => {
  const [result] = await db
    .select({ amount: sql`coalesce(sum(${payments.amount}), 0)` })
    .from(payments);
  return Number(result.amount);
};

const getOutstandingAmount = async () => {
  const [result] = await db
    .select({
      amount: sql`coalesce(sum(greatest(${invoices.totalAmount} - ${invoices.amountPaid}, 0)), 0)`,
    })
    .from(invoices)
    .where(sql`${invoices.status} not in ('PAID', 'CANCELLED')`);
  return Number(result.amount);
};

export async function getOverview(_req, res, next) {
  try {
    const [
      totalCustomers,
      totalProducts,
      activeSubscriptions,
      totalInvoices,
      overdueInvoices,
      revenue,
      outstandingAmount,
      recentInvoices,
      recentCustomers,
    ] = await Promise.all([
      countRows(customers),
      countRows(products),
      countRows(
        subscriptions,
        sql`${subscriptions.status} in ('ACTIVE', 'CONFIRMED')`
      ),
      countRows(invoices),
      countRows(
        invoices,
        sql`${invoices.status} = 'CONFIRMED' and ${invoices.dueDate} < current_date and ${invoices.amountPaid} < ${invoices.totalAmount}`
      ),
      sumPayments(),
      getOutstandingAmount(),
      db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          customerName: customers.name,
          totalAmount: invoices.totalAmount,
          status: invoices.status,
          invoiceDate: invoices.invoiceDate,
          dueDate: invoices.dueDate,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .orderBy(desc(invoices.id))
        .limit(6),
      db
        .select({
          id: customers.id,
          name: customers.name,
          email: customers.email,
          companyName: customers.companyName,
        })
        .from(customers)
        .orderBy(desc(customers.id))
        .limit(6),
    ]);

    res.json({
      data: {
        metrics: {
          totalCustomers,
          totalProducts,
          activeSubscriptions,
          totalInvoices,
          overdueInvoices,
          revenue,
          outstandingAmount,
        },
        recentInvoices,
        recentCustomers,
      },
    });
  } catch (error) {
    next(error);
  }
}
