
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

// ==================== PUBLIC PAGES ====================
import Home from "./pages/Home/Home.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";

// ==================== DASHBOARD LAYOUTS ====================
import AdminDashboard from "./pages/AdminDash/Admindash.jsx";
import StaffDashboard from "./pages/StaffDash/Staffdash.jsx";
import CustomerDashboard from "./pages/CustomerDash/Customerdash.jsx";

// ==================== SHARED MANAGEMENT PAGES ====================
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

// ==================== ADMIN PAGES ====================
import QuotationTemplates from "./pages/admin/QuotationTemplates.jsx";
import Discounts from "./pages/admin/Discounts.jsx";
import Taxes from "./pages/admin/Taxes.jsx";
import AdminReports from "./pages/admin/Reports.jsx";
import AuditLog from "./pages/admin/AuditLog.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";

// ==================== STAFF PAGES ====================
import OverdueInvoices from "./pages/staff/OverdueInvoices.jsx";
import StaffReports from "./pages/staff/Reports.jsx";

// ==================== SHARED SETTINGS ====================
import Settings from "./pages/shared/Settings.jsx";
import ProductCatalog from "./pages/shared/ProductCatalog.jsx";

// ==================== PROFILE PAGES ====================
import AdminProfile from "./components/AdminDashboard/AdminProfile.jsx";
import StaffProfile from "./components/StaffDashboard/StaffProfile.jsx";
import CustomerProfile from "./components/CustomerDashboard/CustomerProfile.jsx";

// ==================== NEW CUSTOMER PAGES ====================
// These are the customer-specific components we created.

import CustomerOverview from "./components/CustomerDashboard/CustomerOverview.jsx";
import MySubscriptions from "./components/CustomerDashboard/MySubscriptions.jsx";
import MyQuotations from "./components/CustomerDashboard/MyQuotations.jsx";
import MyInvoices from "./components/CustomerDashboard/MyInvoices.jsx";
import PaymentHistory from "./components/CustomerDashboard/PaymentHistory.jsx";

// Temporary placeholders for Admin and Staff overview pages.
const DashboardSection = ({ role }) => (
  <div style={{ padding: 32 }}>
    {role} dashboard
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================== PUBLIC ROUTES ==================== */}

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/signup" element={<Register />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* ==================== ADMIN ROUTES ==================== */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        >
          <Route
            index
            element={<Navigate to="dashboard" replace />}
          />

          <Route
            path="dashboard"
            element={<DashboardSection role="admin" />}
          />

          <Route
            path="profile"
            element={<AdminProfile />}
          />

          <Route
            path="customers"
            element={<Customers />}
          />

          <Route
            path="customers/:id"
            element={<CustomerDetails />}
          />

          <Route
            path="quotations"
            element={<Quotations />}
          />

          <Route
            path="quotations/new"
            element={<AddQuotation />}
          />

          <Route
            path="subscriptions"
            element={<Subscriptions />}
          />

          <Route
            path="subscriptions/:id"
            element={<SubscriptionDetails />}
          />

          <Route
            path="invoices"
            element={<Invoices />}
          />

          <Route
            path="invoices/:id"
            element={<InvoiceDetails />}
          />

          <Route
            path="payments"
            element={<Payments />}
          />

          <Route
            path="products"
            element={<Products />}
          />

          <Route
            path="products/new"
            element={<AddProduct />}
          />

          <Route
            path="plans"
            element={<Plans />}
          />

          <Route
            path="plans/new"
            element={<AddPlan />}
          />

          <Route
            path="templates"
            element={<QuotationTemplates />}
          />

          <Route
            path="discounts"
            element={<Discounts />}
          />

          <Route
            path="taxes"
            element={<Taxes />}
          />

          <Route
            path="reports"
            element={<AdminReports />}
          />

          <Route
            path="audit-log"
            element={<AuditLog />}
          />

          <Route
            path="users"
            element={<UserManagement />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />

          <Route
            path="*"
            element={<DashboardSection role="admin" />}
          />
        </Route>

        {/* ==================== STAFF ROUTES ==================== */}

        <Route
          path="/staff"
          element={<StaffDashboard />}
        >
          <Route
            index
            element={<Navigate to="dashboard" replace />}
          />

          <Route
            path="dashboard"
            element={<DashboardSection role="staff" />}
          />

          <Route
            path="profile"
            element={<StaffProfile />}
          />

          <Route
            path="customers"
            element={<Customers />}
          />

          <Route
            path="customers/:id"
            element={<CustomerDetails />}
          />

          <Route
            path="quotations"
            element={<Quotations />}
          />

          <Route
            path="subscriptions"
            element={<Subscriptions />}
          />

          <Route
            path="subscriptions/:id"
            element={<SubscriptionDetails />}
          />

          <Route
            path="invoices"
            element={<Invoices />}
          />

          <Route
            path="invoices/:id"
            element={<InvoiceDetails />}
          />

          <Route
            path="payments"
            element={<Payments />}
          />

          <Route
            path="overdue"
            element={<OverdueInvoices />}
          />

          <Route
            path="products"
            element={<ProductCatalog />}
          />

          <Route
            path="plans"
            element={<Plans />}
          />

          <Route
            path="reports"
            element={<StaffReports />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />

          <Route
            path="*"
            element={<DashboardSection role="staff" />}
          />
        </Route>

        {/* ==================== CUSTOMER ROUTES ==================== */}
        {/* UPDATED: All pages now use customer-specific components. */}

        <Route
          path="/customer"
          element={<CustomerDashboard />}
        >
          {/* Default customer route */}
          <Route
            index
            element={<Navigate to="dashboard" replace />}
          />

          {/* 1. Customer Overview */}
          <Route
            path="dashboard"
            element={<CustomerOverview />}
          />

          {/* 2. My Profile — Already completed */}
          <Route
            path="profile"
            element={<CustomerProfile />}
          />

          <Route
            path="products"
            element={<ProductCatalog />}
          />

          {/* 3. My Subscriptions */}
          <Route
            path="subscriptions"
            element={<MySubscriptions />}
          />

          {/* 4. My Quotations */}
          <Route
            path="quotations"
            element={<MyQuotations />}
          />

          {/* 6. My Invoices */}
          <Route
            path="invoices"
            element={<MyInvoices />}
          />

          {/* 7. Payment History */}
          <Route
            path="payments"
            element={<PaymentHistory />}
          />

          {/* Existing customer detail routes */}
          <Route
            path="subscriptions/:id"
            element={<SubscriptionDetails />}
          />

          <Route
            path="invoices/:id"
            element={<InvoiceDetails />}
          />

          {/* Shared Settings */}
          <Route
            path="settings"
            element={<Settings />}
          />

          {/* Unknown customer routes */}
          <Route
            path="*"
            element={
              <Navigate to="/customer/dashboard" replace />
            }
          />
        </Route>

        {/* ==================== FALLBACK ROUTE ==================== */}

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}
