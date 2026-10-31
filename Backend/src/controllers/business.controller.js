import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray, lte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  auditLogs,
  customers,
  invoiceItems,
  invoices,
  payments,
  plans,
  staffAssignments,
  subscriptions,
  users,
} from "../db/schema.js";

const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CARD", "UPI", "OTHER"];
const isAdmin = (request) => request.user.role === "ADMIN";

async function customerIdsFor(user) {
  if (user.role === "ADMIN") return null;
  if (user.role === "CUSTOMER") {
    const rows = await db.select({ id: customers.id }).from(customers).where(eq(customers.userId, user.id));
    return rows.map(({ id }) => id);
  }
  const rows = await db
    .select({ id: staffAssignments.customerId })
    .from(staffAssignments)
    .where(eq(staffAssignments.staffId, user.id));
  return rows.map(({ id }) => id);
}

function scopeCondition(column, customerIds) {
  if (customerIds === null) return undefined;
  return customerIds.length ? inArray(column, customerIds) : sql`false`;
}

async function writeAudit(transaction, request, action, entityType, entityId, details = {}) {
  await transaction.insert(auditLogs).values({
    actorId: request.user.id,
    action,
    entityType,
    entityId,
    details: JSON.stringify(details),
  });
}

function badRequest(response, message) {
  return response.status(400).json({ message });
}

function dbFailure(response, error, operation) {
  if (error.code === "23503") return badRequest(response, "A referenced record does not exist.");
  if (error.code === "23505") return response.status(409).json({ message: "This operation conflicts with an existing record." });
  console.error(`${operation} failed:`, error);
  return response.status(500).json({ message: `${operation} failed. Please try again.` });
}

function nextPeriodDate(dateValue, frequency) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  if (frequency === "DAILY") date.setUTCDate(date.getUTCDate() + 1);
  if (frequency === "WEEKLY") date.setUTCDate(date.getUTCDate() + 7);
  if (frequency === "MONTHLY") {
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + 1);
    date.setUTCDate(Math.min(day, new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()));
  }
  if (frequency === "YEARLY") {
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCFullYear(date.getUTCFullYear() + 1);
    date.setUTCMonth(month);
    date.setUTCDate(Math.min(day, new Date(Date.UTC(date.getUTCFullYear(), month + 1, 0)).getUTCDate()));
  }
  return date.toISOString().slice(0, 10);
}

function makeNumber(prefix) {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function listPublicPlans(_request, response) {
  try {
    const rows = await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.price);
    return response.json(rows);
  } catch (error) {
    return dbFailure(response, error, "Loading plans");
  }
}

export async function listPlans(request, response) {
  try {
    const rows = isAdmin(request)
      ? await db.select().from(plans).orderBy(plans.name)
      : await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.name);
    return response.json(rows);
  } catch (error) {
    return dbFailure(response, error, "Loading plans");
  }
}

export async function getPlan(request, response) {
  const planId = Number(request.params.id);
  if (!Number.isSafeInteger(planId) || planId < 1) return badRequest(response, "A valid plan ID is required.");
  try {
    const conditions = [eq(plans.id, planId)];
    if (!isAdmin(request)) conditions.push(eq(plans.isActive, true));
    const [plan] = await db.select().from(plans).where(and(...conditions)).limit(1);
    if (!plan) return response.status(404).json({ message: "Plan not found." });
    return response.json(plan);
  } catch (error) {
    return dbFailure(response, error, "Loading plan");
  }
}

export async function createPlan(request, response) {
  const body = request.body ?? {};
  const price = Number(body.price);
  if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 200) {
    return badRequest(response, "Plan name is required and must be at most 200 characters.");
  }
  if (!Number.isFinite(price) || price < 0 || !/^[A-Z]{3}$/.test(body.currency || "INR")) {
    return badRequest(response, "Provide a valid price and three-letter currency.");
  }
  if (!FREQUENCIES.includes(body.billingFrequency)) return badRequest(response, "Choose a valid billing frequency.");
  try {
    const [plan] = await db.transaction(async (transaction) => {
      const created = await transaction.insert(plans).values({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        price: String(price),
        currency: body.currency || "INR",
        billingFrequency: body.billingFrequency,
        isActive: body.isActive !== false,
        minQuantity: Math.max(1, Number(body.minQuantity) || 1),
      }).returning();
      await writeAudit(transaction, request, "PLAN_CREATED", "plan", created.id, { price, currency: created.currency });
      return created;
    });
    return response.status(201).json(plan);
  } catch (error) {
    return dbFailure(response, error, "Creating plan");
  }
}

export async function updatePlan(request, response) {
  const id = Number(request.params.id);
  const body = request.body ?? {};
  if (!Number.isSafeInteger(id) || id < 1) return badRequest(response, "A valid plan ID is required.");
  if (!Object.keys(body).length) return badRequest(response, "At least one plan field must be provided.");
  const changes = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 200) return badRequest(response, "Enter a valid plan name.");
    changes.name = body.name.trim();
  }
  if (body.description !== undefined) changes.description = body.description?.trim() || null;
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) return badRequest(response, "Price must be zero or greater.");
    changes.price = String(price);
  }
  if (body.currency !== undefined) {
    if (!/^[A-Z]{3}$/.test(body.currency)) return badRequest(response, "Currency must be a three-letter code.");
    changes.currency = body.currency;
  }
  if (body.billingFrequency !== undefined) {
    if (!FREQUENCIES.includes(body.billingFrequency)) return badRequest(response, "Choose a valid billing frequency.");
    changes.billingFrequency = body.billingFrequency;
  }
  if (body.isActive !== undefined) changes.isActive = Boolean(body.isActive);
  try {
    const plan = await db.transaction(async (transaction) => {
      const [updated] = await transaction.update(plans).set(changes).where(eq(plans.id, id)).returning();
      if (updated) await writeAudit(transaction, request, "PLAN_UPDATED", "plan", id, changes);
      return updated;
    });
    if (!plan) return response.status(404).json({ message: "Plan not found." });
    return response.json(plan);
  } catch (error) {
    return dbFailure(response, error, "Updating plan");
  }
}

