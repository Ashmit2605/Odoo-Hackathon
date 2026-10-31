import { useEffect, useState } from "react";
import { getDashboard } from "../../services/invoiceService.js";

const cards = [
  ["Customers", "customers"],
  ["Active subscriptions", "activeSubscriptions"],
  ["Invoices", "invoices"],
  ["Paid invoices", "paidInvoices"],
  ["Revenue collected", "revenue", true],
  ["Outstanding", "outstanding", true],
];

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard().then(setMetrics).catch((requestError) => {
      setError(requestError.response?.data?.message || "Unable to load dashboard.");
    });
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#5A3E2B]">Dashboard</h1>
        <p className="mt-1 text-gray-500">A live overview of your subscription business.</p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {!metrics && !error ? (
        <p className="text-gray-500">Loading dashboard...</p>
      ) : metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(([label, key, currency]) => (
            <article key={key} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-3 text-3xl font-bold text-[#5A3E2B]">
                {currency
                  ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(metrics[key] || 0)
                  : metrics[key] ?? 0}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
