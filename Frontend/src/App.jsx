
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

// ==================== LAYOUT / DASHBOARDS ====================
import Home from "./pages/Home/Home.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";

import AdminDashboard from "./pages/AdminDash/Admindash.jsx";
import StaffDashboard from "./pages/StaffDash/Staffdash.jsx";
import CustomerDashboard from "./pages/CustomerDash/Customerdash.jsx";

// ==================== ADMIN / SHARED PAGES ====================
import Quotations from "./pages/quotations/Quotations.jsx";
import AddQuotation from "./pages/quotations/AddQuotation.jsx";

import AdminQuotations from "./pages/admin/quotations/AdminQuotations.jsx";
import AdminQuotationDetails from "./pages/admin/quotations/AdminQuotationDetails.jsx";

import Subscriptions from "./pages/subscriptions/Subscriptions.jsx";
import SubscriptionDetails from "./pages/subscriptions/SubscriptionDetails.jsx";
import Invoices from "./pages/invoices/Invoices.jsx";
import InvoiceDetails from "./pages/invoices/InvoiceDetails.jsx";
import Payments from "./pages/payments/Payments.jsx";
import Products from "./pages/products/Products.jsx";
import AddProduct from "./pages/products/AddProduct.jsx";
import Plans from "./pages/plans/Plans.jsx";
import AddPlan from "./pages/plans/AddPlan.jsx";

// ==================== ADMIN PAGES ====================
import QuotationTemplates from "./pages/admin/QuotationTemplates.jsx";
import Discounts from "./pages/admin/Discounts.jsx";
import Taxes from "./pages/admin/Taxes.jsx";
import AdminReports from "./pages/admin/Reports.jsx";
import AuditLog from "./pages/admin/AuditLog.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";

import OverdueInvoices from "./pages/staff/OverdueInvoices.jsx";
import StaffReports from "./pages/staff/Reports.jsx";

import Settings from "./pages/shared/Settings.jsx";
import ProductCatalog from "./pages/shared/ProductCatalog.jsx";

import AdminProfile from "./components/AdminDashboard/AdminProfile.jsx";
import AdminOverview from "./components/AdminDashboard/AdminOverview.jsx";
import StaffProfile from "./components/StaffDashboard/StaffProfile.jsx";
import StaffOverview from "./components/StaffDashboard/StaffOverview.jsx";
import StaffCustomers from "./components/StaffDashboard/StaffCustomers.jsx";
import CustomerProfile from "./components/CustomerDashboard/CustomerProfile.jsx";

// ==================== CUSTOMER PAGES ====================
import CustomerOverview from "./components/CustomerDashboard/CustomerOverview.jsx";
import MySubscriptions from "./components/CustomerDashboard/MySubscriptions.jsx";
import AvailablePlans from "./components/CustomerDashboard/AvailablePlans.jsx";
import MyQuotations from "./components/CustomerDashboard/MyQuotations.jsx";
import MyInvoices from "./components/CustomerDashboard/MyInvoices.jsx";
import PaymentHistory from "./components/CustomerDashboard/PaymentHistory.jsx";

import RequestQuotation from "./pages/customer/quotations/RequestQuotation.jsx";
import CustomerQuotationDetails from "./pages/customer/quotations/CustomerQuotationDetails.jsx";

// ==================== ROLE-BASED ROUTE PROTECTION ====================
function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  let user;
  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = undefined;
  }

  if (!token || !user) return <Navigate to="/login" replace />;
  const userRole = user.role?.toUpperCase();
  if (!allowedRoles.includes(userRole)) {
    const roleRoutes = {
      ADMIN: "/admin/dashboard",
      STAFF: "/staff/dashboard",
      CUSTOMER: "/customer/dashboard",
    };
    return <Navigate to={roleRoutes[userRole] || "/login"} replace />;
  }
  return <Outlet />;
}

// ==================== MAIN APP ====================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ==================== ADMIN ROUTES ==================== */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="customers" element={<StaffCustomers />} />
            <Route path="quotations" element={<AdminQuotations />} />
            <Route path="quotations/new" element={<AddQuotation />} />
            <Route path="quotations/:id" element={<AdminQuotationDetails />} />
            <Route path="quotation-templates" element={<QuotationTemplates />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="subscriptions/:id" element={<SubscriptionDetails />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route path="payments" element={<Payments />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<AddProduct />} />
            <Route path="plans" element={<Plans />} />
            <Route path="plans/new" element={<AddPlan />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="taxes" element={<Taxes />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="audit-logs" element={<AuditLog />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        {/* ==================== STAFF ROUTES ==================== */}
        <Route element={<ProtectedRoute allowedRoles={["STAFF"]} />}>
          <Route path="/staff" element={<StaffDashboard />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StaffOverview />} />
            <Route path="customers" element={<StaffCustomers />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="quotations/:id" element={<AdminQuotationDetails />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="subscriptions/:id" element={<SubscriptionDetails />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route path="payments" element={<Payments />} />
            <Route path="overdue" element={<OverdueInvoices />} />
            <Route path="products" element={<ProductCatalog />} />
            <Route path="plans" element={<Plans />} />
            <Route path="reports" element={<StaffReports />} />
            <Route path="profile" element={<StaffProfile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
          </Route>
        </Route>

        {/* ==================== CUSTOMER ROUTES ==================== */}
        <Route element={<ProtectedRoute allowedRoles={["CUSTOMER"]} />}>
          <Route path="/customer" element={<CustomerDashboard />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CustomerOverview />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="products" element={<ProductCatalog />} />
            <Route path="subscriptions" element={<MySubscriptions />} />
            <Route path="subscriptions/:id" element={<SubscriptionDetails />} />
            <Route path="plans" element={<AvailablePlans />} />
            <Route path="quotations" element={<MyQuotations />} />
            <Route path="quotations/new" element={<RequestQuotation />} />
            <Route path="quotations/:id" element={<CustomerQuotationDetails />} />
            <Route path="invoices" element={<MyInvoices />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route path="payments" element={<PaymentHistory />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/customer/dashboard" replace />} />
          </Route>
        </Route>

        {/* ==================== FALLBACK ==================== */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
