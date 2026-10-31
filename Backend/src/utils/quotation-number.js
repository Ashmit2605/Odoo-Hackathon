import { db } from '../db/index.js';
import { quotations } from '../db/schema.js';
import { desc, like } from 'drizzle-orm';

/**
 * Generates the next sequential quotation number in format QUO-YYYY-NNNNN (e.g. QUO-2026-00001).
 * Optionally accepts a transaction context (tx).
 */
export async function generateQuotationNumber(tx = db) {
  const currentYear = new Date().getFullYear();
  const prefix = `QUO-${currentYear}-`;

  const [latest] = await tx
    .select({ quotationNumber: quotations.quotationNumber })
    .from(quotations)
    .where(like(quotations.quotationNumber, `${prefix}%`))
    .orderBy(desc(quotations.quotationNumber))
    .limit(1);

  let nextSequence = 1;
  if (latest?.quotationNumber) {
    const parts = latest.quotationNumber.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2], 10);
      if (!Number.isNaN(num)) {
        nextSequence = num + 1;
      }
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSequence}`;
}
