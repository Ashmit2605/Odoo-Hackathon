import { useEffect, useMemo, useState } from "react";
import {
  Search, RefreshCcw, CheckCircle2, PauseCircle, XCircle,
  CalendarDays, Package, Eye, X,
} from "lucide-react";
import { invoiceService } from "../../services/invoiceService";

const fmt = (v) => `$${Number(v ?? 0).toFixed(2)}`;
const formatDate = (d) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const statusStyles = {
  ACTIVE: "bg-[#E8EEDC] text-[#496A36]",
  CONFIRMED: "bg-[#E8EEDC] text-[#496A36]",
  PAUSED: "bg-amber-50 text-amber-700",
  CLOSED: "bg-gray-100 text-gray-600",
  DRAFT: "bg-gray-100 text-gray-600",
};

export default function MySubscriptions() {
  const [raw, setRaw] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    invoiceService.listMySubscriptions()
      .then((r) => setRaw(r.data))
      .catch((e) => setLoadError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return raw.filter((s) => {
      const matchSearch = !q || s.subscriptionNumber.toLowerCase().includes(q) ||
        (s.items?.[0]?.productName ?? "").toLowerCase().includes(q);
      const matchFilter = filter === "ALL" || s.status === filter;
      return matchSearch && matchFilter;
    });
  }, [raw, search, filter]);

  const counts = {
    total: raw.length,
    active: raw.filter((s) => ["ACTIVE", "CONFIRMED"].includes(s.status)).length,
    paused: raw.filter((s) => s.status === "PAUSED").length,
    closed: raw.filter((s) => s.status === "CLOSED").length,
  };

  const summaryCards = [
    { title: "Total", value: counts.total, icon: RefreshCcw, bg: "bg-[#F2E9DF]" },
    { title: "Active", value: counts.active, icon: CheckCircle2, bg: "bg-[#E8EEDC]" },
    { title: "Paused", value: counts.paused, icon: PauseCircle, bg: "bg-[#FFF2DE]" },
    { title: "Closed", value: counts.closed, icon: XCircle, bg: "bg-gray-100" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F0] p-4 md:p-8 text-[#5A3E2B]">
      <div className="max-w-7xl mx-auto space-y-7">

        <div>
          <p className="text-sm font-semibold text-[#718E55] mb-2">CUSTOMER DASHBOARD</p>
          <h1 className="text-3xl md:text-4xl font-bold">My Subscriptions</h1>
          <p className="text-gray-500 mt-2">Products you have purchased.</p>
        </div>

        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{loadError}</div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map(({ title, value, icon: Icon, bg }) => (
            <div key={title} className="bg-white border border-[#EAE5DC] rounded-2xl p-5">
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}><Icon size={21} /></div>
              <p className="text-sm text-gray-500">{title}</p>
              <h2 className="text-3xl font-bold mt-2">{value}</h2>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#EAE5DC] rounded-2xl p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subscription or product..." aria-label="Search subscriptions"
              className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#87A96B]" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter"
            className="border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-[#87A96B]">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((sub) => {
            const item = sub.items?.[0];
            return (
              <div key={sub.id} className="bg-white border border-[#EAE5DC] rounded-2xl p-6 flex flex-col">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-xs text-gray-400">{sub.subscriptionNumber}</p>
                    <h3 className="text-lg font-bold mt-1">{item?.productName ?? "Product"}</h3>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusStyles[sub.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {sub.status}
                  </span>
                </div>

                {item && (
                  <div className="mt-4">
                    <span className="text-2xl font-bold">{fmt(item.amount)}</span>
                    <span className="text-sm text-gray-400 ml-1">× {item.quantity}</span>
                  </div>
                )}

                <div className="border-t border-[#EAE5DC] mt-5 pt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-500"><CalendarDays size={15} /> Started</span>
                    <span className="font-semibold">{formatDate(sub.startDate)}</span>
                  </div>
                  {sub.nextBillingDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500"><Package size={15} /> Next Billing</span>
                      <span className="font-semibold">{formatDate(sub.nextBillingDate)}</span>
                    </div>
                  )}
                </div>

                <button onClick={() => setSelected(sub)}
                  className="mt-auto pt-5 w-full border border-[#5A3E2B] text-[#5A3E2B] py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#FAF7F0]">
                  <Eye size={16} /> Details
                </button>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && !loadError && (
          <div className="bg-white border border-[#EAE5DC] rounded-2xl py-16 text-center">
            <RefreshCcw size={32} className="text-gray-300 mx-auto" />
            <h3 className="font-bold mt-4">No subscriptions yet</h3>
            <p className="text-gray-500 text-sm mt-2">Purchase a product from the catalog to get started.</p>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">Subscription Details</h2>
              <button onClick={() => setSelected(null)}><X size={22} /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["Subscription #", selected.subscriptionNumber],
                ["Status", selected.status],
                ["Start Date", formatDate(selected.startDate)],
                ["Expiry Date", formatDate(selected.expiryDate)],
                ["Next Billing", formatDate(selected.nextBillingDate)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold">{value}</span>
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
          </div>
        </div>
      )}
    </div>
  );
}
