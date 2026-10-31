import { Router } from 'express';
import * as ctrl from '../controllers/quotation.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// CUSTOMER ROUTES (All require authentication)
// ─────────────────────────────────────────────────────────────

router.post('/quotations', requireAuth, ctrl.create);
router.get('/quotations/my', requireAuth, ctrl.getMyQuotations);
router.get('/quotations/:id', requireAuth, ctrl.getOneCustomer);
router.post('/quotations/:id/messages', requireAuth, ctrl.addMessageCustomer);
router.get('/quotations/:id/pdf', requireAuth, ctrl.downloadPdfCustomer);

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES (Require authentication + ADMIN role)
// ─────────────────────────────────────────────────────────────

router.get('/admin/quotations', requireAuth, requireRole('ADMIN'), ctrl.getAllAdmin);
router.get('/admin/quotations/:id', requireAuth, requireRole('ADMIN'), ctrl.getOneAdmin);
router.put('/admin/quotations/:id/accept', requireAuth, requireRole('ADMIN'), ctrl.acceptAdmin);
router.put('/admin/quotations/:id/reject', requireAuth, requireRole('ADMIN'), ctrl.rejectAdmin);
router.put('/admin/quotations/:id/request-information', requireAuth, requireRole('ADMIN'), ctrl.requestInfoAdmin);
router.get('/admin/quotations/:id/pdf', requireAuth, requireRole('ADMIN'), ctrl.downloadPdfAdmin);

export default router;
