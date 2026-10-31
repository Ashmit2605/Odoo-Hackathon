<<<<<<< HEAD
import React from "react";
import { useLocation } from "react-router-dom";
import AdminQuotations from "../admin/quotations/AdminQuotations.jsx";
import CustomerQuotations from "../customer/quotations/CustomerQuotations.jsx";

export default function Quotations() {
  const location = useLocation();
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const isAdminOrStaff =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/staff") ||
    user.role === "ADMIN" ||
    user.role === "STAFF";

  if (isAdminOrStaff) {
    return <AdminQuotations />;
  }

  return <CustomerQuotations />;
=======
import ResourcePage from "../../components/ResourcePage.jsx";
import { getQuotations } from "../../services/subscriptionService.js";

const columns = [
  { key: "id", label: "ID" },
  { key: "subscriptionNumber", label: "Quotation" },
  { key: "customerName", label: "Customer" },
  { key: "planName", label: "Plan" },
  { key: "startDate", label: "Start date" },
  { key: "status", label: "Status" },
];

export default function Quotations() {
  return <ResourcePage title="Quotations" load={getQuotations} columns={columns} detailPath={(id) => `/subscriptions/${id}`} />;
>>>>>>> 315d366 (done)
}
