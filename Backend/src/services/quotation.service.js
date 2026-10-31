import fs from 'fs';
import { eq, and, desc, sql, like, or, ilike } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  quotations,
  quotationItems,
  quotationActivityLogs,
  quotationMessages,
  customers,
  users,
  products,
  productVariants,
  plans,
  taxRates,
} from '../db/schema.js';
import { badRequest, notFound, forbidden } from '../utils/http-error.js';
import { generateQuotationNumber } from '../utils/quotation-number.js';
import { generateQuotationPDF } from '../utils/quotation-pdf.js';

function round2(val) {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

/**
 * Helper to get or create a customer record for a given user ID
 */
async function getOrCreateCustomerForUser(userId, tx = db) {
  const [customer] = await tx
    .select()
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);

  if (customer) return customer;

  const [user] = await tx
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw notFound('User not found');
  }

  const [created] = await tx
    .insert(customers)
    .values({
      userId: user.id,
      name: user.name,
      email: user.email,
    })
    .returning();

  return created;
}

// ─────────────────────────────────────────────────────────────
// CUSTOMER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Creates a new quotation request from a customer
 */
export async function createQuotation(userId, data) {
  return await db.transaction(async (tx) => {
    const customer = await getOrCreateCustomerForUser(userId, tx);

    const quotationNumber = await generateQuotationNumber(tx);

    let calculatedSubtotal = 0;
    let calculatedTaxTotal = 0;
    const preparedItems = [];

    for (const itemInput of data.items) {
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, itemInput.productId))
        .limit(1);

      if (!product) {
        throw badRequest(`Product with ID ${itemInput.productId} not found`);
      }

      let variant = null;
      if (itemInput.variantId) {
        const [foundVariant] = await tx
          .select()
          .from(productVariants)
          .where(and(
            eq(productVariants.id, itemInput.variantId),
            eq(productVariants.productId, product.id)
          ))
          .limit(1);

        if (!foundVariant) {
          throw badRequest(`Variant with ID ${itemInput.variantId} not found for product ${product.name}`);
        }
        variant = foundVariant;
      }

      let plan = null;
      if (itemInput.planId) {
        const [foundPlan] = await tx
          .select()
          .from(plans)
          .where(eq(plans.id, itemInput.planId))
          .limit(1);

        if (!foundPlan) {
          throw badRequest(`Plan with ID ${itemInput.planId} not found`);
        }
        plan = foundPlan;
      }

      let taxPercentage = 0;
      if (product.taxRateId) {
        const [taxRateRecord] = await tx
          .select()
          .from(taxRates)
          .where(eq(taxRates.id, product.taxRateId))
          .limit(1);
        if (taxRateRecord) {
          taxPercentage = Number(taxRateRecord.percentage) || 0;
        }
      }

      let unitPrice = Number(product.salesPrice) || 0;
      if (variant?.extraPrice) {
        unitPrice += Number(variant.extraPrice) || 0;
      }
      if (plan?.price && (!product.salesPrice || Number(product.salesPrice) === 0)) {
        unitPrice = Number(plan.price) || 0;
      }

      const quantity = itemInput.quantity;
      const discount = 0;
      const baseAfterDiscount = Math.max(0, round2(quantity * unitPrice - discount));
      const taxAmount = round2((baseAfterDiscount * taxPercentage) / 100);
      const lineTotal = round2(baseAfterDiscount + taxAmount);

      calculatedSubtotal = round2(calculatedSubtotal + quantity * unitPrice);
      calculatedTaxTotal = round2(calculatedTaxTotal + taxAmount);

      let productNameSnapshot = product.name;
      if (variant) {
        productNameSnapshot += ` (${variant.variantName})`;
      }

      preparedItems.push({
        productId: product.id,
        variantId: variant?.id ?? null,
        planId: plan?.id ?? null,
        productNameSnapshot,
        planNameSnapshot: plan?.name ?? null,
        billingCycleSnapshot: plan?.billingFrequency ?? null,
        quantity,
        unitPrice: String(round2(unitPrice)),
        discount: '0.00',
        taxRate: String(round2(taxPercentage)),
        taxAmount: String(taxAmount),
        lineTotal: String(lineTotal),
      });
    }

    const calculatedTotal = round2(calculatedSubtotal + calculatedTaxTotal);

    const [createdQuotation] = await tx
      .insert(quotations)
      .values({
        quotationNumber,
        customerId: customer.id,
        requestedBy: userId,
        status: 'PENDING',
        subtotal: String(calculatedSubtotal),
        discountAmount: '0.00',
        taxAmount: String(calculatedTaxTotal),
        totalAmount: String(calculatedTotal),
        currency: 'INR',
        customerNotes: data.customerNotes?.trim() || null,
        paymentTerms: null,
      })
      .returning();

    const insertedItems = [];
    for (const item of preparedItems) {
      const [insertedItem] = await tx
        .insert(quotationItems)
        .values({
          ...item,
          quotationId: createdQuotation.id,
        })
        .returning();
      insertedItems.push(insertedItem);
    }

    await tx.insert(quotationActivityLogs).values({
      quotationId: createdQuotation.id,
      performedBy: userId,
      action: 'REQUESTED',
      description: `Quotation requested with ${insertedItems.length} item(s)`,
    });

    return {
      ...createdQuotation,
      items: insertedItems,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        companyName: customer.companyName,
      },
    };
  });
}

