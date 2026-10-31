import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createInvoiceFromProduct,
  requestQuotation,
  listMySubscriptions,
  listMyQuotations,
  listMyInvoices,
  payInvoice,
  listMyPayments,
  listAllInvoices,
  listAllPayments,
} from '../controllers/invoice.controller.js';

const router = Router();
router.use(requireAuth);

/* Customer routes */
router.post('/my', createInvoiceFromProduct);          // Buy Now
router.post('/my/quotation', requestQuotation);        // Get Quote
router.get('/my/subscriptions', listMySubscriptions);  // My Subscriptions
router.get('/my/quotations', listMyQuotations);        // My Quotations
router.get('/my', listMyInvoices);
router.post('/my/:id/pay', payInvoice);
router.get('/my-payments', listMyPayments);

/* Admin routes */
router.get('/', (req, res, next) => {
  if (req.auth?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  return listAllInvoices(req, res, next);
});
router.get('/payments', (req, res, next) => {
  if (req.auth?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  return listAllPayments(req, res, next);
});

export default router;
