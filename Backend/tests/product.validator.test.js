import { describe, expect, it } from 'vitest';
import { createProductSchema, updateProductSchema } from '../src/validators/product.validator.js';

const validProduct = {
  name: 'Premium Widget',
  salesPrice: '49.99',
  costPrice: '20.00',
  taxRate: { name: 'Standard VAT', percentage: '20' },
  discounts: [{
    name: 'Launch offer',
    type: 'PERCENTAGE',
    value: '10',
    minPurchase: '25',
    minQuantity: '2',
    validFrom: '2026-10-01',
    validUntil: '2026-12-31',
    usageLimit: '50',
    usageCount: '3',
    isActive: true,
  }],
};

describe('product request schemas', () => {
  it('accepts and normalizes tax and product discount fields', () => {
    const result = createProductSchema.parse(validProduct);

    expect(result.taxRate.percentage).toBe(20);
    expect(result.discounts[0]).toMatchObject({
      appliesTo: 'PRODUCT',
      value: 10,
      minPurchase: 25,
      minQuantity: 2,
      usageLimit: 50,
      usageCount: 3,
      isActive: true,
    });
  });

  it('rejects tax rates above 100 percent', () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      taxRate: { name: 'Invalid VAT', percentage: '100.01' },
    });

    expect(result.success).toBe(false);
  });

  it('rejects percentage discounts above 100 percent', () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      discounts: [{ ...validProduct.discounts[0], value: '100.01' }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid discount dates and usage limits', () => {
    const invalidDates = createProductSchema.safeParse({
      ...validProduct,
      discounts: [{
        ...validProduct.discounts[0],
        validFrom: '2026-02-31',
      }],
    });
    const invalidLimit = createProductSchema.safeParse({
      ...validProduct,
      discounts: [{
        ...validProduct.discounts[0],
        usageLimit: '2',
        usageCount: '3',
      }],
    });

    expect(invalidDates.success).toBe(false);
    expect(invalidLimit.success).toBe(false);
  });

  it('allows clearing a product tax rate and its discount links', () => {
    const result = updateProductSchema.parse({
      taxRate: null,
      discounts: [],
    });

    expect(result.taxRate).toBeNull();
    expect(result.discounts).toEqual([]);
  });

  it('defaults blank optional variant price and minimum purchase to zero', () => {
    const result = createProductSchema.parse({
      name: 'Variant product',
      salesPrice: '20',
      costPrice: '10',
      variants: [{ variantName: 'Blue / Large', extraPrice: '' }],
      discounts: [{
        name: 'Launch offer',
        type: 'FIXED',
        value: '5',
        minPurchase: '',
      }],
    });

    expect(result.variants[0].extraPrice).toBe(0);
    expect(result.discounts[0].minPurchase).toBe(0);
  });
});