/**
 * Gets all quotations submitted by the logged-in customer
 */
export async function getMyQuotations(userId) {
  const customer = await getOrCreateCustomerForUser(userId);

  const list = await db
    .select({
      id: quotations.id,
      quotationNumber: quotations.quotationNumber,
      status: quotations.status,
      subtotal: quotations.subtotal,
      discountAmount: quotations.discountAmount,
      taxAmount: quotations.taxAmount,
      totalAmount: quotations.totalAmount,
      currency: quotations.currency,
      customerNotes: quotations.customerNotes,
      adminNotes: quotations.adminNotes,
      rejectionReason: quotations.rejectionReason,
      paymentTerms: quotations.paymentTerms,
      validUntil: quotations.validUntil,
      pdfPath: quotations.pdfPath,
      createdAt: quotations.createdAt,
      updatedAt: quotations.updatedAt,
      itemCount: sql`count(${quotationItems.id})::int`,
    })
    .from(quotations)
    .leftJoin(quotationItems, eq(quotationItems.quotationId, quotations.id))
    .where(eq(quotations.customerId, customer.id))
    .groupBy(quotations.id)
    .orderBy(desc(quotations.createdAt));

  return list;
}

/**
 * Gets single quotation for customer with ownership check
 */
export async function getQuotationForCustomer(quotationId, userId) {
  const customer = await getOrCreateCustomerForUser(userId);

  const [quotation] = await db
    .select()
    .from(quotations)
    .where(eq(quotations.id, quotationId))
    .limit(1);

  if (!quotation) {
    throw notFound('Quotation not found');
  }

  if (quotation.customerId !== customer.id) {
    throw forbidden('You do not have permission to view this quotation');
  }

  const items = await db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, quotation.id))
    .orderBy(quotationItems.id);

  const messages = await db
    .select({
      id: quotationMessages.id,
      message: quotationMessages.message,
      createdAt: quotationMessages.createdAt,
      sender: {
        id: users.id,
        name: users.name,
        role: users.role,
      },
    })
    .from(quotationMessages)
    .leftJoin(users, eq(users.id, quotationMessages.senderId))
    .where(eq(quotationMessages.quotationId, quotation.id))
    .orderBy(quotationMessages.createdAt);

  const activityLogs = await db
    .select({
      id: quotationActivityLogs.id,
      action: quotationActivityLogs.action,
      description: quotationActivityLogs.description,
      createdAt: quotationActivityLogs.createdAt,
      performer: {
        id: users.id,
        name: users.name,
        role: users.role,
      },
    })
    .from(quotationActivityLogs)
    .leftJoin(users, eq(users.id, quotationActivityLogs.performedBy))
    .where(eq(quotationActivityLogs.quotationId, quotation.id))
    .orderBy(desc(quotationActivityLogs.createdAt));

  return {
    ...quotation,
    customer,
    items,
    messages,
    activityLogs,
  };
}

/**
 * Adds a message to quotation communication thread
 */