export async function listCustomers(request, response) {
  try {
    const ids = await customerIdsFor(request.user);
    const condition = scopeCondition(customers.id, ids);
    const rows = await db.select().from(customers).where(condition).orderBy(customers.name);
    return response.json(rows);
  } catch (error) {
    return dbFailure(response, error, "Loading customers");
  }
}

export async function createCustomer(request, response) {
  const body = request.body ?? {};
  if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 150) {
    return badRequest(response, "Customer name is required.");
  }
  try {
    const customer = await db.transaction(async (transaction) => {
      const [created] = await transaction.insert(customers).values({
        name: body.name.trim(),
        email: typeof body.email === "string" ? body.email.trim().toLowerCase() || null : null,
        companyName: body.companyName?.trim() || null,
        phone: body.phone?.trim() || null,
        address: body.address?.trim() || null,
      }).returning();
      await writeAudit(transaction, request, "CUSTOMER_CREATED", "customer", created.id);
      return created;
    });
    return response.status(201).json(customer);
  } catch (error) {
    return dbFailure(response, error, "Creating customer");
  }
}

export async function getCustomer(request, response) {
  const customerId = Number(request.params.id);
  if (!Number.isSafeInteger(customerId) || customerId < 1) return badRequest(response, "A valid customer ID is required.");
  try {
    const ids = await customerIdsFor(request.user);
    const conditions = [eq(customers.id, customerId)];
    if (ids !== null) conditions.push(scopeCondition(customers.id, ids));
    const [customer] = await db.select().from(customers).where(and(...conditions)).limit(1);
    if (!customer) return response.status(404).json({ message: "Customer not found." });
    return response.json(customer);
  } catch (error) {
    return dbFailure(response, error, "Loading customer");
  }
}

export async function assignStaff(request, response) {
  const staffId = Number(request.body?.staffId);
  const customerId = Number(request.body?.customerId);
  if (!Number.isSafeInteger(staffId) || !Number.isSafeInteger(customerId)) return badRequest(response, "Staff and customer IDs are required.");
  try {
    const [staff] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, staffId)).limit(1);
    if (!staff || staff.role !== "STAFF") return badRequest(response, "The selected user is not staff.");
    const assignment = await db.transaction(async (transaction) => {
      const [created] = await transaction.insert(staffAssignments).values({
        staffId, customerId, assignedBy: request.user.id,
      }).onConflictDoNothing().returning();
      await writeAudit(transaction, request, "STAFF_ASSIGNED", "customer", customerId, { staffId });
      return created;
    });
    return response.status(201).json(assignment || { staffId, customerId, message: "Assignment already exists." });
  } catch (error) {
    return dbFailure(response, error, "Assigning staff");
  }
}

export async function listAdminUsers(_request, response) {
  try {
    const rows = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).orderBy(users.createdAt);
    return response.json(rows);
  } catch (error) {
    return dbFailure(response, error, "Loading users");
  }
}

export async function updateUserRole(request, response) {
  const userId = Number(request.params.id);
  const role = request.body?.role;
  if (!Number.isSafeInteger(userId) || userId < 1) return badRequest(response, "A valid user ID is required.");
  if (!["STAFF", "CUSTOMER"].includes(role)) return badRequest(response, "Only STAFF and CUSTOMER roles can be assigned here.");
  if (userId === request.user.id) return badRequest(response, "You cannot change your own administrator role.");
  try {
    const [existing] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!existing || existing.role === "ADMIN") return response.status(404).json({ message: "User not found or role cannot be changed." });
    const [user] = await db.transaction(async (transaction) => {
      const result = await transaction.update(users).set({ role }).where(eq(users.id, userId))
        .returning({ id: users.id, name: users.name, email: users.email, role: users.role });
      if (result[0]) await writeAudit(transaction, request, "USER_ROLE_UPDATED", "user", userId, { from: existing.role, to: role });
      return result;
    });
    return response.json(user);
  } catch (error) {
    return dbFailure(response, error, "Updating user role");
  }
}

export async function listStaffAssignments(_request, response) {
  try {
    const rows = await db.select({
      staffId: staffAssignments.staffId,
      staffName: users.name,
      staffEmail: users.email,
      customerId: staffAssignments.customerId,
      customerName: customers.name,
      assignedAt: staffAssignments.assignedAt,
    }).from(staffAssignments)
      .innerJoin(users, eq(staffAssignments.staffId, users.id))
      .innerJoin(customers, eq(staffAssignments.customerId, customers.id))
      .orderBy(desc(staffAssignments.assignedAt));
    return response.json(rows);
  } catch (error) {
    return dbFailure(response, error, "Loading staff assignments");
  }
}

