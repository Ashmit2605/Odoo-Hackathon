import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard, CheckCircle2, XCircle, Wallet, Search, Eye, X,
  Receipt, ArrowRight, Clock3,
} from "lucide-react";
import { invoiceService } from "../../services/invoiceService";

const fmt = (amount) => `$${Number(amount ?? 0).toFixed(2)}`;

const formatDate = (date) =>
  date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const statusStyles = {
  SUCCESS: "bg-[#E8EEDC] text-[#496A36]",
  PENDING: "bg-[#FFF2DE] text-[#A76614]",
  FAILED: "bg-red-50 text-red-600",
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${statusStyles[status] || "bg-gray-100 text-gray-600"}`}>
      {status === "SUCCESS" ? "Successful" : status}
    </span>
  );
}

function SummaryCard({ title, value, icon: Icon, bg }) {
  return (
    <div className="bg-white border border-[#EAE5DC] rounded-2xl p-5">
      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
        <Icon size={21} className="text-[#5A3E2B]" />
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl md:text-3xl font-bold text-[#5A3E2B] mt-2">{value}</h2>
    </div>
  );
}

export default function PaymentHistory() {
  const [raw, setRaw] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    invoiceService.listMyPayments()
      .then((r) => setRaw(r.data))
      .catch((e) => setLoadError(e.message));
  }, []);

  // Backend payments always succeed when recorded; map to SUCCESS
  const payments = useMemo(() =>
    raw.map((p) => ({
      ...p,
      status: "SUCCESS",
      date: p.paymentDate,
    })), [raw]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      const matchSearch = !q || [p.invoiceNumber ?? "", String(p.id)].some((v) => v.toLowerCase().includes(q));
      const matchFilter = filter === "ALL" || p.status === filter;
      return matchSearch && matchFilter;
    });
  }, [payments, search, filter]);

  const successful = payments.filter((p) => p.status === "SUCCESS");

  const stats = [
    { title: "Total Transactions", value: payments.length, icon: CreditCard, bg: "bg-[#F2E9DF]" },
    { title: "Successful Payments", value: successful.length, icon: CheckCircle2, bg: "bg-[#E8EEDC]" },
    { title: "Total Paid", value: fmt(successful.reduce((s, p) => s + Number(p.amount), 0)), icon: Wallet, bg: "bg-[#E8EEDC]" },
    { title: "Failed Payments", value: payments.filter((p) => p.status === "FAILED").length, icon: XCircle, bg: "bg-red-50" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F0] p-4 md:p-8 text-[#5A3E2B]">
      <div className="max-w-7xl mx-auto space-y-7">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#718E55] mb-2">CUSTOMER DASHBOARD</p>
            <h1 className="text-3xl md:text-4xl font-bold">Payment History</h1>
            <p className="text-gray-500 mt-2">Track your subscription payments and transaction records.</p>
          </div>
          <Link to="/customer/invoices"
            className="inline-flex items-center justify-center gap-2 bg-[#5A3E2B] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#493120] transition">
            <Receipt size={18} /> My Invoices <ArrowRight size={16} />
          </Link>
        </div>

        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{loadError}</div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s) => <SummaryCard key={s.title} {...s} />)}
        </div>

        <div className="bg-white border border-[#EAE5DC] rounded-2xl p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payment ID or invoice..." aria-label="Search payments"
              className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#87A96B]" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter payments"
            className="border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-[#87A96B]">
            <option value="ALL">All Payments</option>
            <option value="SUCCESS">Successful</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div className="bg-white border border-[#EAE5DC] rounded-2xl overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#EAE5DC]">
            <h2 className="text-lg font-bold">Transaction Records</h2>
            <p className="text-sm text-gray-500 mt-1">{filtered.length} transaction(s) found</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F0]">
                <tr>
                  {["Payment ID", "Invoice", "Amount", "Date", "Method", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-4 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DC]">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FCFAF7] transition">
                    <td className="px-5 py-5 font-semibold">PAY-{p.id}</td>
                    <td className="px-5 py-5 text-gray-600">{p.invoiceNumber ?? `INV-${p.invoiceId}`}</td>
                    <td className="px-5 py-5 font-bold whitespace-nowrap">{fmt(p.amount)}</td>
                    <td className="px-5 py-5 text-gray-500 whitespace-nowrap">{formatDate(p.date)}</td>
                    <td className="px-5 py-5">
                      <span className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
                        <CreditCard size={16} /> {p.method}
                      </span>
                    </td>
                    <td className="px-5 py-5"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-5">
                      <button onClick={() => setSelected(p)} title="View" className="p-2 rounded-lg hover:bg-[#E8EEDC] transition">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <CreditCard size={34} className="text-gray-300 mx-auto" />
              <h3 className="font-bold mt-4">No payments found</h3>
              <p className="text-sm text-gray-500 mt-2">Try a different search or status filter.</p>
            </div>
          )}
        </div>

        <div className="bg-[#E8EEDC] border border-[#C9D7BA] rounded-2xl p-5 md:p-6 flex gap-4">
          <Clock3 size={23} className="text-[#496A36] shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-[#496A36]">Payment verification</h3>
            <p className="text-sm text-[#496A36] mt-2 leading-relaxed">
              Payments are recorded after you confirm payment on an invoice. Each payment settles the invoice immediately.
            </p>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-xl">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-sm font-semibold text-[#718E55]">TRANSACTION DETAILS</p>
                <h2 className="text-2xl font-bold mt-2">PAY-{selected.id}</h2>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close"><X size={22} /></button>
            </div>
            <div className="mt-5"><StatusBadge status={selected.status} /></div>
            <div className="bg-[#FAF7F0] rounded-xl p-5 mt-6">
              <p className="text-sm text-gray-500">Transaction Amount</p>
              <p className="text-3xl font-bold mt-2">{fmt(selected.amount)}</p>
            </div>
            <div className="space-y-4 mt-6">
              {[
                ["Invoice", selected.invoiceNumber ?? `INV-${selected.invoiceId}`],
                ["Payment Date", formatDate(selected.date)],
                ["Method", selected.method],
                ["Note", selected.note || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-gray-100 pb-3 text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-right break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
