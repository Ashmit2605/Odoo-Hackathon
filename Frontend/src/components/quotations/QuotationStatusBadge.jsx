import React from "react";

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  NEEDS_INFORMATION: {
    label: "Needs Information",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  ACCEPTED: {
    label: "Accepted",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  EXPIRED: {
    label: "Expired",
    bg: "bg-stone-100",
    text: "text-stone-600",
    border: "border-stone-300",
    dot: "bg-stone-400",
  },
};

export default function QuotationStatusBadge({ status, size = "md", className = "" }) {
  const normStatus = (status || "").toUpperCase();
  const config = STATUS_CONFIG[normStatus] || {
    label: status || "Unknown",
    bg: "bg-stone-100",
    text: "text-stone-600",
    border: "border-stone-300",
    dot: "bg-stone-400",
  };

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2.5 py-0.5 gap-1.5"
      : size === "lg"
      ? "text-sm px-4 py-1.5 gap-2"
      : "text-xs px-3 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
