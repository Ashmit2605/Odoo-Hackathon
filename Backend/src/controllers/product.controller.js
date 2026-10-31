import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products, productVariants, discounts, discountProducts, taxRates } from '../db/schema.js';
import { badRequest } from '../utils/http-error.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validator.js';

/* attach variants, discounts, tax for each product row */
async function enrichProducts(rows) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);

  const [variants, taxRows, dpRows] = await Promise.all([
    db.select().from(productVariants).where(inArray(productVariants.productId, ids)),
    db.select().from(taxRates),
    db.select().from(discountProducts).where(inArray(discountProducts.productId, ids)),
  ]);

  const discountIds = [...new Set(dpRows.map((d) => d.discountId))];
  const discountRows = discountIds.length
    ? await db.select().from(discounts).where(inArray(discounts.id, discountIds))
    : [];

  const taxMap = Object.fromEntries(taxRows.map((t) => [t.id, t]));
  const variantsByProduct = ids.reduce((m, id) => ({ ...m, [id]: [] }), {});
  variants.forEach((v) => variantsByProduct[v.productId].push(v));

  const discountsByProduct = ids.reduce((m, id) => ({ ...m, [id]: [] }), {});
  dpRows.forEach((dp) => {
    const disc = discountRows.find((d) => d.id === dp.discountId);
    if (disc) discountsByProduct[dp.productId].push(disc);
  });

  return rows.map((p) => ({
    ...p,
    tax: p.taxRateId ? taxMap[p.taxRateId] ?? null : null,
    variants: variantsByProduct[p.id] ?? [],
    discounts: discountsByProduct[p.id] ?? [],
  }));
}

const discountValues = (discount) => ({
  name: discount.name,
  type: discount.type,
  value: String(discount.value),
  appliesTo: 'PRODUCT',
  minPurchase: String(discount.minPurchase),
  minQuantity: discount.minQuantity,
  validFrom: discount.validFrom,
  validUntil: discount.validUntil,
  usageLimit: discount.usageLimit,
  usageCount: discount.usageCount,
  isActive: discount.isActive,
});

async function saveProductRelations(tx, productId, {
  taxRate,
  taxRateId,
  variants,
  discountRules,
  discountIds,
  updateExisting = false,
}) {
  let resolvedTaxRateId = taxRateId ?? null;
  if (taxRate) {
    if (taxRate.id) {
      const [updatedTax] = await tx
        .update(taxRates)
        .set({ name: taxRate.name, percentage: String(taxRate.percentage) })
        .where(eq(taxRates.id, taxRate.id))
        .returning({ id: taxRates.id });
      if (!updatedTax) throw badRequest('The selected tax rate does not exist');
      resolvedTaxRateId = updatedTax.id;
    } else {
      const [createdTax] = await tx
        .insert(taxRates)
        .values({ name: taxRate.name, percentage: String(taxRate.percentage) })
        .returning({ id: taxRates.id });
      resolvedTaxRateId = createdTax.id;
    }
  }

  if (variants) {
    if (updateExisting) {
      await tx.delete(productVariants).where(eq(productVariants.productId, productId));
    }
    if (variants.length) {
      await tx.insert(productVariants).values(
        variants.map((variant) => ({
          productId,
          variantName: variant.variantName,
          extraPrice: String(variant.extraPrice),
        }))
      );
    }
  }

  if (updateExisting && (discountRules || discountIds)) {
    const linkedDiscounts = await tx
      .select({ discountId: discountProducts.discountId })
      .from(discountProducts)
      .where(eq(discountProducts.productId, productId));
    const linkedIds = new Set(linkedDiscounts.map(({ discountId }) => discountId));
    const requestedExistingIds = (discountRules ?? [])
      .map(({ id }) => id)
      .filter(Boolean);
    if (requestedExistingIds.some((id) => !linkedIds.has(id))) {
      throw badRequest('A discount rule is not linked to this product');
    }
    await tx.delete(discountProducts).where(eq(discountProducts.productId, productId));
  }

  const savedDiscountIds = [];
  for (const rule of discountRules ?? []) {
    if (rule.id) {
      const [updatedDiscount] = await tx
        .update(discounts)
        .set(discountValues(rule))
        .where(eq(discounts.id, rule.id))
        .returning({ id: discounts.id });
      if (!updatedDiscount) throw badRequest('A discount rule does not exist');
      savedDiscountIds.push(updatedDiscount.id);
    } else {
      const [createdDiscount] = await tx
        .insert(discounts)
        .values(discountValues(rule))
        .returning({ id: discounts.id });
      savedDiscountIds.push(createdDiscount.id);
    }
  }

  const requestedDiscountIds = [...new Set([
    ...savedDiscountIds,
    ...(discountIds ?? []),
  ])];
  if (requestedDiscountIds.length) {
    const validDiscounts = await tx
      .select({ id: discounts.id, appliesTo: discounts.appliesTo })
      .from(discounts)
      .where(inArray(discounts.id, requestedDiscountIds));
    if (
      validDiscounts.length !== requestedDiscountIds.length ||
      validDiscounts.some((discount) => discount.appliesTo !== 'PRODUCT')
    ) {
      throw badRequest('All linked discount rules must exist and apply to products');
    }
    await tx.insert(discountProducts).values(
      requestedDiscountIds.map((discountId) => ({ discountId, productId }))
    );
  }

  return resolvedTaxRateId;
}

