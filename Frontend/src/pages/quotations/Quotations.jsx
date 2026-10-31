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
}
