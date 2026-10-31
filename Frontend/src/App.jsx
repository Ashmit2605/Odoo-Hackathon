import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminDashboard from "./pages/AdminDash/Admindash.jsx";
import StaffDashboard from "./pages/StaffDash/Staffdash.jsx";
import CustomerDashboard from "./pages/CustomerDash/Customerdash.jsx";
const DashboardSection = ({ role }) => <div style={{ padding: 32 }}>{role} dashboard</div>;

// Admin pages
const AdminDash = () => <div style={{ padding: 32 }}>Admin Dashboard</div>;
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

// Auth pages
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDash />} />
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
        </Route>

        {/* Staff */}
        <Route path="/staff" element={<StaffDashboard />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardSection role="staff" />} />
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
          <Route path="*" element={<DashboardSection role="staff" />} />
        </Route>

        {/* Customer */}
        <Route path="/customer" element={<CustomerDashboard />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardSection role="customer" />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="subscriptions/:id" element={<SubscriptionDetails />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/:id" element={<InvoiceDetails />} />
          <Route path="payments" element={<Payments />} />
          <Route path="plans" element={<Plans />} />
          <Route path="*" element={<DashboardSection role="customer" />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