export async function addMessage(quotationId, userId, messageText) {
  const [quotation] = await db
    .select()
    .from(quotations)
    .where(eq(quotations.id, quotationId))
    .limit(1);

  if (!quotation) {
    throw notFound('Quotation not found');
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw notFound('User not found');
  }

  const isCustomerRole = user.role === 'CUSTOMER';
  if (isCustomerRole) {
    const customer = await getOrCreateCustomerForUser(userId);
    if (quotation.customerId !== customer.id) {
      throw forbidden('You do not have permission to send messages on this quotation');
    }
  }

  return await db.transaction(async (tx) => {
    const [newMessage] = await tx
      .insert(quotationMessages)
      .values({
        quotationId: quotation.id,
        senderId: userId,
        message: messageText.trim(),
      })
      .returning();

    const action = isCustomerRole ? 'CUSTOMER_REPLY' : 'UPDATED';
    const description = isCustomerRole
      ? `Customer replied: "${messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText}"`
      : `Staff/Admin replied: "${messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText}"`;

    await tx.insert(quotationActivityLogs).values({
      quotationId: quotation.id,
      performedBy: userId,
      action,
      description,
    });

    return {
      ...newMessage,
      sender: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };
  });
}

/**
 * Gets path to the quotation PDF file
 */
export async function getQuotationPdfPath(quotationId, userId, isAdmin = false) {
  const [quotation] = await db
    .select()
    .from(quotations)
    .where(eq(quotations.id, quotationId))
    .limit(1);

  if (!quotation) {
    throw notFound('Quotation not found');
  }

  if (!isAdmin) {
    const customer = await getOrCreateCustomerForUser(userId);
    if (quotation.customerId !== customer.id) {
      throw forbidden('Access denied');
    }
  }

  if (quotation.status !== 'ACCEPTED') {
    throw badRequest('PDF is only available for accepted quotations');
  }

  if (quotation.pdfPath && fs.existsSync(quotation.pdfPath)) {
    return quotation.pdfPath;
  }

  // Regenerate PDF if accepted but missing
  const items = await db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, quotation.id))
    .orderBy(quotationItems.id);

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, quotation.customerId))
    .limit(1);

  const generatedPath = await generateQuotationPDF(quotation, items, customer || {});

  await db
    .update(quotations)
    .set({ pdfPath: generatedPath })
    .where(eq(quotations.id, quotation.id));

  return generatedPath;
}

// ─────────────────────────────────────────────────────────────
// ADMIN FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Gets all quotations with customer information, filtering, and pagination
 */
export async function getAllQuotations(filters = {}) {
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (filters.status) {
    conditions.push(eq(quotations.status, filters.status));
  }

  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(quotations.quotationNumber, term),
        ilike(customers.name, term),
        ilike(customers.email, term),
        ilike(customers.companyName, term)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql`count(distinct ${quotations.id})::int` })
    .from(quotations)
    .leftJoin(customers, eq(customers.id, quotations.customerId))
    .where(whereClause);

  const total = countResult?.count ?? 0;

  const data = await db
    .select({
      id: quotations.id,
      quotationNumber: quotations.quotationNumber,
      status: quotations.status,
      subtotal: quotations.subtotal,
      discountAmount: quotations.discountAmount,
      taxAmount: quotations.taxAmount,
      totalAmount: quotations.totalAmount,
      currency: quotations.currency,
      customerNotes: quotations.customerNotes,
      adminNotes: quotations.adminNotes,
      rejectionReason: quotations.rejectionReason,
      paymentTerms: quotations.paymentTerms,
      validUntil: quotations.validUntil,
      pdfPath: quotations.pdfPath,
      createdAt: quotations.createdAt,
      updatedAt: quotations.updatedAt,
      customer: {
        id: customers.id,
        name: customers.name,
        email: customers.email,
        companyName: customers.companyName,
        phone: customers.phone,
      },
      itemCount: sql`count(${quotationItems.id})::int`,
    })
    .from(quotations)
    .leftJoin(customers, eq(customers.id, quotations.customerId))
    .leftJoin(quotationItems, eq(quotationItems.quotationId, quotations.id))
    .where(whereClause)
    .groupBy(quotations.id, customers.id)
    .orderBy(desc(quotations.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Gets full quotation details for admin view
 */
export async function getQuotationForAdmin(quotationId) {
  const [quotation] = await db
    .select()
    .from(quotations)
    .where(eq(quotations.id, quotationId))
    .limit(1);

  if (!quotation) {
    throw notFound('Quotation not found');
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, quotation.customerId))
    .limit(1);

  const [requestedByUser] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, quotation.requestedBy))
    .limit(1);

  let processedByUser = null;
  if (quotation.processedBy) {
    const [pUser] = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, quotation.processedBy))
      .limit(1);
    processedByUser = pUser || null;
  }

  const items = await db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, quotation.id))
    .orderBy(quotationItems.id);

  const messages = await db
    .select({
      id: quotationMessages.id,
      message: quotationMessages.message,
      createdAt: quotationMessages.createdAt,
      sender: {
        id: users.id,
        name: users.name,
        role: users.role,
      },
    })
    .from(quotationMessages)
    .leftJoin(users, eq(users.id, quotationMessages.senderId))
    .where(eq(quotationMessages.quotationId, quotation.id))
    .orderBy(quotationMessages.createdAt);

  const activityLogs = await db
    .select({
      id: quotationActivityLogs.id,
      action: quotationActivityLogs.action,
      description: quotationActivityLogs.description,
      createdAt: quotationActivityLogs.createdAt,
      performer: {
        id: users.id,
        name: users.name,
        role: users.role,
      },
    })
    .from(quotationActivityLogs)
    .leftJoin(users, eq(users.id, quotationActivityLogs.performedBy))
    .where(eq(quotationActivityLogs.quotationId, quotation.id))
    .orderBy(desc(quotationActivityLogs.createdAt));

  return {
    ...quotation,
    customer,
    requestedByUser,
    processedByUser,
    items,
    messages,
    activityLogs,
  };
}

