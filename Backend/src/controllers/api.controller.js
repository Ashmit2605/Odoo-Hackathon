import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  customers,
  invoiceItems,
  invoices,
  payments,
  plans,
  products,
  subscriptionItems,
  subscriptions,
  taxRates,
} from "../db/schema.js";

const BILLING_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
const SUBSCRIPTION_STATUSES = [
  "DRAFT",
  "QUOTATION",
  "CONFIRMED",
  "ACTIVE",
  "PAUSED",
  "CLOSED",
];
const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CARD", "UPI", "OTHER"];

function idFrom(request, response) {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    response.status(400).json({ message: "A valid record ID is required." });
    return null;
  }
  return id;
}

function requiredText(value, label, maxLength) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`${label} is required and must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

function positiveNumber(value, label, allowZero = false) {
  const number = Number(value);
  if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
    throw new Error(`${label} must be ${allowZero ? "zero or greater" : "greater than zero"}.`);
  }
  return number;
}

function validationError(response, error) {
  return response.status(400).json({ message: error.message });
}

function serverError(response, error, operation) {
  if (error.code === "23505") {
    return response.status(409).json({ message: "A record with these details already exists." });
  }
  if (error.code === "23503") {
    return response.status(400).json({ message: "A referenced record does not exist." });
  }
  console.error(`${operation} failed:`, error);
  return response.status(500).json({ message: `${operation} failed. Please try again.` });
}

function addFrequency(dateValue, frequency) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  if (frequency === "DAILY") date.setUTCDate(date.getUTCDate() + 1);
  if (frequency === "WEEKLY") date.setUTCDate(date.getUTCDate() + 7);
  if (frequency === "MONTHLY") date.setUTCMonth(date.getUTCMonth() + 1);
  if (frequency === "YEARLY") date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

export async function getCustomers(_request, response) {
  try {
    return response.json(await db.select().from(customers).orderBy(customers.name));
  } catch (error) {
    return serverError(response, error, "Loading customers");
  }
}

export async function getCustomer(request, response) {
  const id = idFrom(request, response);
  if (id === null) return;
  try {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (!customer) return response.status(404).json({ message: "Customer not found." });
    return response.json(customer);
  } catch (error) {
    return serverError(response, error, "Loading customer");
  }
}

export async function createCustomer(request, response) {
  try {
    const name = requiredText(request.body?.name, "Name", 150);
    const [customer] = await db
      .insert(customers)
      .values({
        name,
        email: typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() || null : null,
        companyName: request.body.companyName || null,
        phone: request.body.phone || null,
        address: request.body.address || null,
      })
      .returning();
    return response.status(201).json(customer);
  } catch (error) {
    return error.code ? serverError(response, error, "Creating customer") : validationError(response, error);
  }
}

export async function getProducts(_request, response) {
  try {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        productType: products.productType,
        salesPrice: products.salesPrice,
        costPrice: products.costPrice,
        taxRateId: products.taxRateId,
        taxName: taxRates.name,
        taxPercentage: taxRates.percentage,
        notes: products.notes,
      })
      .from(products)
      .leftJoin(taxRates, eq(products.taxRateId, taxRates.id))
      .orderBy(products.name);
    return response.json(rows);
  } catch (error) {
    return serverError(response, error, "Loading products");
  }
}

export async function getProduct(request, response) {
  const id = idFrom(request, response);
  if (id === null) return;
  try {
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) return response.status(404).json({ message: "Product not found." });
    return response.json(product);
  } catch (error) {
    return serverError(response, error, "Loading product");
  }
}

export async function createProduct(request, response) {
  try {
    const name = requiredText(request.body?.name, "Product name", 200);
    const salesPrice = positiveNumber(request.body.salesPrice, "Sales price", true);
    const costPrice =
      request.body.costPrice === undefined ? 0 : positiveNumber(request.body.costPrice, "Cost price", true);
    const [product] = await db
      .insert(products)
      .values({
        name,
        productType: request.body.productType || null,
        salesPrice: String(salesPrice),
        costPrice: String(costPrice),
        taxRateId: request.body.taxRateId ? Number(request.body.taxRateId) : null,
        notes: request.body.notes || null,
      })
      .returning();
    return response.status(201).json(product);
  } catch (error) {
    return error.code ? serverError(response, error, "Creating product") : validationError(response, error);
  }
}

export async function getPlans(_request, response) {
  try {
    return response.json(await db.select().from(plans).orderBy(plans.name));
  } catch (error) {
    return serverError(response, error, "Loading plans");
  }
}

export async function getPlan(request, response) {
  const id = idFrom(request, response);
  if (id === null) return;
  try {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
    if (!plan) return response.status(404).json({ message: "Plan not found." });
    return response.json(plan);
  } catch (error) {
    return serverError(response, error, "Loading plan");
  }
}

export async function createPlan(request, response) {
  try {
    const name = requiredText(request.body?.name, "Plan name", 200);
    const price = positiveNumber(request.body.price, "Price", true);
    const billingFrequency = request.body.billingFrequency;
    if (!BILLING_FREQUENCIES.includes(billingFrequency)) {
      throw new Error("Choose a valid billing frequency.");
    }
    const minQuantity = request.body.minQuantity === undefined ? 1 : Number(request.body.minQuantity);
    if (!Number.isInteger(minQuantity) || minQuantity < 1) throw new Error("Minimum quantity must be at least one.");
    const [plan] = await db
      .insert(plans)
      .values({
        name,
        price: String(price),
        billingFrequency,
        minQuantity,
        availableFrom: request.body.availableFrom || null,
        availableUntil: request.body.availableUntil || null,
        autoClose: Boolean(request.body.autoClose),
        allowEarlyClose: Boolean(request.body.allowEarlyClose),
        allowPause: Boolean(request.body.allowPause),
        allowRenew: request.body.allowRenew === undefined ? true : Boolean(request.body.allowRenew),
      })
      .returning();
    return response.status(201).json(plan);
  } catch (error) {
    return error.code ? serverError(response, error, "Creating plan") : validationError(response, error);
  }
}

async function loadSubscriptions(statusFilter) {
  const query = db
    .select({
      id: subscriptions.id,
      subscriptionNumber: subscriptions.subscriptionNumber,
      customerId: subscriptions.customerId,
      customerName: customers.name,
      planId: subscriptions.planId,
      planName: plans.name,
      planPrice: plans.price,
      billingFrequency: plans.billingFrequency,
      startDate: subscriptions.startDate,
      expiryDate: subscriptions.expiryDate,
      nextBillingDate: subscriptions.nextBillingDate,
      status: subscriptions.status,
    })
    .from(subscriptions)
    .innerJoin(customers, eq(subscriptions.customerId, customers.id))
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .orderBy(desc(subscriptions.createdAt));
  return statusFilter ? query.where(eq(subscriptions.status, statusFilter)) : query;
}

export async function getSubscriptions(_request, response) {
  try {
    return response.json(await loadSubscriptions());
  } catch (error) {
    return serverError(response, error, "Loading subscriptions");
  }
}

export async function getQuotations(_request, response) {
  try {
    return response.json(await loadSubscriptions("QUOTATION"));
  } catch (error) {
    return serverError(response, error, "Loading quotations");
  }
}

export async function getSubscription(request, response) {
  const id = idFrom(request, response);
  if (id === null) return;
  try {
    const [subscription] = await db
      .select({
        id: subscriptions.id,
        subscriptionNumber: subscriptions.subscriptionNumber,
        customerId: subscriptions.customerId,
        customerName: customers.name,
        planId: subscriptions.planId,
        planName: plans.name,
        startDate: subscriptions.startDate,
        expiryDate: subscriptions.expiryDate,
        nextBillingDate: subscriptions.nextBillingDate,
        status: subscriptions.status,
        quotationValidUntil: subscriptions.quotationValidUntil,
        paymentTerms: subscriptions.paymentTerms,
      })
      .from(subscriptions)
      .innerJoin(customers, eq(subscriptions.customerId, customers.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.id, id))
      .limit(1);
    if (!subscription) return response.status(404).json({ message: "Subscription not found." });
    const items = await db
      .select()
      .from(subscriptionItems)
      .where(eq(subscriptionItems.subscriptionId, id));
    return response.json({ ...subscription, items });
  } catch (error) {
    return serverError(response, error, "Loading subscription");
  }
}

export async function createSubscription(request, response) {
  const body = request.body ?? {};
  const status = request.path.startsWith("/quotations") ? "QUOTATION" : (body.status || "DRAFT");
  if (!SUBSCRIPTION_STATUSES.includes(status)) {
    return response.status(400).json({ message: "Choose a valid subscription status." });
  }
  try {
    const customerId = Number(body.customerId);
    const planId = Number(body.planId);
    const startDate = body.startDate || new Date().toISOString().slice(0, 10);
    if (!Number.isSafeInteger(customerId) || customerId < 1 || !Number.isSafeInteger(planId) || planId < 1) {
      throw new Error("A valid customer and plan are required.");
    }
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (!plan) throw new Error("The selected plan does not exist.");
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const subscriptionNumber = `SUB-${Date.now()}-${randomSuffix()}`;
    const created = await db.transaction(async (transaction) => {
      const [subscription] = await transaction
        .insert(subscriptions)
        .values({
          subscriptionNumber,
          customerId,
          planId,
          startDate,
          expiryDate: body.expiryDate || null,
          nextBillingDate: addFrequency(startDate, plan.billingFrequency),
          paymentTerms: body.paymentTerms || null,
          quotationValidUntil: status === "QUOTATION" ? body.quotationValidUntil || null : null,
          status,
          createdBy: request.user.id,
        })
        .returning();
      for (const item of rawItems) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);
        if (!Number.isSafeInteger(productId) || productId < 1 || !Number.isSafeInteger(quantity) || quantity < 1) {
          throw new Error("Each line item needs a valid product and positive quantity.");
        }
        const [product] = await transaction
          .select()
          .from(products)
          .where(eq(products.id, productId))
          .limit(1);
        if (!product) throw new Error(`Product ${productId} does not exist.`);
        const unitPrice = Number(product.salesPrice);
        await transaction.insert(subscriptionItems).values({
          subscriptionId: subscription.id,
          productId,
          variantId: item.variantId ? Number(item.variantId) : null,
          productName: product.name,
          quantity,
          unitPrice: String(unitPrice),
          taxPercentage: "0",
          amount: String(unitPrice * quantity),
        });
      }
      return subscription;
    });
    return response.status(201).json(created);
  } catch (error) {
    return error.code ? serverError(response, error, "Creating subscription") : validationError(response, error);
  }
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function updateSubscription(request, response) {
  const id = idFrom(request, response);
  if (id === null) return;
  const status = request.body?.status;
  if (!SUBSCRIPTION_STATUSES.includes(status)) {
    return response.status(400).json({ message: "Choose a valid subscription status." });
  }
  try {
    const [subscription] = await db
      .update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, id))
      .returning();
    if (!subscription) return response.status(404).json({ message: "Subscription not found." });
    return response.json(subscription);
  } catch (error) {
    return serverError(response, error, "Updating subscription");
  }
}

export async function getInvoices(_request, response) {
  try {
    const rows = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        customerId: invoices.customerId,
        customerName: customers.name,
        subscriptionId: invoices.subscriptionId,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        totalAmount: invoices.totalAmount,
        amountPaid: invoices.amountPaid,
        status: invoices.status,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(invoices.invoiceDate));
    return response.json(rows);
  } catch (error) {
    return serverError(response, error, "Loading invoices");
  }
}

export async function getInvoice(request, response) {
  const id = idFrom(request, response);
  if (id === null) return;
  try {
    const [invoice] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        customerId: invoices.customerId,
        customerName: customers.name,
        subscriptionId: invoices.subscriptionId,
        periodStart: invoices.periodStart,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        discountAmount: invoices.discountAmount,
        taxAmount: invoices.taxAmount,
        totalAmount: invoices.totalAmount,
        amountPaid: invoices.amountPaid,
        status: invoices.status,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.id, id))
      .limit(1);
    if (!invoice) return response.status(404).json({ message: "Invoice not found." });
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    const paymentRows = await db.select().from(payments).where(eq(payments.invoiceId, id));
    return response.json({ ...invoice, items, payments: paymentRows });
  } catch (error) {
    return serverError(response, error, "Loading invoice");
  }
}

export async function createInvoice(request, response) {
  try {
    const customerId = Number(request.body?.customerId);
    if (!Number.isSafeInteger(customerId) || customerId < 1) throw new Error("A valid customer is required.");
    const items = request.body.items;
    if (!Array.isArray(items) || items.length === 0) throw new Error("At least one invoice item is required.");
    const preparedItems = items.map((item) => {
      const name = requiredText(item.productName, "Item name", 200);
      const quantity = Number(item.quantity);
      const unitPrice = positiveNumber(item.unitPrice, "Unit price", true);
      const taxPercentage = item.taxPercentage === undefined ? 0 : positiveNumber(item.taxPercentage, "Tax percentage", true);
      if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Item quantity must be a positive whole number.");
      const amount = quantity * unitPrice;
      return { productName: name, quantity, unitPrice, taxPercentage, amount: amount + amount * taxPercentage / 100 };
    });
    const subtotal = preparedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = preparedItems.reduce((sum, item) => sum + item.amount - item.quantity * item.unitPrice, 0);
    const invoice = await db.transaction(async (transaction) => {
      const [createdInvoice] = await transaction
        .insert(invoices)
        .values({
          invoiceNumber: `INV-${Date.now()}-${randomSuffix()}`,
          customerId,
          subscriptionId: request.body.subscriptionId ? Number(request.body.subscriptionId) : null,
          invoiceDate: request.body.invoiceDate || new Date().toISOString().slice(0, 10),
          dueDate: request.body.dueDate || null,
          subtotal: String(subtotal),
          taxAmount: String(taxAmount),
          totalAmount: String(subtotal + taxAmount),
          status: "CONFIRMED",
        })
        .returning();
      await transaction.insert(invoiceItems).values(
        preparedItems.map((item) => ({
          invoiceId: createdInvoice.id,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          taxPercentage: String(item.taxPercentage),
          amount: String(item.amount),
        })),
      );
      return createdInvoice;
    });
    return response.status(201).json(invoice);
  } catch (error) {
    return error.code ? serverError(response, error, "Creating invoice") : validationError(response, error);
  }
}

export async function getPayments(_request, response) {
  try {
    const rows = await db
      .select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        customerName: customers.name,
        method: payments.method,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        note: payments.note,
      })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(payments.paymentDate));
    return response.json(rows);
  } catch (error) {
    return serverError(response, error, "Loading payments");
  }
}

export async function createPayment(request, response) {
  const invoiceId = Number(request.params.id || request.body?.invoiceId);
  if (!Number.isSafeInteger(invoiceId) || invoiceId < 1) {
    return response.status(400).json({ message: "A valid invoice is required." });
  }
  try {
    const amount = positiveNumber(request.body?.amount, "Payment amount");
    const method = request.body.method;
    if (!PAYMENT_METHODS.includes(method)) throw new Error("Choose a valid payment method.");
    const payment = await db.transaction(async (transaction) => {
      const [invoice] = await transaction
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);
      if (!invoice) throw new Error("Invoice not found.");
      if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
        throw new Error("This invoice cannot receive payments.");
      }
      const balance = Number(invoice.totalAmount) - Number(invoice.amountPaid);
      if (amount > balance + 0.00001) throw new Error("Payment amount exceeds the invoice balance.");
      const [createdPayment] = await transaction
        .insert(payments)
        .values({
          invoiceId,
          method,
          amount: String(amount),
          paymentDate: request.body.paymentDate || new Date().toISOString().slice(0, 10),
          note: request.body.note || null,
        })
        .returning();
      const amountPaid = Number(invoice.amountPaid) + amount;
      await transaction
        .update(invoices)
        .set({
          amountPaid: String(amountPaid),
          status: amountPaid >= Number(invoice.totalAmount) ? "PAID" : invoice.status,
        })
        .where(eq(invoices.id, invoiceId));
      return createdPayment;
    });
    return response.status(201).json(payment);
  } catch (error) {
    return error.code ? serverError(response, error, "Recording payment") : validationError(response, error);
  }
}

export async function dashboard(_request, response) {
  try {
    const [customerRows, subscriptionRows, invoiceRows, paymentRows] = await Promise.all([
      db.select({ count: sql`count(*)` }).from(customers),
      db.select({ status: subscriptions.status }).from(subscriptions),
      db.select({ status: invoices.status, total: invoices.totalAmount, paid: invoices.amountPaid }).from(invoices),
      db.select({ amount: payments.amount }).from(payments),
    ]);
    const invoiceTotals = invoiceRows.reduce(
      (totals, invoice) => {
        totals.invoiced += Number(invoice.total);
        totals.paid += Number(invoice.paid);
        if (invoice.status === "CONFIRMED") totals.outstanding += Number(invoice.total) - Number(invoice.paid);
        return totals;
      },
      { invoiced: 0, paid: 0, outstanding: 0 },
    );
    return response.json({
      customers: Number(customerRows[0]?.count || 0),
      subscriptions: subscriptionRows.length,
      activeSubscriptions: subscriptionRows.filter((item) => item.status === "ACTIVE").length,
      invoices: invoiceRows.length,
      paidInvoices: invoiceRows.filter((item) => item.status === "PAID").length,
      revenue: invoiceTotals.paid,
      outstanding: invoiceTotals.outstanding,
      payments: paymentRows.reduce((total, item) => total + Number(item.amount), 0),
    });
  } catch (error) {
    return serverError(response, error, "Loading dashboard");
  }
}
