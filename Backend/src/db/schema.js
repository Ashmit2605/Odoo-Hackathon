// Backend/src/db/schema.js
import {
  pgTable, pgEnum, serial, varchar, text, timestamp, date,
  integer, numeric, boolean, primaryKey, unique, index, check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─────────────────────────── ENUMS ───────────────────────────
export const userRole           = pgEnum('user_role', ['ADMIN', 'STAFF', 'CUSTOMER']);
export const billingFrequency   = pgEnum('billing_frequency', ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']);
<<<<<<< HEAD
export const subscriptionStatus = pgEnum('subscription_status', [
  'DRAFT',
  'QUOTATION',
  'CONFIRMED',
  'ACTIVE',
  'PAUSED',
  'CLOSED',
  'PENDING_PAYMENT',
  'PAST_DUE',
  'CANCEL_SCHEDULED',
  'CANCELED',
  'EXPIRED',
]);
export const invoiceStatus      = pgEnum('invoice_status', ['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED']);
=======
export const subscriptionStatus = pgEnum('subscription_status', ['DRAFT', 'QUOTATION', 'CONFIRMED', 'PENDING_PAYMENT', 'ACTIVE', 'PAST_DUE', 'CANCEL_SCHEDULED', 'EXPIRED', 'CANCELED', 'PAUSED', 'CLOSED']);
export const subscriptionSource = pgEnum('subscription_source', ['SELF_SERVICE', 'ADMIN']);
export const invoiceStatus      = pgEnum('invoice_status', ['DRAFT', 'CONFIRMED', 'PARTIALLY_PAID', 'OVERDUE', 'PAID', 'CANCELLED']);
>>>>>>> 315d366 (done)
export const discountType       = pgEnum('discount_type', ['FIXED', 'PERCENTAGE']);
export const discountScope      = pgEnum('discount_scope', ['PRODUCT', 'SUBSCRIPTION']);
export const paymentMethod      = pgEnum('payment_method', ['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'OTHER']);
export const paymentStatus      = pgEnum('payment_status', ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED']);

// ─────────────────────────── USERS ───────────────────────────
export const users = pgTable('users', {
  id:           serial('id').primaryKey(),
  name:         varchar('name', { length: 150 }).notNull(),
  email:        varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role:         userRole('role').notNull().default('CUSTOMER'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used:      boolean('used').notNull().default(false),
});

export const customers = pgTable('customers', {
  id:          serial('id').primaryKey(),
  userId:      integer('user_id').unique().references(() => users.id, { onDelete: 'set null' }),
  name:        varchar('name', { length: 150 }).notNull(),
  email:       varchar('email', { length: 255 }),
  companyName: varchar('company_name', { length: 200 }),
  phone:       varchar('phone', { length: 30 }),
  address:     text('address'),
});

// ────────────────────── TAX / PRODUCTS ──────────────────────
export const taxRates = pgTable('tax_rates', {
  id:         serial('id').primaryKey(),
  name:       varchar('name', { length: 100 }).notNull(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }).notNull(),
}, (t) => [
  check('tax_rates_percentage_check', sql`${t.percentage} BETWEEN 0 AND 100`),
]);

export const products = pgTable('products', {
  id:          serial('id').primaryKey(),
  name:        varchar('name', { length: 200 }).notNull(),
  productType: varchar('product_type', { length: 100 }),
  salesPrice:  numeric('sales_price', { precision: 12, scale: 2 }).notNull(),
  costPrice:   numeric('cost_price', { precision: 12, scale: 2 }).notNull().default('0'),
  taxRateId:   integer('tax_rate_id').references(() => taxRates.id, { onDelete: 'set null' }),
  notes:       text('notes'),
}, (t) => [
  check('products_sales_price_check', sql`${t.salesPrice} >= 0`),
]);

export const productVariants = pgTable('product_variants', {
  id:          serial('id').primaryKey(),
  productId:   integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantName: varchar('variant_name', { length: 150 }).notNull(),
  extraPrice:  numeric('extra_price', { precision: 12, scale: 2 }).notNull().default('0'),
});

// ─────────────────────────── PLANS ───────────────────────────
export const plans = pgTable('plans', {
  id:              serial('id').primaryKey(),
  name:            varchar('name', { length: 200 }).notNull(),
  description:     text('description'),
  price:           numeric('price', { precision: 12, scale: 2 }).notNull(),
  currency:        varchar('currency', { length: 3 }).notNull().default('INR'),
  billingFrequency: billingFrequency('billing_frequency').notNull(),
  isActive:        boolean('is_active').notNull().default(true),
  minQuantity:     integer('min_quantity').notNull().default(1),
  availableFrom:   date('available_from'),
  availableUntil:  date('available_until'),
  autoClose:       boolean('auto_close').notNull().default(false),
  allowEarlyClose: boolean('allow_early_close').notNull().default(false),
  allowPause:      boolean('allow_pause').notNull().default(false),
  allowRenew:      boolean('allow_renew').notNull().default(true),
}, (t) => [
  check('plans_price_check', sql`${t.price} >= 0`),
]);

// ─────────────────── QUOTATION TEMPLATES ────────────────────
export const quotationTemplates = pgTable('quotation_templates', {
  id:           serial('id').primaryKey(),
  name:         varchar('name', { length: 150 }).notNull(),
  planId:       integer('plan_id').references(() => plans.id, { onDelete: 'set null' }),
  validityDays: integer('validity_days').notNull(),
}, (t) => [
  check('quotation_templates_validity_days_check', sql`${t.validityDays} > 0`),
]);

export const quotationTemplateItems = pgTable('quotation_template_items', {
  id:         serial('id').primaryKey(),
  templateId: integer('template_id').notNull().references(() => quotationTemplates.id, { onDelete: 'cascade' }),
  productId:  integer('product_id').notNull().references(() => products.id),
  variantId:  integer('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  quantity:   integer('quantity').notNull().default(1),
}, (t) => [
  check('quotation_template_items_quantity_check', sql`${t.quantity} > 0`),
]);

// ─────────────────────── SUBSCRIPTIONS ───────────────────────
export const subscriptions = pgTable('subscriptions', {
  id:                  serial('id').primaryKey(),
  subscriptionNumber:  varchar('subscription_number', { length: 50 }).notNull().unique(),
  customerId:          integer('customer_id').notNull().references(() => customers.id),
  planId:              integer('plan_id').notNull().references(() => plans.id),
  source:              subscriptionSource('source').notNull().default('ADMIN'),
  agreedPrice:         numeric('agreed_price', { precision: 12, scale: 2 }).notNull().default('0'),
  currency:            varchar('currency', { length: 3 }).notNull().default('INR'),
  billingFrequency:    billingFrequency('billing_frequency').notNull().default('MONTHLY'),
  templateId:          integer('template_id').references(() => quotationTemplates.id, { onDelete: 'set null' }),
<<<<<<< HEAD
   source:              varchar('source', { length: 20 }).notNull().default('SELF_SERVICE'), 
  startDate:           date('start_date').notNull(),
=======
  startDate:           date('start_date').notNull().default(sql`CURRENT_DATE`),
  currentPeriodEnd:    date('current_period_end'),
>>>>>>> 315d366 (done)
  expiryDate:          date('expiry_date'),
  nextBillingDate:     date('next_billing_date'),
  paymentTerms:        varchar('payment_terms', { length: 100 }),
  quotationValidUntil: date('quotation_valid_until'),
  status:              subscriptionStatus('status').notNull().default('DRAFT'),
  createdBy:           integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check('subscriptions_expiry_check', sql`${t.expiryDate} IS NULL OR ${t.expiryDate} >= ${t.startDate}`),
  index('idx_subs_customer').on(t.customerId),
  index('idx_subs_status').on(t.status),
  index('idx_subs_next_billing').on(t.nextBillingDate),
]);

export const subscriptionItems = pgTable('subscription_items', {
  id:             serial('id').primaryKey(),
  subscriptionId: integer('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  productId:      integer('product_id').notNull().references(() => products.id),
  variantId:      integer('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  productName:    varchar('product_name', { length: 200 }).notNull(),
  quantity:       integer('quantity').notNull(),
  unitPrice:      numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  taxPercentage:  numeric('tax_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
  amount:         numeric('amount', { precision: 12, scale: 2 }).notNull(),
}, (t) => [
  check('subscription_items_quantity_check', sql`${t.quantity} > 0`),
]);

// ─────────────────────────── DISCOUNTS ───────────────────────
export const discounts = pgTable('discounts', {
  id:          serial('id').primaryKey(),
  name:        varchar('name', { length: 150 }).notNull(),
  type:        discountType('type').notNull(),
  value:       numeric('value', { precision: 12, scale: 2 }).notNull(),
  appliesTo:   discountScope('applies_to').notNull().default('PRODUCT'),
  minPurchase: numeric('min_purchase', { precision: 12, scale: 2 }).notNull().default('0'),
  minQuantity: integer('min_quantity').notNull().default(1),
  validFrom:   date('valid_from'),
  validUntil:  date('valid_until'),
  usageLimit:  integer('usage_limit'),
  usageCount:  integer('usage_count').notNull().default(0),
  isActive:    boolean('is_active').notNull().default(true),
}, (t) => [
  check('discounts_value_check',      sql`${t.value} >= 0`),
  check('discounts_percentage_check', sql`${t.type} <> 'PERCENTAGE' OR ${t.value} <= 100`),
]);

export const discountProducts = pgTable('discount_products', {
  discountId: integer('discount_id').notNull().references(() => discounts.id, { onDelete: 'cascade' }),
  productId:  integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.discountId, t.productId] }),
]);

export const discountSubscriptions = pgTable('discount_subscriptions', {
  discountId:     integer('discount_id').notNull().references(() => discounts.id, { onDelete: 'cascade' }),
  subscriptionId: integer('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.discountId, t.subscriptionId] }),
]);

// ─────────────────────────── INVOICES ────────────────────────
export const invoices = pgTable('invoices', {
  id:             serial('id').primaryKey(),
  invoiceNumber:  varchar('invoice_number', { length: 50 }).notNull().unique(),
  customerId:     integer('customer_id').notNull().references(() => customers.id),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id),
  currency:       varchar('currency', { length: 3 }).notNull().default('INR'),
  periodStart:    date('period_start'),
  invoiceDate:    date('invoice_date').notNull().default(sql`CURRENT_DATE`),
  dueDate:        date('due_date'),
  subtotal:       numeric('subtotal',        { precision: 12, scale: 2 }).notNull().default('0'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  taxAmount:      numeric('tax_amount',      { precision: 12, scale: 2 }).notNull().default('0'),
  totalAmount:    numeric('total_amount',    { precision: 12, scale: 2 }).notNull().default('0'),
  amountPaid:     numeric('amount_paid',     { precision: 12, scale: 2 }).notNull().default('0'),
  status:         invoiceStatus('status').notNull().default('DRAFT'),
}, (t) => [
  unique('invoices_sub_period_unique').on(t.subscriptionId, t.periodStart),
  index('idx_invoices_customer').on(t.customerId),
  index('idx_invoices_status_due').on(t.status, t.dueDate),
]);

export const invoiceItems = pgTable('invoice_items', {
  id:             serial('id').primaryKey(),
  invoiceId:      integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productName:    varchar('product_name', { length: 200 }).notNull(),
  quantity:       integer('quantity').notNull(),
  unitPrice:      numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  taxPercentage:  numeric('tax_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  amount:         numeric('amount', { precision: 12, scale: 2 }).notNull(),
}, (t) => [
  check('invoice_items_quantity_check', sql`${t.quantity} > 0`),
]);

// ─────────────────────────── PAYMENTS ────────────────────────
export const payments = pgTable('payments', {
  id:          serial('id').primaryKey(),
  invoiceId:   integer('invoice_id').notNull().references(() => invoices.id),
  method:      paymentMethod('method').notNull(),
  status:      paymentStatus('status').notNull().default('PENDING'),
  providerReference: varchar('provider_reference', { length: 200 }).unique(),
  amount:      numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentDate: date('payment_date').notNull().default(sql`CURRENT_DATE`),
  paidAt:      timestamp('paid_at', { withTimezone: true }),
  note:        text('note'),
}, (t) => [
  check('payments_amount_check', sql`${t.amount} > 0`),
  index('idx_payments_invoice').on(t.invoiceId),
]);

<<<<<<< HEAD
// ─────────────────────────── QUOTATIONS ─────────────────────────
export const quotationStatus = pgEnum('quotation_status', ['PENDING', 'NEEDS_INFORMATION', 'ACCEPTED', 'REJECTED', 'EXPIRED']);
export const quotationAction = pgEnum('quotation_action', ['REQUESTED', 'ACCEPTED', 'REJECTED', 'NEEDS_INFORMATION', 'UPDATED', 'PDF_GENERATED', 'CUSTOMER_REPLY']);

export const quotations = pgTable('quotations', {
  id:              serial('id').primaryKey(),
  quotationNumber: varchar('quotation_number', { length: 50 }).notNull().unique(),
  customerId:      integer('customer_id').notNull().references(() => customers.id),
  requestedBy:     integer('requested_by').notNull().references(() => users.id),
  status:          quotationStatus('status').notNull().default('PENDING'),
  subtotal:        numeric('subtotal',        { precision: 12, scale: 2 }).notNull().default('0'),
  discountAmount:  numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  taxAmount:       numeric('tax_amount',      { precision: 12, scale: 2 }).notNull().default('0'),
  totalAmount:     numeric('total_amount',    { precision: 12, scale: 2 }).notNull().default('0'),
  currency:        varchar('currency', { length: 10 }).notNull().default('INR'),
  customerNotes:   text('customer_notes'),
  adminNotes:      text('admin_notes'),
  rejectionReason: text('rejection_reason'),
  paymentTerms:    text('payment_terms'),
  validUntil:      date('valid_until'),
  pdfPath:         text('pdf_path'),
  processedBy:     integer('processed_by').references(() => users.id, { onDelete: 'set null' }),
  processedAt:     timestamp('processed_at', { withTimezone: true }),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_quotations_customer').on(t.customerId),
  index('idx_quotations_status').on(t.status),
]);

export const quotationItems = pgTable('quotation_items', {
  id:                   serial('id').primaryKey(),
  quotationId:          integer('quotation_id').notNull().references(() => quotations.id, { onDelete: 'cascade' }),
  productId:            integer('product_id').references(() => products.id),
  variantId:            integer('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  planId:               integer('plan_id').references(() => plans.id, { onDelete: 'set null' }),
  productNameSnapshot:  varchar('product_name_snapshot', { length: 200 }),
  planNameSnapshot:     varchar('plan_name_snapshot', { length: 200 }),
  billingCycleSnapshot: varchar('billing_cycle_snapshot', { length: 50 }),
  quantity:             integer('quantity').notNull(),
  unitPrice:            numeric('unit_price', { precision: 12, scale: 2 }).notNull().default('0'),
  discount:             numeric('discount',   { precision: 12, scale: 2 }).notNull().default('0'),
  taxRate:              numeric('tax_rate',   { precision: 5, scale: 2 }).notNull().default('0'),
  taxAmount:            numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  lineTotal:            numeric('line_total', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check('quotation_items_quantity_check', sql`${t.quantity} > 0`),
]);

export const quotationActivityLogs = pgTable('quotation_activity_logs', {
  id:          serial('id').primaryKey(),
  quotationId: integer('quotation_id').notNull().references(() => quotations.id, { onDelete: 'cascade' }),
  performedBy: integer('performed_by').references(() => users.id),
  action:      quotationAction('action').notNull(),
  description: text('description'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_quotation_activity_logs_quotation').on(t.quotationId),
]);

export const quotationMessages = pgTable('quotation_messages', {
  id:          serial('id').primaryKey(),
  quotationId: integer('quotation_id').notNull().references(() => quotations.id, { onDelete: 'cascade' }),
  senderId:    integer('sender_id').references(() => users.id),
  message:     text('message').notNull(),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_quotation_messages_quotation').on(t.quotationId),
=======
export const staffAssignments = pgTable('staff_assignments', {
  staffId: integer('staff_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  assignedBy: integer('assigned_by').references(() => users.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.staffId, t.customerId] }),
  index('idx_staff_assignments_customer').on(t.customerId),
]);

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: integer('entity_id'),
  details: text('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_audit_logs_entity').on(t.entityType, t.entityId),
  index('idx_audit_logs_actor').on(t.actorId),
>>>>>>> 315d366 (done)
]);