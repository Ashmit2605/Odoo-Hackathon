import { z } from 'zod';

const numericAmount = z
  .union([z.string().trim().min(1), z.number()])
  .transform(Number)
  .pipe(z.number().finite().min(0));

const optionalAmount = z.preprocess(
  (value) => value === '' || value === null || value === undefined ? 0 : value,
  numericAmount
);

const percentageAmount = numericAmount.pipe(
  z.number().max(100, 'Percentage cannot exceed 100')
);

const optionalNonNegativeInteger = z.preprocess(
  (value) => value === '' || value === null || value === undefined ? null : Number(value),
  z.number().int().nonnegative().nullable()
);

const optionalPositiveId = z.preprocess(
  (value) => value === '' || value === null || value === undefined ? null : Number(value),
  z.number().int().positive().nullable()
);

const optionalDate = z.preprocess(
  (value) => value === '' || value === undefined ? null : value,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, 'Enter a valid date').nullable()
);

const taxRateFields = {
  name: z.string().trim().min(1, 'Tax rate name is required').max(100),
  percentage: percentageAmount,
};

const taxRateSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  ...taxRateFields,
});

const discountRuleFields = {
  name: z.string().trim().min(1, 'Discount name is required').max(150),
  type: z.enum(['FIXED', 'PERCENTAGE']),
  value: numericAmount,
  appliesTo: z.literal('PRODUCT').default('PRODUCT'),
  minPurchase: optionalAmount.default(0),
  minQuantity: z.coerce.number().int().positive().default(1),
  validFrom: optionalDate,
  validUntil: optionalDate,
  usageLimit: optionalNonNegativeInteger,
  usageCount: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
};

const validateDiscountRule = (discount, context) => {
  if (discount.type === 'PERCENTAGE' && discount.value > 100) {
    context.addIssue({
      code: 'custom',
      path: ['value'],
      message: 'Percentage discount cannot exceed 100',
    });
  }
  if (
    discount.validFrom &&
    discount.validUntil &&
    discount.validUntil < discount.validFrom
  ) {
    context.addIssue({
      code: 'custom',
      path: ['validUntil'],
      message: 'End date must be on or after start date',
    });
  }
  if (discount.usageLimit !== null && discount.usageLimit < discount.usageCount) {
    context.addIssue({
      code: 'custom',
      path: ['usageLimit'],
      message: 'Usage limit cannot be less than usage count',
    });
  }
};

const createDiscountRuleSchema = z
  .object(discountRuleFields)
  .superRefine(validateDiscountRule);

const updateDiscountRuleSchema = z
  .object({
    id: z.coerce.number().int().positive().optional(),
    ...discountRuleFields,
  })
  .superRefine(validateDiscountRule);

const variantSchema = z.object({
  variantName: z.string().trim().min(1).max(150),
  extraPrice: optionalAmount.default(0),
});

const productFields = {
  name: z.string().trim().min(1, 'Product name is required').max(200),
  productType: z.string().trim().max(100).nullable().optional(),
  salesPrice: numericAmount,
  costPrice: numericAmount.default(0),
  taxRateId: optionalPositiveId.optional(),
  taxRate: taxRateSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  variants: z.array(variantSchema).optional().default([]),
  discountIds: z.array(z.coerce.number().int().positive()).optional().default([]),
};

export const createProductSchema = z.object({
  ...productFields,
  taxRate: z.object(taxRateFields).nullable().optional(),
  discounts: z.array(createDiscountRuleSchema).optional().default([]),
});

export const updateProductSchema = z.object({
  ...productFields,
  discounts: z.array(updateDiscountRuleSchema).optional(),
}).partial();
