import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import {
  createProduct,
  getProduct,
  getProducts,
} from "../controllers/api.controller.js";
import {
  adminCreateInvoice,
  adminCreateSubscription,
  assignStaff,
  cancelExpiredSubscriptions,
  completeTestCheckout,
  createCheckout,
  createCustomer,
  createQuotation,
  createPlan,
  dashboard,
  getCustomer,
  getInvoice,
  getPlan,
  getSubscription,
  getSubscriptions,
  listCustomers,
  listAdminUsers,
  listInvoices,
  listPayments,
  listPlans,
  listQuotations,
  listStaffAssignments,
  recordManualPayment,
  requestCancellation,
  reverseCancellation,
  requestStaffCancellation,
  selfSubscribe,
  updatePlan,
  updateUserRole,
} from "../controllers/business.controller.js";

const apiRouter = Router();

apiRouter.use(requireAuth);

apiRouter.get("/dashboard", dashboard);
apiRouter.get("/plans", listPlans);
apiRouter.get("/plans/:id", getPlan);
apiRouter.post("/plans", requireRole("ADMIN"), createPlan);
apiRouter.patch("/plans/:id", requireRole("ADMIN"), updatePlan);

apiRouter.get("/customers", listCustomers);
apiRouter.get("/customers/:id", getCustomer);
apiRouter.post("/customers", requireRole("ADMIN"), createCustomer);
apiRouter.post("/admin/staff-assignments", requireRole("ADMIN"), assignStaff);
apiRouter.get("/admin/staff-assignments", requireRole("ADMIN"), listStaffAssignments);
apiRouter.get("/admin/users", requireRole("ADMIN"), listAdminUsers);
apiRouter.patch("/admin/users/:id/role", requireRole("ADMIN"), updateUserRole);

apiRouter.get("/products", requireRole("ADMIN", "STAFF"), getProducts);
apiRouter.get("/products/:id", requireRole("ADMIN", "STAFF"), getProduct);
apiRouter.post("/products", requireRole("ADMIN"), createProduct);

apiRouter.get("/subscriptions", getSubscriptions);
apiRouter.get("/subscriptions/:id", getSubscription);
apiRouter.post("/subscriptions", requireRole("ADMIN"), adminCreateSubscription);
apiRouter.post("/subscriptions/:id/cancel", requireRole("ADMIN", "CUSTOMER"), requestCancellation);
apiRouter.post("/subscriptions/:id/reinstate", requireRole("ADMIN", "CUSTOMER"), reverseCancellation);
apiRouter.post("/staff/subscriptions/:id/cancellation-request", requireRole("STAFF"), requestStaffCancellation);
apiRouter.post("/customer/subscriptions", requireRole("CUSTOMER"), selfSubscribe);

apiRouter.get("/quotations", requireRole("ADMIN", "STAFF"), listQuotations);
apiRouter.post("/quotations", requireRole("ADMIN"), createQuotation);

apiRouter.get("/invoices", listInvoices);
apiRouter.get("/invoices/:id", getInvoice);
apiRouter.post("/invoices", requireRole("ADMIN"), adminCreateInvoice);
apiRouter.post("/admin/invoices/:id/payments", requireRole("ADMIN"), recordManualPayment);
apiRouter.post("/customer/invoices/:id/checkout", requireRole("CUSTOMER"), createCheckout);
apiRouter.post("/customer/payments/:id/complete-test", requireRole("CUSTOMER"), completeTestCheckout);
apiRouter.get("/payments", listPayments);

apiRouter.post("/admin/process-lifecycle", requireRole("ADMIN"), cancelExpiredSubscriptions);

export default apiRouter;
