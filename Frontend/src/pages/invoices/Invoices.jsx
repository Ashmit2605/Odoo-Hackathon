<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { Search, Receipt, X } from "lucide-react";
import { invoiceService } from "../../services/invoiceService";

const fmt = (v) => `$${Number(v ?? 0).toFixed(2)}`;
const formatDate = (d) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const statusStyles = {
  DRAFT: "bg-gray-100 text-gray-600",
  CONFIRMED: "bg-[#FFF2DE] text-[#A76614]",
  PAID: "bg-[#E8EEDC] text-[#496A36]",
  CANCELLED: "bg-red-50 text-red-600",
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    invoiceService.listAll()
      .then((r) => setInvoices(r.data))
      .catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchSearch = !q || inv.invoiceNumber.toLowerCase().includes(q);
      const matchFilter = filter === "ALL" || inv.status === filter;
      return matchSearch && matchFilter;
    });
  }, [invoices, search, filter]);

  return (
    <section className="min-h-full bg-[#FCFAF7] p-6 sm:p-8" style={{ fontFamily: "'Urbanist', sans-serif" }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#87A96B]">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-stone-800">Invoices</h1>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-[#DDD6C6] bg-white px-3 py-2 text-stone-400 focus-within:border-[#87A96B] sm:max-w-xs">
            <Search size={16} />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number" className="w-full bg-transparent text-sm text-stone-700 outline-none" />
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-[#DDD6C6] bg-white px-3 py-2 text-sm text-stone-700 focus:border-[#87A96B] focus:outline-none">
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="rounded-2xl border border-[#EAE5DA] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4F1E9] text-stone-600">
                <tr>
                  {["Invoice #", "Customer", "Date", "Due", "Total", "Paid", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DA]">
                {filtered.map((inv) => (
                  <tr key={inv.id} onClick={() => setSelected(inv)}
                    className="hover:bg-[#FCFAF7] cursor-pointer transition">
                    <td className="px-5 py-4 font-semibold text-stone-800">{inv.invoiceNumber}</td>
                    <td className="px-5 py-4 text-stone-600">#{inv.customerId}</td>
                    <td className="px-5 py-4 text-stone-500 whitespace-nowrap">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-5 py-4 text-stone-500 whitespace-nowrap">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-4 font-semibold whitespace-nowrap">{fmt(inv.totalAmount)}</td>
                    <td className="px-5 py-4 whitespace-nowrap">{fmt(inv.amountPaid)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Receipt size={28} className="mx-auto mb-3 text-stone-300" />
              <p className="text-sm text-stone-500">No invoices found</p>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone-800">{selected.invoiceNumber}</h2>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["Customer ID", `#${selected.customerId}`],
                ["Invoice Date", formatDate(selected.invoiceDate)],
                ["Due Date", formatDate(selected.dueDate)],
                ["Subtotal", fmt(selected.subtotal)],
                ["Tax", fmt(selected.taxAmount)],
                ["Discount", fmt(selected.discountAmount)],
                ["Total", fmt(selected.totalAmount)],
                ["Amount Paid", fmt(selected.amountPaid)],
                ["Status", selected.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-stone-500">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
=======
import ResourcePage from "../../components/ResourcePage.jsx";
import { getInvoices } from "../../services/invoiceService.js";

const columns = [
  { key: "id", label: "ID" },
  { key: "invoiceNumber", label: "Invoice" },
  { key: "customerName", label: "Customer" },
  { key: "invoiceDate", label: "Date" },
  { key: "dueDate", label: "Due date" },
  { key: "totalAmount", label: "Total" },
  { key: "status", label: "Status" },
];

export default function Invoices() {
  return <ResourcePage title="Invoices" load={getInvoices} columns={columns} detailPath={(id) => `/invoices/${id}`} />;
>>>>>>> 315d366 (done)
}