/**
 * Accepts a quotation, optionally updates item pricing/discounts/taxes, calculates totals,
 * generates the official PDF, and logs the activity.
 */
export async function acceptQuotation(quotationId, adminUserId, data = {}) {
  const [existing] = await db
    .select()
    .from(quotations)
    .where(eq(quotations.id, quotationId))
    .limit(1);

  if (!existing) {
    throw notFound('Quotation not found');
  }

  if (existing.status === 'ACCEPTED') {
    throw badRequest('Quotation has already been accepted');
  }

  if (existing.status === 'REJECTED') {
    throw badRequest('Cannot accept a quotation that was already rejected');
  }

  return await db.transaction(async (tx) => {
    // 1. If item pricing adjustments are supplied, update items
    const currentItems = await tx
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, existing.id))
      .orderBy(quotationItems.id);

    if (data.items && Array.isArray(data.items)) {
      for (const updateItem of data.items) {
        // match by id or productId
        const matched = currentItems.find(
          (ci) => (updateItem.id && ci.id === updateItem.id) || (updateItem.productId && ci.productId === updateItem.productId)
        );

        if (matched) {
          const unitPrice = Number(updateItem.unitPrice ?? matched.unitPrice);
          const discount = Number(updateItem.discount ?? matched.discount);
          const taxRate = Number(updateItem.taxRate ?? matched.taxRate);

          const baseAfterDiscount = Math.max(0, round2(matched.quantity * unitPrice - discount));
          const taxAmount = round2((baseAfterDiscount * taxRate) / 100);
          const lineTotal = round2(baseAfterDiscount + taxAmount);

          await tx
            .update(quotationItems)
            .set({
              unitPrice: String(round2(unitPrice)),
              discount: String(round2(discount)),
              taxRate: String(round2(taxRate)),
              taxAmount: String(taxAmount),
              lineTotal: String(lineTotal),
            })
            .where(eq(quotationItems.id, matched.id));
        }
      }
    }

    // 2. Fetch fresh items to calculate final financial figures
    const finalItems = await tx
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, existing.id))
      .orderBy(quotationItems.id);

    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalGrand = 0;

    for (const item of finalItems) {
      const q = item.quantity;
      const up = Number(item.unitPrice);
      const disc = Number(item.discount);
      const tax = Number(item.taxAmount);
      const lt = Number(item.lineTotal);

      totalSubtotal = round2(totalSubtotal + q * up);
      totalDiscount = round2(totalDiscount + disc);
      totalTax = round2(totalTax + tax);
      totalGrand = round2(totalGrand + lt);
    }

    const now = new Date();
    const updateValues = {
      status: 'ACCEPTED',
      subtotal: String(totalSubtotal),
      discountAmount: String(totalDiscount),
      taxAmount: String(totalTax),
      totalAmount: String(totalGrand),
      processedBy: adminUserId,
      processedAt: now,
      updatedAt: now,
    };

    if (data.adminNotes !== undefined) updateValues.adminNotes = data.adminNotes?.trim() || null;
    if (data.paymentTerms !== undefined) updateValues.paymentTerms = data.paymentTerms?.trim() || null;
    if (data.validUntil) updateValues.validUntil = data.validUntil;

    const [updatedQuotation] = await tx
      .update(quotations)
      .set(updateValues)
      .where(eq(quotations.id, existing.id))
      .returning();

    // 3. Log acceptance activity
    await tx.insert(quotationActivityLogs).values({
      quotationId: existing.id,
      performedBy: adminUserId,
      action: 'ACCEPTED',
      description: `Quotation accepted. Total amount: INR ${updatedQuotation.totalAmount}`,
    });

    // 4. Fetch customer details for PDF generation
    const [customer] = await tx
      .select()
      .from(customers)
      .where(eq(customers.id, updatedQuotation.customerId))
      .limit(1);

    // 5. Generate PDF
    const pdfPath = await generateQuotationPDF(updatedQuotation, finalItems, customer || {});

    // Save PDF path to quotation
    const [finalQuotation] = await tx
      .update(quotations)
      .set({ pdfPath })
      .where(eq(quotations.id, existing.id))
      .returning();

    // Log PDF activity
    await tx.insert(quotationActivityLogs).values({
      quotationId: existing.id,
      performedBy: adminUserId,
      action: 'PDF_GENERATED',
      description: `Official quotation PDF created (${existing.quotationNumber})`,
    });

    return {
      ...finalQuotation,
      items: finalItems,
      customer,
    };
  });
}