export async function getSubscriptions(request, response) {
  try {
    const ids = await customerIdsFor(request.user);
    const where = scopeCondition(subscriptions.customerId, ids);
    const rows = await db.select({
      id: subscriptions.id,
      subscriptionNumber: subscriptions.subscriptionNumber,
      customerId: subscriptions.customerId,
      customerName: customers.name,
      planId: subscriptions.planId,
      planName: plans.name,
      agreedPrice: subscriptions.agreedPrice,
      currency: subscriptions.currency,
      billingFrequency: subscriptions.billingFrequency,
      source: subscriptions.source,
      startDate: subscriptions.startDate,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      nextBillingDate: subscriptions.nextBillingDate,
      status: subscriptions.status,
    }).from(subscriptions)
      .innerJoin(customers, eq(subscriptions.customerId, customers.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(where)
      .orderBy(desc(subscriptions.createdAt));
    return response.json(rows);
  } catch (error) {
    return dbFailure(response, error, "Loading subscriptions");
  }
}

export async function listQuotations(request, response) {
  try {
    const ids = await customerIdsFor(request.user);
    const rows = await db.select({
      id: subscriptions.id,
      subscriptionNumber: subscriptions.subscriptionNumber,
      customerId: subscriptions.customerId,
      customerName: customers.name,
      planName: plans.name,
      agreedPrice: subscriptions.agreedPrice,
      currency: subscriptions.currency,
      quotationValidUntil: subscriptions.quotationValidUntil,
      status: subscriptions.status,
    }).from(subscriptions)
      .innerJoin(customers, eq(subscriptions.customerId, customers.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(and(eq(subscriptions.status, "QUOTATION"), scopeCondition(subscriptions.customerId, ids)))
      .orderBy(desc(subscriptions.createdAt));
    return response.json(rows);
  } catch (error) {
    return dbFailure(response, error, "Loading quotations");
  }
}

export async function getSubscription(request, response) {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return badRequest(response, "A valid subscription ID is required.");
  try {
    const ids = await customerIdsFor(request.user);
    const conditions = [eq(subscriptions.id, id)];
    if (ids !== null) conditions.push(scopeCondition(subscriptions.customerId, ids));
    const [subscription] = await db.select({
      id: subscriptions.id,
      subscriptionNumber: subscriptions.subscriptionNumber,
      customerId: subscriptions.customerId,
      customerName: customers.name,
      planId: subscriptions.planId,
      planName: plans.name,
      agreedPrice: subscriptions.agreedPrice,
      currency: subscriptions.currency,
      billingFrequency: subscriptions.billingFrequency,
      source: subscriptions.source,
      startDate: subscriptions.startDate,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      nextBillingDate: subscriptions.nextBillingDate,
      status: subscriptions.status,
    }).from(subscriptions)
      .innerJoin(customers, eq(subscriptions.customerId, customers.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(and(...conditions))
      .limit(1);
    if (!subscription) return response.status(404).json({ message: "Subscription not found." });
    const subscriptionInvoices = await db.select().from(invoices)
      .where(eq(invoices.subscriptionId, id)).orderBy(desc(invoices.invoiceDate));
    return response.json({ ...subscription, invoices: subscriptionInvoices });
  } catch (error) {
    return dbFailure(response, error, "Loading subscription");
  }
}

async function createSubscriptionAndInvoice(request, {
  customerId,
  planId,
  source,
  startDate,
  complimentaryReason,
}) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  if (!customer) throw new Error("Customer not found.");
  const [plan] = await db.select().from(plans).where(and(eq(plans.id, planId), eq(plans.isActive, true))).limit(1);
  if (!plan) throw new Error("The selected plan is unavailable.");
  if (Number(plan.price) === 0 && !complimentaryReason) {
    throw new Error("Zero-price subscriptions require an explicitly authorized complimentary reason.");
  }
  const nextDate = nextPeriodDate(startDate, plan.billingFrequency);

  return db.transaction(async (transaction) => {
    const [subscription] = await transaction.insert(subscriptions).values({
      subscriptionNumber: makeNumber("SUB"),
      customerId,
      planId,
      source,
      agreedPrice: plan.price,
      currency: plan.currency,
      billingFrequency: plan.billingFrequency,
      startDate,
      currentPeriodEnd: nextDate,
      nextBillingDate: nextDate,
      status: "PENDING_PAYMENT",
      createdBy: request.user.id,
    }).returning();
    const [invoice] = await transaction.insert(invoices).values({
      invoiceNumber: makeNumber("INV"),
      customerId,
      subscriptionId: subscription.id,
      currency: plan.currency,
      periodStart: startDate,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      subtotal: plan.price,
      totalAmount: plan.price,
      status: "CONFIRMED",
      amountPaid: "0",
    }).returning();
    await transaction.insert(invoiceItems).values({
      invoiceId: invoice.id,
      productName: plan.name,
      quantity: 1,
      unitPrice: plan.price,
      amount: plan.price,
    });

    if (Number(plan.price) === 0 && complimentaryReason) {
      await transaction.update(invoices).set({ status: "PAID" }).where(eq(invoices.id, invoice.id));
      await transaction.update(subscriptions).set({ status: "ACTIVE" }).where(eq(subscriptions.id, subscription.id));
    }
    await writeAudit(transaction, request, "SUBSCRIPTION_CREATED", "subscription", subscription.id, {
      source,
      planId,
      invoiceId: invoice.id,
      agreedPrice: plan.price,
      currency: plan.currency,
      ...(complimentaryReason ? { complimentaryReason } : {}),
    });
    return {
      ...subscription,
      status: Number(plan.price) === 0 && complimentaryReason ? "ACTIVE" : subscription.status,
      invoice: {
        ...invoice,
        status: Number(plan.price) === 0 && complimentaryReason ? "PAID" : invoice.status,
      },
    };
  });
}

export async function selfSubscribe(request, response) {
  const planId = Number(request.body?.planId);
  if (!Number.isSafeInteger(planId) || planId < 1) return badRequest(response, "Select a valid plan.");
  try {
    const [customer] = await db.select({ id: customers.id }).from(customers).where(eq(customers.userId, request.user.id)).limit(1);
    if (!customer) return response.status(409).json({ message: "Your customer profile is missing. Contact support." });
    const result = await createSubscriptionAndInvoice(request, {
      customerId: customer.id,
      planId,
      source: "SELF_SERVICE",
      startDate: new Date().toISOString().slice(0, 10),
    });
    return response.status(201).json(result);
  } catch (error) {
    if (
      error.message === "Customer not found." ||
      error.message === "The selected plan is unavailable." ||
      error.message.startsWith("Zero-price subscriptions")
    ) return badRequest(response, error.message);
    return dbFailure(response, error, "Creating subscription");
  }
}

export async function adminCreateSubscription(request, response) {
  const customerId = Number(request.body?.customerId);
  const planId = Number(request.body?.planId);
  const startDate = request.body?.startDate || new Date().toISOString().slice(0, 10);
  if (!Number.isSafeInteger(customerId) || customerId < 1 || !Number.isSafeInteger(planId) || planId < 1) {
    return badRequest(response, "Select a valid customer and plan.");
  }
  try {
    const result = await createSubscriptionAndInvoice(request, {
      customerId,
      planId,
      source: "ADMIN",
      startDate,
      complimentaryReason: request.body?.complimentary === true
        ? String(request.body.complimentaryReason || "").trim()
        : undefined,
    });
    return response.status(201).json(result);
  } catch (error) {
    if (
      error.message === "Customer not found." ||
      error.message === "The selected plan is unavailable." ||
      error.message.startsWith("Zero-price subscriptions")
    ) return badRequest(response, error.message);
    return dbFailure(response, error, "Creating subscription");
  }
}

export async function createQuotation(request, response) {
  const customerId = Number(request.body?.customerId);
  const planId = Number(request.body?.planId);
  if (!Number.isSafeInteger(customerId) || customerId < 1 || !Number.isSafeInteger(planId) || planId < 1) {
    return badRequest(response, "Select a valid customer and plan.");
  }
  try {
    const [customer] = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, customerId)).limit(1);
    const [plan] = await db.select().from(plans).where(and(eq(plans.id, planId), eq(plans.isActive, true))).limit(1);
    if (!customer || !plan) return badRequest(response, "The selected customer or plan is unavailable.");
    const startDate = request.body.startDate || new Date().toISOString().slice(0, 10);
    const [quotation] = await db.transaction(async (transaction) => {
      const [created] = await transaction.insert(subscriptions).values({
        subscriptionNumber: makeNumber("QUO"),
        customerId,
        planId,
        source: "ADMIN",
        agreedPrice: plan.price,
        currency: plan.currency,
        billingFrequency: plan.billingFrequency,
        startDate,
        currentPeriodEnd: nextPeriodDate(startDate, plan.billingFrequency),
        nextBillingDate: nextPeriodDate(startDate, plan.billingFrequency),
        quotationValidUntil: request.body.quotationValidUntil || null,
        status: "QUOTATION",
        createdBy: request.user.id,
      }).returning();
      await writeAudit(transaction, request, "QUOTATION_CREATED", "subscription", created.id, { customerId, planId });
      return created;
    });
    return response.status(201).json(quotation);
  } catch (error) {
    return dbFailure(response, error, "Creating quotation");
  }
}

export async function adminCreateInvoice(request, response) {
  const body = request.body ?? {};
  const customerId = Number(body.customerId);
  const items = body.items;
  if (!Number.isSafeInteger(customerId) || customerId < 1) return badRequest(response, "A valid customer is required.");
  if (!Array.isArray(items) || items.length === 0) return badRequest(response, "At least one invoice item is required.");

  const prepared = [];
  for (const item of items) {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const taxPercentage = Number(item.taxPercentage || 0);
    if (
      typeof item.productName !== "string" ||
      !item.productName.trim() ||
      item.productName.length > 200 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      !Number.isFinite(taxPercentage) ||
      taxPercentage < 0 ||
      taxPercentage > 100
    ) return badRequest(response, "Invoice items need a name, positive quantity, valid unit price, and tax up to 100%.");
    const base = quantity * unitPrice;
    prepared.push({
      productName: item.productName.trim(),
      quantity,
      unitPrice,
      taxPercentage,
      amount: base + base * taxPercentage / 100,
    });
  }
  const subtotal = prepared.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = prepared.reduce((sum, item) => sum + item.amount - item.quantity * item.unitPrice, 0);
  try {
    const result = await db.transaction(async (transaction) => {
      const [invoice] = await transaction.insert(invoices).values({
        invoiceNumber: makeNumber("INV"),
        customerId,
        currency: /^[A-Z]{3}$/.test(body.currency || "INR") ? body.currency || "INR" : "INR",
        invoiceDate: body.invoiceDate || new Date().toISOString().slice(0, 10),
        dueDate: body.dueDate || null,
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        totalAmount: String(subtotal + taxAmount),
        status: "CONFIRMED",
      }).returning();
      await transaction.insert(invoiceItems).values(prepared.map((item) => ({
        invoiceId: invoice.id,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
        taxPercentage: String(item.taxPercentage),
        amount: String(item.amount),
      })));
      await writeAudit(transaction, request, "INVOICE_CREATED", "invoice", invoice.id, { customerId, totalAmount: invoice.totalAmount });
      return invoice;
    });
    return response.status(201).json(result);
  } catch (error) {
    return dbFailure(response, error, "Creating invoice");
  }
}

export async function requestCancellation(request, response) {
  const subscriptionId = Number(request.params.id);
  if (!Number.isSafeInteger(subscriptionId) || subscriptionId < 1) return badRequest(response, "A valid subscription ID is required.");
  try {
    const ids = await customerIdsFor(request.user);
    const conditions = [eq(subscriptions.id, subscriptionId)];
    if (ids !== null) conditions.push(scopeCondition(subscriptions.customerId, ids));
    const updated = await db.transaction(async (transaction) => {
      const [subscription] = await transaction.select().from(subscriptions).where(and(...conditions)).limit(1);
      if (!subscription) return null;
      if (!["ACTIVE", "PAST_DUE"].includes(subscription.status)) {
        throw new Error("Only active or past-due subscriptions can be scheduled for cancellation.");
      }
      const [result] = await transaction.update(subscriptions)
        .set({ status: "CANCEL_SCHEDULED" })
        .where(eq(subscriptions.id, subscriptionId)).returning();
      await writeAudit(transaction, request, "CANCELLATION_SCHEDULED", "subscription", subscriptionId, { periodEnd: subscription.currentPeriodEnd });
      return result;
    });
    if (!updated) return response.status(404).json({ message: "Subscription not found." });
    return response.json(updated);
  } catch (error) {
    if (!error.code) return badRequest(response, error.message);
    return dbFailure(response, error, "Scheduling cancellation");
  }
}

export async function reverseCancellation(request, response) {
  const subscriptionId = Number(request.params.id);
  try {
    const ids = await customerIdsFor(request.user);
    const conditions = [eq(subscriptions.id, subscriptionId), eq(subscriptions.status, "CANCEL_SCHEDULED")];
    if (ids !== null) conditions.push(scopeCondition(subscriptions.customerId, ids));
    const [updated] = await db.transaction(async (transaction) => {
      const rows = await transaction.update(subscriptions)
        .set({ status: "ACTIVE" })
        .where(and(...conditions))
        .returning();
      if (rows[0]) await writeAudit(transaction, request, "CANCELLATION_REVERSED", "subscription", subscriptionId);
      return rows;
    });
    if (!updated) return response.status(404).json({ message: "Cancelable subscription not found." });
    return response.json(updated);
  } catch (error) {
    return dbFailure(response, error, "Reversing cancellation");
  }
}

export async function requestStaffCancellation(request, response) {
  const subscriptionId = Number(request.params.id);
  if (!Number.isSafeInteger(subscriptionId) || subscriptionId < 1) return badRequest(response, "A valid subscription ID is required.");
  try {
    const assignedIds = await customerIdsFor(request.user);
    if (!assignedIds?.length) return response.status(404).json({ message: "Assigned subscription not found." });
    const [subscription] = await db.select({
      id: subscriptions.id,
      customerId: subscriptions.customerId,
      status: subscriptions.status,
    }).from(subscriptions).where(and(
      eq(subscriptions.id, subscriptionId),
      inArray(subscriptions.customerId, assignedIds),
    )).limit(1);
    if (!subscription) return response.status(404).json({ message: "Assigned subscription not found." });
    if (!["ACTIVE", "PAST_DUE"].includes(subscription.status)) {
      return badRequest(response, "Only active or past-due subscriptions can have a cancellation request.");
    }
    await db.transaction(async (transaction) => {
      await writeAudit(transaction, request, "STAFF_CANCELLATION_REQUESTED", "subscription", subscriptionId, {
        customerId: subscription.customerId,
        note: typeof request.body?.note === "string" ? request.body.note.slice(0, 1000) : "",
      });
    });
    return response.status(202).json({ message: "Cancellation request recorded for administrator review." });
  } catch (error) {
    return dbFailure(response, error, "Recording staff cancellation request");
  }
}

export async function listInvoices(request, response) {
  try {
    const ids = await customerIdsFor(request.user);
    const rows = await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      customerName: customers.name,
      subscriptionId: invoices.subscriptionId,
      currency: invoices.currency,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      totalAmount: invoices.totalAmount,
      amountPaid: invoices.amountPaid,
      status: invoices.status,
    }).from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(scopeCondition(invoices.customerId, ids))
      .orderBy(desc(invoices.invoiceDate));
    return response.json(rows);
  } catch (error) {
    return dbFailure(response, error, "Loading invoices");
  }
}

export async function getInvoice(request, response) {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return badRequest(response, "A valid invoice ID is required.");
  try {
    const ids = await customerIdsFor(request.user);
    const conditions = [eq(invoices.id, id)];
    if (ids !== null) conditions.push(scopeCondition(invoices.customerId, ids));
    const [invoice] = await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      customerName: customers.name,
      subscriptionId: invoices.subscriptionId,
      currency: invoices.currency,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      subtotal: invoices.subtotal,
      totalAmount: invoices.totalAmount,
      amountPaid: invoices.amountPaid,
      status: invoices.status,
    }).from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(...conditions))
      .limit(1);
    if (!invoice) return response.status(404).json({ message: "Invoice not found." });
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    const paymentRows = await db.select().from(payments)
      .where(and(eq(payments.invoiceId, id), eq(payments.status, "SUCCEEDED")));
    return response.json({ ...invoice, items, payments: paymentRows });
  } catch (error) {
    return dbFailure(response, error, "Loading invoice");
  }
}

