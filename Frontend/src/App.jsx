import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import Home from "./pages/Home/Home.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";

import AdminDashboard from "./pages/AdminDash/Admindash.jsx";
import StaffDashboard from "./pages/StaffDash/Staffdash.jsx";
import CustomerDashboard from "./pages/CustomerDash/Customerdash.jsx";

import Customers from "./pages/customers/Customers.jsx";
import CustomerDetails from "./pages/customers/CustomerDetails.jsx";
import Quotations from "./pages/quotations/Quotations.jsx";
import AddQuotation from "./pages/quotations/AddQuotation.jsx";
import Subscriptions from "./pages/subscriptions/Subscriptions.jsx";
import SubscriptionDetails from "./pages/subscriptions/SubscriptionDetails.jsx";
import Invoices from "./pages/invoices/Invoices.jsx";
import InvoiceDetails from "./pages/invoices/InvoiceDetails.jsx";
import Payments from "./pages/payments/Payments.jsx";
import Products from "./pages/products/Products.jsx";
import AddProduct from "./pages/products/AddProduct.jsx";
import Plans from "./pages/plans/Plans.jsx";
import AddPlan from "./pages/plans/AddPlan.jsx";

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
import CustomerProfile from "./components/CustomerDashboard/CustomerProfile.jsx";
import CustomerOverview from "./components/CustomerDashboard/CustomerOverview.jsx";
import MySubscriptions from "./components/CustomerDashboard/MySubscriptions.jsx";
import AvailablePlans from "./components/CustomerDashboard/AvailablePlans.jsx";
import MyQuotations from "./components/CustomerDashboard/MyQuotations.jsx";
import MyInvoices from "./components/CustomerDashboard/MyInvoices.jsx";
import PaymentHistory from "./components/CustomerDashboard/PaymentHistory.jsx";

const DashboardSection = ({ role }) => (
  <div className="p-8">
    <h1 className="text-2xl font-semibold">{role} dashboard</h1>
    <p className="mt-2 text-stone-500">Welcome to your dashboard.</p>
  </div>
);

function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const user = (() => {
    try {
      return JSON.parse(
      localStorage.getItem("user") || sessionStorage.getItem("user") || "null"
      );
    } catch {
      return null;
    }
  })();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    const roleRoutes = {
      ADMIN: "/admin/dashboard",
      STAFF: "/staff/dashboard",
      CUSTOMER: "/customer/dashboard",
    };
    return <Navigate to={roleRoutes[user.role] || "/login"} replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetails />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="quotations/new" element={<AddQuotation />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="subscriptions/:id" element={<SubscriptionDetails />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route path="payments" element={<Payments />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<AddProduct />} />
            <Route path="plans" element={<Plans />} />
            <Route path="plans/new" element={<AddPlan />} />
            <Route path="templates" element={<QuotationTemplates />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="taxes" element={<Taxes />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="audit-log" element={<AuditLog />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<DashboardSection role="Admin" />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["STAFF"]} />}>
          <Route path="/staff" element={<StaffDashboard />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StaffOverview />} />
            <Route path="profile" element={<StaffProfile />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetails />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="subscriptions/:id" element={<SubscriptionDetails />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route path="payments" element={<Payments />} />
            <Route path="overdue" element={<OverdueInvoices />} />
            <Route path="products" element={<ProductCatalog />} />
            <Route path="plans" element={<Plans />} />
            <Route path="reports" element={<StaffReports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<DashboardSection role="Staff" />} />
          </Route>
        </Route>

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
            <Route path="invoices" element={<MyInvoices />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route path="payments" element={<PaymentHistory />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/customer/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
