import { AlertCircle, LoaderCircle, X } from "lucide-react";

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const getPendingAmount = (invoice) =>
  Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.amountPaid || 0));

export const getStaffUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export function StatusBadge({ status }) {
  const styles = {
    ACTIVE: "bg-[#E8EEDC] text-[#496A36]",
    CONFIRMED: "bg-[#E8EEDC] text-[#496A36]",
    PENDING_PAYMENT: "bg-[#FFF2DE] text-[#B96B10]",
    PAUSED: "bg-gray-100 text-gray-600",
    CLOSED: "bg-gray-100 text-gray-600",
    QUOTATION: "bg-blue-50 text-blue-700",
    DRAFT: "bg-gray-100 text-gray-600",
    UNPAID: "bg-[#FFF2DE] text-[#B96B10]",
    OVERDUE: "bg-red-50 text-red-600",
    PAID: "bg-green-50 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {String(status || "UNKNOWN").replaceAll("_", " ")}
    </span>
  );
}

export function StatCard({ title, value, description, icon: Icon, iconBg = "bg-[#E8EEDC]" }) {
  return (
    <div className="rounded-2xl border border-[#EAE5DC] bg-white p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="mt-3 text-2xl font-bold text-[#5A3E2B] md:text-3xl">{value}</h3>
        </div>
        <div className={`rounded-xl p-3 ${iconBg}`}>
          <Icon size={22} className="text-[#5A3E2B]" />
        </div>
      </div>
      {description && <p className="mt-4 text-xs text-gray-400">{description}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow = "STAFF PORTAL", title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="mb-2 text-sm font-semibold text-[#718E55]">{eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-[#EAE5DC] bg-white p-5 md:p-7 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-bold text-[#5A3E2B]">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function PageShell({ children }) {
  return (
    <div className="min-h-full bg-[#FCFAF7] p-4 text-[#5A3E2B] md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">{children}</div>
    </div>
  );
}

export function Spinner({ label = "Loading" }) {
  return (
    <div className="flex items-center justify-center p-12">
      <LoaderCircle size={30} className="animate-spin text-[#87A96B]" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span className="flex items-center gap-2"><AlertCircle size={17} />{message}</span>
      {onRetry && <button type="button" onClick={onRetry} className="font-semibold underline">Retry</button>}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
      {message}
    </div>
  );
}

export function EmptyState({ message }) {
  return <p className="py-10 text-center text-sm text-gray-500">{message}</p>;
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-[#5A3E2B]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[#EAE5DC] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/30";

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#87A96B] px-5 py-2.5 text-sm font-semibold text-[#14200F] transition hover:bg-[#76986a] disabled:cursor-not-allowed disabled:opacity-60";

export const darkBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#5A3E2B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#493120] disabled:cursor-not-allowed disabled:opacity-60";

export const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#EAE5DC] px-4 py-2 text-sm font-semibold transition hover:bg-[#FCFAF7] disabled:cursor-not-allowed disabled:opacity-60";

export function Table({ columns, rows, rowKey = "id", empty = "Nothing to show yet." }) {
  if (!rows.length) return <EmptyState message={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#EAE5DC] text-xs uppercase tracking-wide text-gray-400">
            {columns.map((col) => (
              <th key={col.header} className={`px-3 py-3 font-semibold ${col.align === "right" ? "text-right" : ""}`}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EAE5DC]">
          {rows.map((row) => (
            <tr key={row[rowKey]} className="transition hover:bg-[#FCFAF7]">
              {columns.map((col) => (
                <td key={col.header} className={`px-3 py-4 ${col.align === "right" ? "text-right" : ""}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}