export async function createCheckout(request, response) {
  if (process.env.NODE_ENV === "production" || process.env.PAYMENT_MODE === "live") {
    return response.status(503).json({
      message: "No payment provider is configured. Checkout is unavailable until provider verification is enabled.",
    });
  }
  const invoiceId = Number(request.params.id);
  if (!Number.isSafeInteger(invoiceId) || invoiceId < 1) return badRequest(response, "A valid invoice ID is required.");
  try {
    const customerRows = await customerIdsFor(request.user);
    if (!customerRows?.length) return response.status(404).json({ message: "Invoice not found." });
    const result = await db.transaction(async (transaction) => {
      const [invoice] = await transaction.select().from(invoices)
        .where(and(eq(invoices.id, invoiceId), inArray(invoices.customerId, customerRows)))
        .limit(1);
      if (!invoice) return null;
      if (["PAID", "CANCELLED"].includes(invoice.status)) throw new Error("This invoice is not payable.");
      const amountDue = Number(invoice.totalAmount) - Number(invoice.amountPaid);
      if (amountDue <= 0) throw new Error("This invoice has no remaining balance.");
      const [payment] = await transaction.insert(payments).values({
        invoiceId,
        method: "CARD",
        status: "PENDING",
        amount: String(amountDue),
        providerReference: `TEST-${randomUUID()}`,
        note: process.env.NODE_ENV === "production" ? "Awaiting payment provider" : "Development test checkout",
      }).returning();
      await writeAudit(transaction, request, "CHECKOUT_STARTED", "payment", payment.id, { invoiceId, amount: amountDue });
      return payment;
    });
    if (!result) return response.status(404).json({ message: "Invoice not found." });
    return response.status(201).json({
      payment: result,
      mode: "test",
      message: "Development test checkout created; no real charge was made.",
    });
  } catch (error) {
    if (!error.code) return badRequest(response, error.message);
    return dbFailure(response, error, "Starting checkout");
  }
}

