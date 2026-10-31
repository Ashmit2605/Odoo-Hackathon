import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatCurrency(amount, currency = 'INR') {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

function formatDate(dateValue) {
  if (!dateValue) return 'N/A';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Generates a professional quotation PDF and saves it to Backend/storage/quotations/
 * @param {Object} quotation - Quotation record
 * @param {Array} items - Array of quotation items
 * @param {Object} customer - Customer record
 * @returns {Promise<string>} File path of saved PDF
 */
export async function generateQuotationPDF(quotation, items = [], customer = {}) {
  const storageDir = path.resolve(__dirname, '../../storage/quotations');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const filename = `Brightloop_Quotation_${quotation.quotationNumber}.pdf`;
  const filePath = path.join(storageDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Quotation ${quotation.quotationNumber}`,
          Author: 'Brightloop Subscription Management',
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const pageWidth = doc.page.width - 80; // 515.28 pt usable width
      const currency = quotation.currency || 'INR';

      // ────────────────── HEADER ──────────────────
      // Brand Name & Subtitle
      doc.fillColor('#1E3A8A').fontSize(22).font('Helvetica-Bold').text('BRIGHTLOOP', 40, 40);
      doc.fillColor('#6B7280').fontSize(9).font('Helvetica').text('Subscription & Billing Management System', 40, 66);

      // Quotation Title & Meta on the right
      doc.fillColor('#1E3A8A').fontSize(20).font('Helvetica-Bold').text('QUOTATION', 350, 40, { align: 'right', width: 205 });
      doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text(`Quotation #: ${quotation.quotationNumber}`, 350, 66, { align: 'right', width: 205 });
      doc.font('Helvetica').fillColor('#4B5563').text(`Date: ${formatDate(quotation.createdAt)}`, 350, 79, { align: 'right', width: 205 });
      doc.text(`Valid Until: ${formatDate(quotation.validUntil)}`, 350, 92, { align: 'right', width: 205 });
      doc.text(`Status: ${quotation.status}`, 350, 105, { align: 'right', width: 205 });

      // Horizontal Divider
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, 125).lineTo(40 + pageWidth, 125).stroke();

      // ────────────────── CUSTOMER & COMPANY INFO ──────────────────
      let currentY = 135;
      
      // Customer Box (Left)
      doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold').text('QUOTATION FOR', 40, currentY);
      currentY += 16;
      doc.fillColor('#1F2937').fontSize(10).font('Helvetica-Bold').text(customer.name || 'Valued Customer', 40, currentY);
      currentY += 14;

      doc.font('Helvetica').fontSize(9).fillColor('#4B5563');
      if (customer.companyName) {
        doc.text(`Company: ${customer.companyName}`, 40, currentY);
        currentY += 13;
      }
      if (customer.email) {
        doc.text(`Email: ${customer.email}`, 40, currentY);
        currentY += 13;
      }
      if (customer.phone) {
        doc.text(`Phone: ${customer.phone}`, 40, currentY);
        currentY += 13;
      }
      if (customer.address) {
        doc.text(`Address: ${customer.address}`, 40, currentY, { width: 220 });
        currentY += 26;
      }

      // Company Box (Right)
      let compY = 135;
      doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold').text('ISSUED BY', 340, compY);
      compY += 16;
      doc.fillColor('#1F2937').fontSize(10).font('Helvetica-Bold').text('Brightloop Systems Ltd.', 340, compY);
      compY += 14;
      doc.font('Helvetica').fontSize(9).fillColor('#4B5563');
      doc.text('support@brightloop.com', 340, compY);
      compY += 13;
      doc.text('www.brightloop.com', 340, compY);
      compY += 13;
      doc.text('Global Subscription Solutions', 340, compY);

      currentY = Math.max(currentY, compY) + 20;

      // ────────────────── ITEMS TABLE ──────────────────
      // Table Header
      const colX = {
        item: 40,
        product: 60,
        plan: 195,
        cycle: 275,
        qty: 325,
        unitPrice: 365,
        discount: 415,
        tax: 460,
        total: 505,
      };

      doc.rect(40, currentY, pageWidth, 22).fill('#F3F4F6');
      doc.fillColor('#1E3A8A').fontSize(8.5).font('Helvetica-Bold');
      doc.text('#', colX.item, currentY + 6);
      doc.text('Product', colX.product, currentY + 6);
      doc.text('Plan', colX.plan, currentY + 6);
      doc.text('Cycle', colX.cycle, currentY + 6);
      doc.text('Qty', colX.qty, currentY + 6, { width: 35, align: 'right' });
      doc.text('Price', colX.unitPrice, currentY + 6, { width: 45, align: 'right' });
      doc.text('Disc', colX.discount, currentY + 6, { width: 40, align: 'right' });
      doc.text('Tax', colX.tax, currentY + 6, { width: 40, align: 'right' });
      doc.text('Total', colX.total, currentY + 6, { width: 50, align: 'right' });

      currentY += 24;

      // Table Rows
      doc.font('Helvetica').fontSize(8.5);
      items.forEach((item, index) => {
        // Page break guard
        if (currentY > 680) {
          doc.addPage();
          currentY = 40;
        }

        const isEven = index % 2 === 0;
        if (!isEven) {
          doc.rect(40, currentY, pageWidth, 20).fill('#FAFAFA');
        }

        const prodName = item.productNameSnapshot || 'Product';
        const planName = item.planNameSnapshot || '-';
        const cycle = item.billingCycleSnapshot || '-';
        const qty = item.quantity;
        const price = formatCurrency(item.unitPrice, '');
        const disc = formatCurrency(item.discount, '');
        const taxRate = item.taxRate ? `${Number(item.taxRate)}%` : '0%';
        const total = formatCurrency(item.lineTotal, '');

        doc.fillColor('#374151');
        doc.text(String(index + 1), colX.item, currentY + 5);
        doc.text(prodName, colX.product, currentY + 5, { width: 130, ellipsis: true });
        doc.text(planName, colX.plan, currentY + 5, { width: 75, ellipsis: true });
        doc.text(cycle, colX.cycle, currentY + 5, { width: 45 });
        doc.text(String(qty), colX.qty, currentY + 5, { width: 35, align: 'right' });
        doc.text(price, colX.unitPrice, currentY + 5, { width: 45, align: 'right' });
        doc.text(disc, colX.discount, currentY + 5, { width: 40, align: 'right' });
        doc.text(taxRate, colX.tax, currentY + 5, { width: 40, align: 'right' });
        doc.fillColor('#111827').font('Helvetica-Bold');
        doc.text(total, colX.total, currentY + 5, { width: 50, align: 'right' });
        doc.font('Helvetica');

        currentY += 20;
      });

      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, currentY).lineTo(40 + pageWidth, currentY).stroke();
      currentY += 10;

      // ────────────────── SUMMARY BOX ──────────────────
      if (currentY > 620) {
        doc.addPage();
        currentY = 40;
      }

      const summaryWidth = 220;
      const summaryX = 40 + pageWidth - summaryWidth;

      doc.rect(summaryX, currentY, summaryWidth, 90).fill('#F9FAFB');
      doc.rect(summaryX, currentY, summaryWidth, 90).strokeColor('#E5E7EB').stroke();

      let sumY = currentY + 8;
      doc.fillColor('#4B5563').fontSize(9).font('Helvetica');

      doc.text('Subtotal:', summaryX + 12, sumY);
      doc.text(formatCurrency(quotation.subtotal, currency), summaryX + 90, sumY, { width: 118, align: 'right' });
      sumY += 16;

      doc.text('Discount:', summaryX + 12, sumY);
      doc.text(`- ${formatCurrency(quotation.discountAmount, currency)}`, summaryX + 90, sumY, { width: 118, align: 'right' });
      sumY += 16;

      doc.text('Tax Amount:', summaryX + 12, sumY);
      doc.text(`+ ${formatCurrency(quotation.taxAmount, currency)}`, summaryX + 90, sumY, { width: 118, align: 'right' });
      sumY += 18;

      doc.strokeColor('#D1D5DB').lineWidth(0.5).moveTo(summaryX + 10, sumY).lineTo(summaryX + summaryWidth - 10, sumY).stroke();
      sumY += 6;

      doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold');
      doc.text('Grand Total:', summaryX + 12, sumY);
      doc.text(formatCurrency(quotation.totalAmount, currency), summaryX + 90, sumY, { width: 118, align: 'right' });

      // ────────────────── PAYMENT TERMS & NOTES ──────────────────
      const notesWidth = 260;
      let notesY = currentY;

      if (quotation.paymentTerms) {
        doc.fillColor('#1E3A8A').fontSize(9.5).font('Helvetica-Bold').text('Payment Terms:', 40, notesY);
        notesY += 13;
        doc.fillColor('#4B5563').fontSize(8.5).font('Helvetica').text(quotation.paymentTerms, 40, notesY, { width: notesWidth });
        notesY += 24;
      }

      if (quotation.adminNotes) {
        doc.fillColor('#1E3A8A').fontSize(9.5).font('Helvetica-Bold').text('Notes:', 40, notesY);
        notesY += 13;
        doc.fillColor('#4B5563').fontSize(8.5).font('Helvetica').text(quotation.adminNotes, 40, notesY, { width: notesWidth });
        notesY += 24;
      }

      // Terms & Conditions
      currentY = Math.max(currentY + 100, notesY + 10);
      if (currentY > 700) {
        doc.addPage();
        currentY = 40;
      }

      doc.fillColor('#1E3A8A').fontSize(9.5).font('Helvetica-Bold').text('Terms & Conditions:', 40, currentY);
      currentY += 13;
      doc.fillColor('#6B7280').fontSize(8).font('Helvetica');
      doc.text('1. This quotation is valid until the validity date specified above.', 40, currentY);
      currentY += 11;
      doc.text('2. Services will commence upon quotation acceptance and payment confirmation.', 40, currentY);
      currentY += 11;
      doc.text('3. Pricing is exclusive or inclusive of applicable taxes as itemized above.', 40, currentY);
      currentY += 11;
      doc.text('4. This document is a quote and subject to final service agreement terms.', 40, currentY);

      // ────────────────── FOOTER ──────────────────
      const bottomY = doc.page.height - 40;
      doc.strokeColor('#E5E7EB').lineWidth(0.5).moveTo(40, bottomY - 15).lineTo(40 + pageWidth, bottomY - 15).stroke();
      doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica');
      doc.text('Generated by Brightloop • Quotation Reference: ' + quotation.quotationNumber, 40, bottomY - 8, {
        align: 'center',
        width: pageWidth,
      });

      doc.end();

      writeStream.on('finish', () => {
        resolve(filePath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}
