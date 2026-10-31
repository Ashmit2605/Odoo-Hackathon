import { z } from 'zod';

export const quotationItemCreateSchema = z.object({
  productId: z.coerce.number().int().positive('Product ID must be a positive integer'),
  variantId: z.coerce.number().int().positive().nullish(),
  planId: z.coerce.number().int().positive().nullish(),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

export const createQuotationSchema = z.object({
  items: z.array(quotationItemCreateSchema).min(1, 'Quotation must have at least one item'),
  customerNotes: z.string().trim().max(2000).optional(),
  expectedStartDate: z.string().trim().optional(),
});

export const quotationItemAcceptSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  productId: z.coerce.number().int().positive().optional(),
  unitPrice: z.coerce.number().min(0, 'Unit price must be non-negative'),
  discount: z.coerce.number().min(0, 'Discount must be non-negative').default(0),
  taxRate: z.coerce.number().min(0, 'Tax rate must be non-negative').default(0),
});

export const acceptQuotationSchema = z.object({
  items: z.array(quotationItemAcceptSchema).optional(),
  adminNotes: z.string().trim().max(2000).optional(),
  paymentTerms: z.string().trim().max(1000).optional(),
  validUntil: z.string().trim().optional(),
});

export const rejectQuotationSchema = z.object({
  rejectionReason: z.string().trim().min(1, 'Rejection reason is required').max(1000),
});

export const requestInfoSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

export const addMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(2000),
});
