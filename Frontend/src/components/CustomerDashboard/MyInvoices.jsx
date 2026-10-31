import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Receipt, Wallet, CheckCircle2, AlertCircle, Search, Eye,
  Download, CreditCard, X, CalendarDays, ArrowRight,
} from "lucide-react";
import { invoiceService } from "../../services/invoiceService";

const fmt = (amount) => `$${Number(amount ?? 0).toFixed(2)}`;

const formatDate = (date) =>
  date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const normalizeStatus = (s) => {
  if (s === "PAID") return "PAID";
  if (s === "CANCELLED") return "VOID";
  return "UNPAID";
};

const statusStyles = {
  PAID: "bg-[#E8EEDC] text-[#496A36]",
  UNPAID: "bg-[#FFF2DE] text-[#A76614]",
  OVERDUE: "bg-red-50 text-red-600",
  VOID: "bg-gray-100 text-gray-600",
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
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

export default function MyInvoices() {
  const [raw, setRaw] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [notice, setNotice] = useState("");
  const [paying, setPaying] = useState(false);

  const load = () =>
    invoiceService.listMine()
      .then((r) => setRaw(r.data))
      .catch((e) => setLoadError(e.message));

  useEffect(() => { load(); }, []);

  const invoices = useMemo(() =>
    raw.map((inv) => ({
      _id: inv.id,
      id: inv.invoiceNumber,
      amount: Number(inv.totalAmount),
      issuedDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      status: normalizeStatus(inv.status),
      items: inv.items ?? [],
    })), [raw]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchSearch = !q || inv.id.toLowerCase().includes(q);
      const matchFilter = filter === "ALL" || inv.status === filter;
      return matchSearch && matchFilter;
    });
  }, [invoices, search, filter]);

  const pending = invoices.filter((i) => ["UNPAID", "OVERDUE"].includes(i.status));

  const stats = [
    { title: "Total Invoices", value: invoices.length, icon: Receipt, bg: "bg-[#F2E9DF]" },
    { title: "Paid Invoices", value: invoices.filter((i) => i.status === "PAID").length, icon: CheckCircle2, bg: "bg-[#E8EEDC]" },
    { title: "Outstanding Amount", value: fmt(pending.reduce((s, i) => s + i.amount, 0)), icon: Wallet, bg: "bg-[#FFF2DE]" },
    { title: "Overdue Invoices", value: invoices.filter((i) => i.status === "OVERDUE").length, icon: AlertCircle, bg: "bg-red-50" },
  ];

  const handlePayment = async () => {
    if (!paymentTarget) return;
    setPaying(true);
    try {
      await invoiceService.pay(paymentTarget._id, "CARD");
      setNotice(`Payment successful for ${paymentTarget.id}.`);
      setPaymentTarget(null);
      load();
    } catch (e) {
      setNotice(`Payment failed: ${e.message}`);
      setPaymentTarget(null);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] p-4 md:p-8 text-[#5A3E2B]">
      <div className="max-w-7xl mx-auto space-y-7">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#718E55] mb-2">CUSTOMER DASHBOARD</p>
            <h1 className="text-3xl md:text-4xl font-bold">My Invoices</h1>
            <p className="text-gray-500 mt-2">View invoices, track due dates, and manage payments.</p>
          </div>
          <Link to="/customer/payments"
            className="inline-flex items-center justify-center gap-2 bg-[#5A3E2B] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#493120] transition">
            <CreditCard size={18} /> Payment History <ArrowRight size={16} />
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
              placeholder="Search invoice ID..." aria-label="Search invoices"
              className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#87A96B]" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter invoices"
            className="border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-[#87A96B]">
            <option value="ALL">All Invoices</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="VOID">Void</option>
          </select>
        </div>

        {notice && (
          <div role="status" className="bg-[#E8EEDC] border border-[#C9D7BA] rounded-xl px-5 py-4 flex justify-between gap-3 text-sm">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Dismiss"><X size={18} /></button>
          </div>
        )}

        <div className="bg-white border border-[#EAE5DC] rounded-2xl overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#EAE5DC]">
            <h2 className="text-lg font-bold">Invoice Records</h2>
            <p className="text-sm text-gray-500 mt-1">{filtered.length} invoice(s) found</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F0] text-[#5A3E2B]">
                <tr>
                  {["Invoice", "Amount", "Issued", "Due Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-4 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DC]">
                {filtered.map((inv) => (
                  <tr key={inv._id} className="hover:bg-[#FCFAF7] transition">
                    <td className="px-5 py-5 font-semibold">{inv.id}</td>
                    <td className="px-5 py-5 font-bold whitespace-nowrap">{fmt(inv.amount)}</td>
                    <td className="px-5 py-5 text-gray-500 whitespace-nowrap">{formatDate(inv.issuedDate)}</td>
                    <td className="px-5 py-5 text-gray-500 whitespace-nowrap">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-5"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(inv)} title="View" className="p-2 rounded-lg hover:bg-[#E8EEDC] transition">
                          <Eye size={18} />
                        </button>
                        {["UNPAID", "OVERDUE"].includes(inv.status) && (
                          <button onClick={() => setPaymentTarget(inv)}
                            className="bg-[#D5851F] text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#BD741A] whitespace-nowrap">
                            Pay Now
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Receipt size={34} className="text-gray-300 mx-auto" />
              <h3 className="font-bold mt-4">No invoices found</h3>
              <p className="text-sm text-gray-500 mt-2">Try another search or filter.</p>
            </div>
          )}
        </div>

        <div className="bg-[#E8EEDC] border border-[#C9D7BA] rounded-2xl p-5 md:p-6 flex items-start gap-4">
          <CalendarDays size={23} className="text-[#496A36] shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-[#496A36]">How billing works</h3>
            <p className="text-sm text-[#496A36] mt-2 leading-relaxed">
              Invoices are created when you purchase a product or request a quotation. Pay outstanding invoices using the Pay Now button.
            </p>
          </div>
        </div>
      </div>

      {/* Invoice detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-sm font-semibold text-[#718E55]">INVOICE DETAILS</p>
                <h2 className="text-2xl font-bold mt-2">{selected.id}</h2>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close"><X size={22} /></button>
            </div>
            <div className="mt-5"><StatusBadge status={selected.status} /></div>
            <div className="bg-[#FAF7F0] border border-[#EAE5DC] rounded-xl p-5 mt-6">
              <p className="text-sm text-gray-500">Invoice Amount</p>
              <p className="text-3xl font-bold mt-2">{fmt(selected.amount)}</p>
            </div>
            <div className="space-y-4 mt-6">
              {[["Issue Date", formatDate(selected.issuedDate)], ["Due Date", formatDate(selected.dueDate)], ["Status", selected.status]].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-gray-100 pb-3 text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-right">{value}</span>
                </div>
              ))}
            </div>
            {selected.items?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Items</p>
                {selected.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100">
                    <span>{item.productName} × {item.quantity}</span>
                    <span className="font-semibold">{fmt(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            {["UNPAID", "OVERDUE"].includes(selected.status) && (
              <button onClick={() => { setPaymentTarget(selected); setSelected(null); }}
                className="w-full mt-6 bg-[#D5851F] text-white rounded-xl py-3 font-semibold flex justify-center items-center gap-2">
                <CreditCard size={17} /> Pay Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payment confirmation modal */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-2xl w-full max-w-md p-7 shadow-xl">
            <div className="flex justify-between items-center gap-3">
              <h2 className="text-xl font-bold">Pay Invoice</h2>
              <button onClick={() => setPaymentTarget(null)} aria-label="Close"><X size={21} /></button>
            </div>
            <div className="bg-[#FAF7F0] rounded-xl p-5 mt-6">
              <p className="text-sm text-gray-500">{paymentTarget.id}</p>
              <p className="text-3xl font-bold mt-4">{fmt(paymentTarget.amount)}</p>
            </div>
            <div className="flex gap-3 mt-7">
              <button onClick={() => setPaymentTarget(null)}
                className="flex-1 border border-gray-200 rounded-xl py-3 font-semibold">Cancel</button>
              <button onClick={handlePayment} disabled={paying}
                className="flex-1 bg-[#87A96B] text-white rounded-xl py-3 font-semibold hover:bg-[#718E55] disabled:opacity-50">
                {paying ? "Processing…" : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