export async function completeTestCheckout(request, response) {
  if (process.env.NODE_ENV === "production" || process.env.PAYMENT_MODE === "live") {
    return response.status(404).json({ message: "Test payment confirmation is disabled." });
  }
  const paymentId = Number(request.params.id);
  if (!Number.isSafeInteger(paymentId) || paymentId < 1) return badRequest(response, "A valid payment ID is required.");
  try {
    const ids = await customerIdsFor(request.user);
    if (!ids?.length) return response.status(404).json({ message: "Payment not found." });
    const result = await db.transaction(async (transaction) => {
      const [payment] = await transaction.select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        amount: payments.amount,
        status: payments.status,
        customerId: invoices.customerId,
      }).from(payments)
        .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
        .where(and(
          eq(payments.id, paymentId),
          inArray(invoices.customerId, ids),
        )).limit(1);
      if (!payment || payment.status !== "PENDING") return null;
      const [invoice] = await transaction.select().from(invoices)
        .where(eq(invoices.id, payment.invoiceId)).limit(1);
      if (!invoice || ["PAID", "CANCELLED"].includes(invoice.status)) return null;
      const newPaid = Number(invoice.amountPaid) + Number(payment.amount);
      const [confirmed] = await transaction.update(payments)
        .set({ status: "SUCCEEDED", paidAt: new Date(), paymentDate: new Date().toISOString().slice(0, 10), note: "Development test payment; not a real charge" })
        .where(and(eq(payments.id, paymentId), eq(payments.status, "PENDING")))
        .returning();
      if (!confirmed) return null;
      await transaction.update(invoices).set({
        amountPaid: String(newPaid),
        status: newPaid >= Number(invoice.totalAmount) ? "PAID" : "PARTIALLY_PAID",
      }).where(eq(invoices.id, invoice.id));
      if (invoice.subscriptionId && newPaid >= Number(invoice.totalAmount)) {
        const [subscription] = await transaction.select().from(subscriptions)
          .where(eq(subscriptions.id, invoice.subscriptionId)).limit(1);
        const [unpaidRenewal] = await transaction.select({ id: invoices.id })
          .from(invoices)
          .where(and(
            eq(invoices.subscriptionId, invoice.subscriptionId),
            inArray(invoices.status, ["CONFIRMED", "PARTIALLY_PAID", "OVERDUE"]),
          ))
          .limit(1);
        if (
          subscription &&
          !unpaidRenewal &&
          ["PENDING_PAYMENT", "PAST_DUE", "ACTIVE"].includes(subscription.status)
        ) {
          await transaction.update(subscriptions).set({
            status: "ACTIVE",
            currentPeriodEnd: subscription.nextBillingDate,
          })
            .where(eq(subscriptions.id, subscription.id));
          await writeAudit(transaction, request, "SUBSCRIPTION_PAYMENT_CONFIRMED", "subscription", subscription.id, { paymentId });
        }
      }
      await writeAudit(transaction, request, "TEST_PAYMENT_SUCCEEDED", "payment", paymentId, { invoiceId: invoice.id, amount: payment.amount });
      return { payment: confirmed, invoiceId: invoice.id };
    });
    if (!result) return response.status(409).json({ message: "Pending test payment was not found or is no longer payable." });
    return response.json({
      ...result,
      mode: "test",
      message: "Development test payment recorded; no real charge was made.",
    });
  } catch (error) {
    return dbFailure(response, error, "Confirming test payment");
  }
}