export async function listProducts(req, res, next) {
  try {
    const rows = await db.select().from(products);
    const enriched = await enrichProducts(rows);
    res.json({ data: enriched });
  } catch (err) { next(err); }
}

export async function getProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });
    const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!row) return res.status(404).json({ error: 'Product not found' });
    const [enriched] = await enrichProducts([row]);
    res.json({ data: enriched });
  } catch (err) { next(err); }
}

export async function createProduct(req, res, next) {
  try {
    const input = createProductSchema.parse(req.body);
    const product = await db.transaction(async (tx) => {
      const [createdProduct] = await tx.insert(products).values({
        name: input.name,
        productType: input.productType || null,
        salesPrice: String(input.salesPrice),
        costPrice: String(input.costPrice),
        taxRateId: input.taxRateId ?? null,
        notes: input.notes || null,
      }).returning();

      const resolvedTaxRateId = await saveProductRelations(tx, createdProduct.id, {
        taxRate: input.taxRate,
        taxRateId: input.taxRateId,
        variants: input.variants,
        discountRules: input.discounts,
        discountIds: input.discountIds,
      });

      if (resolvedTaxRateId !== (createdProduct.taxRateId ?? null)) {
        const [updatedProduct] = await tx
          .update(products)
          .set({ taxRateId: resolvedTaxRateId })
          .where(eq(products.id, createdProduct.id))
          .returning();
        return updatedProduct;
      }
      return createdProduct;
    });
    const [enriched] = await enrichProducts([product]);
    res.status(201).json({ data: enriched });
  } catch (err) { next(err); }
}

export async function updateProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });
    const input = updateProductSchema.parse(req.body);
    const updated = await db.transaction(async (tx) => {
      const [existingProduct] = await tx
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
      if (!existingProduct) return null;

      const updates = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.productType !== undefined) updates.productType = input.productType || null;
      if (input.salesPrice !== undefined) updates.salesPrice = String(input.salesPrice);
      if (input.costPrice !== undefined) updates.costPrice = String(input.costPrice);
      if (input.taxRateId !== undefined) updates.taxRateId = input.taxRateId;
      if (input.taxRate === null) updates.taxRateId = null;
      if (input.notes !== undefined) updates.notes = input.notes || null;

      const relationFieldsProvided =
        input.taxRate !== undefined ||
        input.taxRateId !== undefined ||
        input.variants !== undefined ||
        input.discounts !== undefined ||
        input.discountIds !== undefined;
      const resolvedTaxRateId = relationFieldsProvided
        ? await saveProductRelations(tx, id, {
            taxRate: input.taxRate,
            taxRateId: input.taxRateId,
            variants: input.variants,
            discountRules: input.discounts,
            discountIds: input.discountIds,
            updateExisting: true,
          })
        : existingProduct.taxRateId;
      if (
        (input.taxRate !== undefined || input.taxRateId !== undefined) &&
        resolvedTaxRateId !== existingProduct.taxRateId
      ) {
        updates.taxRateId = resolvedTaxRateId;
      }

      const [savedProduct] = await tx
        .update(products)
        .set(updates)
        .where(eq(products.id, id))
        .returning();
      return savedProduct;
    });
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    const [enriched] = await enrichProducts([updated]);
    res.json({ data: enriched });
  } catch (err) { next(err); }
}

export async function deleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) { next(err); }
}
