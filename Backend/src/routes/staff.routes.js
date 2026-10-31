// Backend/src/routes/staff.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import * as staffController from '../controllers/staff.controller.js';

const router = Router();

// All staff routes require login and STAFF or ADMIN role
router.use(requireAuth);
router.use(requireRole('STAFF', 'ADMIN'));

// 1. Dashboard
router.get('/dashboard', staffController.getDashboardSummary);

// 2. Customers
router.get('/customers', staffController.getCustomers);
router.get('/customers/:id', staffController.getCustomerById);
router.post('/customers', staffController.createCustomer);

// 3. Invoices (View, Confirm)
router.get('/invoices', staffController.getInvoices);
router.patch('/invoices/:id/confirm', staffController.confirmInvoice);

// 4. Payments (Record)
router.post('/payments', staffController.recordPayment);

// 5. Overdue Invoices
router.get('/overdue-invoices', staffController.getOverdueInvoices);

export default router;