export async function recordManualPayment(request, response) {
  const invoiceId = Number(request.params.id);
  const amount = Number(request.body?.amount);
  const method = request.body?.method;
  if (!Number.isSafeInteger(invoiceId) || invoiceId < 1) return badRequest(response, "A valid invoice ID is required.");
  if (!Number.isFinite(amount) || amount <= 0) return badRequest(response, "Payment must be greater than zero.");
  if (!PAYMENT_METHODS.includes(method)) return badRequest(response, "Choose a valid payment method.");
  try {
    const result = await db.transaction(async (transaction) => {
      const [invoice] = await transaction.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      if (!invoice || ["PAID", "CANCELLED"].includes(invoice.status)) throw new Error("Invoice is not payable.");
      const balance = Number(invoice.totalAmount) - Number(invoice.amountPaid);
      if (amount > balance + 0.00001) throw new Error("Payment exceeds the invoice balance.");
      const [payment] = await transaction.insert(payments).values({
        invoiceId, method, amount: String(amount), status: "SUCCEEDED", paidAt: new Date(),
        paymentDate: request.body.paymentDate || new Date().toISOString().slice(0, 10),
        note: request.body.note || "Manual payment recorded by admin",
      }).returning();
      const paid = Number(invoice.amountPaid) + amount;
      await transaction.update(invoices).set({
        amountPaid: String(paid),
        status: paid >= Number(invoice.totalAmount) ? "PAID" : "PARTIALLY_PAID",
      }).where(eq(invoices.id, invoiceId));
      if (invoice.subscriptionId && paid >= Number(invoice.totalAmount)) {
        const [subscription] = await transaction.select().from(subscriptions)
          .where(eq(subscriptions.id, invoice.subscriptionId)).limit(1);
        const [unpaidRenewal] = await transaction.select({ id: invoices.id })
          .from(invoices)
          .where(and(
            eq(invoices.subscriptionId, invoice.subscriptionId),
            inArray(invoices.status, ["CONFIRMED", "PARTIALLY_PAID", "OVERDUE"]),
          ))
          .limit(1);
        if (
          subscription &&
          !unpaidRenewal &&
          ["PENDING_PAYMENT", "PAST_DUE", "ACTIVE"].includes(subscription.status)
        ) {
          await transaction.update(subscriptions).set({
            status: "ACTIVE",
            currentPeriodEnd: subscription.nextBillingDate,
          })
            .where(eq(subscriptions.id, subscription.id));
          await writeAudit(transaction, request, "SUBSCRIPTION_PAYMENT_CONFIRMED", "subscription", subscription.id, { paymentId: payment.id });
        }
      }
      await writeAudit(transaction, request, "MANUAL_PAYMENT_RECORDED", "payment", payment.id, { invoiceId, amount, method });
      return payment;
    });
    return response.status(201).json(result);
  } catch (error) {
    if (!error.code) return badRequest(response, error.message);
    return dbFailure(response, error, "Recording manual payment");
  }
}