/**
 * Rejects a quotation with a mandatory reason
 */
export async function rejectQuotation(quotationId, adminUserId, reason) {
  const [existing] = await db
    .select()
    .from(quotations)
    .where(eq(quotations.id, quotationId))
    .limit(1);

  if (!existing) {
    throw notFound('Quotation not found');
  }

  if (existing.status === 'ACCEPTED') {
    throw badRequest('Cannot reject a quotation that has already been accepted');
  }

  if (existing.status === 'REJECTED') {
    throw badRequest('Quotation is already rejected');
  }

  return await db.transaction(async (tx) => {
    const now = new Date();
    const [updated] = await tx
      .update(quotations)
      .set({
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        processedBy: adminUserId,
        processedAt: now,
        updatedAt: now,
      })
      .where(eq(quotations.id, existing.id))
      .returning();

    await tx.insert(quotationActivityLogs).values({
      quotationId: existing.id,
      performedBy: adminUserId,
      action: 'REJECTED',
      description: `Quotation rejected. Reason: ${reason.trim()}`,
    });

    return updated;
  });
}

/**
 * Marks quotation as NEEDS_INFORMATION, posts a message, and logs activity
 */
export async function requestInformation(quotationId, adminUserId, messageText) {
  const [existing] = await db
    .select()
    .from(quotations)
    .where(eq(quotations.id, quotationId))
    .limit(1);

  if (!existing) {
    throw notFound('Quotation not found');
  }

  if (existing.status === 'ACCEPTED' || existing.status === 'REJECTED') {
    throw badRequest(`Cannot request information on a ${existing.status.toLowerCase()} quotation`);
  }

  return await db.transaction(async (tx) => {
    const now = new Date();
    const [updated] = await tx
      .update(quotations)
      .set({
        status: 'NEEDS_INFORMATION',
        updatedAt: now,
      })
      .where(eq(quotations.id, existing.id))
      .returning();

    const [newMessage] = await tx
      .insert(quotationMessages)
      .values({
        quotationId: existing.id,
        senderId: adminUserId,
        message: messageText.trim(),
      })
      .returning();

    await tx.insert(quotationActivityLogs).values({
      quotationId: existing.id,
      performedBy: adminUserId,
      action: 'NEEDS_INFORMATION',
      description: `Information requested: "${messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText}"`,
    });

    return {
      ...updated,
      message: newMessage,
    };
  });
}
