<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layout / dashboards
=======
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

// Public pages
>>>>>>> 4793c53 (Update frontend App routing)
import Home from "./pages/Home/Home.jsx";
import AdminDashboard from "./pages/AdminDash/Admindash.jsx";
import StaffDashboard from "./pages/StaffDash/Staffdash.jsx";
import CustomerDashboard from "./pages/CustomerDash/Customerdash.jsx";

// Auth
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";

<<<<<<< HEAD
// Admin / shared pages
=======
// Dashboard layouts
import AdminDashboard from "./pages/AdminDash/Admindash.jsx";
import StaffDashboard from "./pages/StaffDash/Staffdash.jsx";
import CustomerDashboard from "./pages/CustomerDash/Customerdash.jsx";

// Admin and Staff pages
>>>>>>> 4793c53 (Update frontend App routing)
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

<<<<<<< HEAD
// Simple role-based placeholder for the dashboard index routes
const DashboardSection = ({ role }) => (
  <div style={{ padding: 32 }}>{role} dashboard</div>
);

=======
// Dashboard placeholder
const DashboardSection = ({ role }) => (
  <div style={{ padding: 32 }}>
    <h1>{role} Dashboard</h1>
    <p>Welcome to your dashboard.</p>
  </div>
);

// Role-based route protection
function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const roleRoutes = {
      ADMIN: "/admin/dashboard",
      STAFF: "/staff/dashboard",
      CUSTOMER: "/customer/dashboard",
    };

    return (
      <Navigate
        to={roleRoutes[user.role] || "/login"}
        replace
      />
    );
  }

  return <Outlet />;
}

>>>>>>> 4793c53 (Update frontend App routing)
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
<<<<<<< HEAD
        {/* Public */}
=======

        {/* Public Routes */}
>>>>>>> 4793c53 (Update frontend App routing)
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Backwards compat: teammate's old link still works */}
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

<<<<<<< HEAD
        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardSection role="admin" />} />
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
          <Route path="*" element={<DashboardSection role="admin" />} />
=======
        {/* ADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<Navigate to="dashboard" replace />} />

            <Route path="dashboard" element={<DashboardSection role="Admin" />} />

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
          </Route>
>>>>>>> 4793c53 (Update frontend App routing)
        </Route>

        {/* STAFF ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["STAFF"]} />}>
          <Route path="/staff" element={<StaffDashboard />}>
            <Route index element={<Navigate to="dashboard" replace />} />

            <Route path="dashboard" element={<DashboardSection role="Staff" />} />

            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetails />} />

            <Route path="quotations" element={<Quotations />} />

            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="subscriptions/:id" element={<SubscriptionDetails />} />

            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />

            <Route path="payments" element={<Payments />} />

            <Route path="products" element={<Products />} />
            <Route path="plans" element={<Plans />} />
          </Route>
        </Route>

        {/* CUSTOMER ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["CUSTOMER"]} />}>
          <Route path="/customer" element={<CustomerDashboard />}>
            <Route index element={<Navigate to="dashboard" replace />} />

            <Route path="dashboard" element={<DashboardSection role="Customer" />} />

            <Route path="quotations" element={<Quotations />} />

            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="subscriptions/:id" element={<SubscriptionDetails />} />

            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />

            <Route path="payments" element={<Payments />} />

            <Route path="plans" element={<Plans />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}