export async function listPayments(request, response) {
  try {
    const ids = await customerIdsFor(request.user);
    const rows = await db.select({
      id: payments.id,
      invoiceId: payments.invoiceId,
      invoiceNumber: invoices.invoiceNumber,
      customerName: customers.name,
      method: payments.method,
      status: payments.status,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      paidAt: payments.paidAt,
      note: payments.note,
    }).from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(scopeCondition(invoices.customerId, ids), eq(payments.status, "SUCCEEDED")))
      .orderBy(desc(payments.paymentDate));
    return response.json(rows);
  } catch (error) {
    return dbFailure(response, error, "Loading payments");
  }
}

export async function dashboard(request, response) {
  try {
    const ids = await customerIdsFor(request.user);
    const customersWhere = scopeCondition(customers.id, ids);
    const subscriptionWhere = scopeCondition(subscriptions.customerId, ids);
    const invoiceWhere = scopeCondition(invoices.customerId, ids);
    const [customerResult, subscriptionRows, invoiceRows] = await Promise.all([
      db.select({ count: sql`count(*)` }).from(customers).where(customersWhere),
      db.select({ status: subscriptions.status }).from(subscriptions).where(subscriptionWhere),
      db.select({ status: invoices.status, total: invoices.totalAmount, paid: invoices.amountPaid }).from(invoices).where(invoiceWhere),
    ]);
    const totals = invoiceRows.reduce((result, invoice) => {
      result.revenue += Number(invoice.paid);
      if (!["PAID", "CANCELLED"].includes(invoice.status)) result.outstanding += Number(invoice.total) - Number(invoice.paid);
      return result;
    }, { revenue: 0, outstanding: 0 });
    return response.json({
      customers: Number(customerResult[0]?.count || 0),
      subscriptions: subscriptionRows.length,
      activeSubscriptions: subscriptionRows.filter(({ status }) => status === "ACTIVE").length,
      pendingPayment: subscriptionRows.filter(({ status }) => status === "PENDING_PAYMENT").length,
      pastDue: subscriptionRows.filter(({ status }) => status === "PAST_DUE").length,
      invoices: invoiceRows.length,
      paidInvoices: invoiceRows.filter(({ status }) => status === "PAID").length,
      revenue: totals.revenue,
      outstanding: totals.outstanding,
    });
  } catch (error) {
    return dbFailure(response, error, "Loading dashboard");
  }
}

