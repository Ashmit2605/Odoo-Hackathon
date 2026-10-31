<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { Search, CreditCard } from "lucide-react";
import { invoiceService } from "../../services/invoiceService";

const fmt = (v) => `$${Number(v ?? 0).toFixed(2)}`;
const formatDate = (d) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    invoiceService.listAllPayments()
      .then((r) => setPayments(r.data))
      .catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) =>
      String(p.id).includes(q) || String(p.invoiceId).includes(q) || p.method.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <section className="min-h-full bg-[#FCFAF7] p-6 sm:p-8" style={{ fontFamily: "'Urbanist', sans-serif" }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#87A96B]">Admin</p>
            <h1 className="mt-1 text-2xl font-bold text-stone-800">Payments</h1>
          </div>
          <div className="rounded-xl border border-[#EAE5DA] bg-white px-4 py-3 text-right">
            <p className="text-xs text-stone-500">Total Collected</p>
            <p className="text-lg font-bold text-stone-800">{fmt(total)}</p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mb-4">
          <label className="flex items-center gap-2 rounded-xl border border-[#DDD6C6] bg-white px-3 py-2 text-stone-400 focus-within:border-[#87A96B] sm:max-w-xs">
            <Search size={16} />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, invoice, method" className="w-full bg-transparent text-sm text-stone-700 outline-none" />
          </label>
        </div>

        <div className="rounded-2xl border border-[#EAE5DA] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4F1E9] text-stone-600">
                <tr>
                  {["Payment ID", "Invoice ID", "Amount", "Method", "Date", "Note"].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DA]">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FCFAF7] transition">
                    <td className="px-5 py-4 font-semibold text-stone-800">PAY-{p.id}</td>
                    <td className="px-5 py-4 text-stone-600">#{p.invoiceId}</td>
                    <td className="px-5 py-4 font-semibold whitespace-nowrap">{fmt(p.amount)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-stone-600">
                        <CreditCard size={14} /> {p.method}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-stone-500 whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                    <td className="px-5 py-4 text-stone-500">{p.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <CreditCard size={28} className="mx-auto mb-3 text-stone-300" />
              <p className="text-sm text-stone-500">No payments found</p>
            </div>
          )}
        </div>
      </div>
    </section>
=======
import { useEffect, useState } from "react";
import ResourcePage from "../../components/ResourcePage.jsx";
import { getInvoices, getPayments, createPayment } from "../../services/invoiceService.js";
import useAuth from "../../hooks/useAuth.js";

export default function Payments() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    getInvoices()
      .then(setInvoices)
      .catch((requestError) => {
        setLookupError(
          requestError.response?.data?.message || "Unable to load invoices.",
        );
      });
  }, []);

  return (
    <>
      {lookupError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{lookupError}</p>}
      <ResourcePage
        title="Payments"
        load={getPayments}
        create={user?.role === "ADMIN" ? createPayment : undefined}
        columns={[
          { key: "id", label: "ID" },
          { key: "invoiceNumber", label: "Invoice" },
          { key: "customerName", label: "Customer" },
          { key: "method", label: "Method" },
          { key: "amount", label: "Amount" },
          { key: "paymentDate", label: "Date" },
        ]}
        fields={user?.role === "ADMIN" ? [
          { name: "invoiceId", label: "Invoice", options: invoices.map((invoice) => ({ value: invoice.id, label: `${invoice.invoiceNumber} — ${invoice.customerName}` })) },
          { name: "amount", label: "Amount", type: "number", step: "0.01" },
          { name: "method", label: "Method", options: ["CASH", "BANK_TRANSFER", "CARD", "UPI", "OTHER"].map((value) => ({ value, label: value })) },
          { name: "paymentDate", label: "Payment date", type: "date", required: false },
          { name: "note", label: "Note", required: false },
        ] : []}
      />
    </>
>>>>>>> 315d366 (done)
  );
}