export async function processSubscriptionLifecycle() {
  const today = new Date().toISOString().slice(0, 10);
  return db.transaction(async (transaction) => {
    let renewalInvoices = 0;
    const dueSubscriptions = await transaction.select().from(subscriptions)
      .where(and(
        eq(subscriptions.status, "ACTIVE"),
        lte(subscriptions.nextBillingDate, sql`CURRENT_DATE`),
      ))
      .for("update");

    for (const subscription of dueSubscriptions) {
      let periodStart = String(subscription.nextBillingDate).slice(0, 10);
      let periodsProcessed = 0;
      while (periodStart <= today && periodsProcessed < 24) {
        const periodEnd = nextPeriodDate(periodStart, subscription.billingFrequency);
        const amount = Number(subscription.agreedPrice);
        const [existingInvoice] = await transaction.select({ id: invoices.id })
          .from(invoices)
          .where(and(
            eq(invoices.subscriptionId, subscription.id),
            eq(invoices.periodStart, periodStart),
          ))
          .limit(1);
        if (existingInvoice) {
          await transaction.update(subscriptions).set({
            nextBillingDate: periodEnd,
          }).where(eq(subscriptions.id, subscription.id));
          periodsProcessed += 1;
          periodStart = periodEnd;
          continue;
        }
        const [invoice] = await transaction.insert(invoices).values({
          invoiceNumber: makeNumber("INV"),
          customerId: subscription.customerId,
          subscriptionId: subscription.id,
          currency: subscription.currency,
          periodStart,
          invoiceDate: today,
          dueDate: periodStart,
          subtotal: subscription.agreedPrice,
          totalAmount: subscription.agreedPrice,
          amountPaid: "0",
          status: amount === 0 ? "PAID" : "CONFIRMED",
        }).returning();
        await transaction.insert(invoiceItems).values({
          invoiceId: invoice.id,
          productName: "Subscription renewal",
          quantity: 1,
          unitPrice: subscription.agreedPrice,
          amount: subscription.agreedPrice,
        });
        await transaction.update(subscriptions).set({
          nextBillingDate: periodEnd,
        }).where(eq(subscriptions.id, subscription.id));
        await transaction.insert(auditLogs).values({
          action: "RENEWAL_INVOICE_CREATED",
          entityType: "invoice",
          entityId: invoice.id,
          details: JSON.stringify({
            system: "billing_lifecycle",
            subscriptionId: subscription.id,
            periodStart,
            agreedPrice: subscription.agreedPrice,
            currency: subscription.currency,
          }),
        });
        renewalInvoices += 1;
        periodsProcessed += 1;
        periodStart = periodEnd;
      }
    }

    const overdue = await transaction.update(invoices)
      .set({ status: "OVERDUE" })
      .where(and(
        inArray(invoices.status, ["CONFIRMED", "PARTIALLY_PAID"]),
        gt(sql`CURRENT_DATE`, invoices.dueDate),
      )).returning({ id: invoices.id, subscriptionId: invoices.subscriptionId });
    const overdueSubscriptionIds = [...new Set(overdue.map(({ subscriptionId }) => subscriptionId).filter(Boolean))];
    const pastDue = overdueSubscriptionIds.length
      ? await transaction.update(subscriptions).set({ status: "PAST_DUE" })
        .where(and(
          eq(subscriptions.status, "ACTIVE"),
          inArray(subscriptions.id, overdueSubscriptionIds),
        )).returning({ id: subscriptions.id })
      : [];
    const pendingExpiredIds = await transaction.select({
      subscriptionId: invoices.subscriptionId,
    }).from(invoices).where(and(
      eq(invoices.status, "OVERDUE"),
      lte(invoices.dueDate, sql`CURRENT_DATE - INTERVAL '7 days'`),
    ));
    const pendingExpiredSubscriptionIds = [
      ...new Set(pendingExpiredIds.map(({ subscriptionId }) => subscriptionId).filter(Boolean)),
    ];
    const pendingExpired = pendingExpiredSubscriptionIds.length
      ? await transaction.update(subscriptions)
        .set({ status: "EXPIRED" })
        .where(and(
          eq(subscriptions.status, "PENDING_PAYMENT"),
          inArray(subscriptions.id, pendingExpiredSubscriptionIds),
        )).returning({ id: subscriptions.id })
      : [];
    const canceled = await transaction.update(subscriptions)
      .set({ status: "CANCELED" })
      .where(and(
        eq(subscriptions.status, "CANCEL_SCHEDULED"),
        lte(subscriptions.currentPeriodEnd, sql`CURRENT_DATE`),
      ))
      .returning({ id: subscriptions.id });
    const expired = await transaction.update(subscriptions)
      .set({ status: "EXPIRED" })
      .where(and(
        eq(subscriptions.status, "PAST_DUE"),
        lte(subscriptions.currentPeriodEnd, sql`CURRENT_DATE - INTERVAL '7 days'`),
      ))
      .returning({ id: subscriptions.id });
    const auditRows = [
      ...overdue.map((invoice) => ({
        action: "INVOICE_MARKED_OVERDUE",
        entityType: "invoice",
        entityId: invoice.id,
        details: JSON.stringify({ system: "billing_lifecycle" }),
      })),
      ...pastDue.map((subscription) => ({
        action: "SUBSCRIPTION_MARKED_PAST_DUE",
        entityType: "subscription",
        entityId: subscription.id,
        details: JSON.stringify({ system: "billing_lifecycle" }),
      })),
      ...pendingExpired.map((subscription) => ({
        action: "PENDING_SUBSCRIPTION_EXPIRED",
        entityType: "subscription",
        entityId: subscription.id,
        details: JSON.stringify({ system: "billing_lifecycle", graceDays: 7 }),
      })),
      ...canceled.map((subscription) => ({
        action: "SUBSCRIPTION_CANCELED",
        entityType: "subscription",
        entityId: subscription.id,
        details: JSON.stringify({ system: "billing_lifecycle" }),
      })),
      ...expired.map((subscription) => ({
        action: "SUBSCRIPTION_EXPIRED",
        entityType: "subscription",
        entityId: subscription.id,
        details: JSON.stringify({ system: "billing_lifecycle", graceDays: 7 }),
      })),
    ];
    if (auditRows.length) await transaction.insert(auditLogs).values(auditRows);
    return {
      renewalInvoices,
      overdueInvoices: overdue.length,
      pastDueSubscriptions: pastDue.length,
      expiredPendingSubscriptions: pendingExpired.length,
      canceledSubscriptions: canceled.length,
      expiredSubscriptions: expired.length,
      asOf: today,
    };
  });
}

export async function cancelExpiredSubscriptions(_request, response) {
  try {
    return response.json(await processSubscriptionLifecycle());
  } catch (error) {
    return dbFailure(response, error, "Processing subscription lifecycle");
  }
}
