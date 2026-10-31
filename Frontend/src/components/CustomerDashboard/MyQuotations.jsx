import { useEffect, useMemo, useState } from "react";
import { FileText, Clock3, Search, Eye, X, CalendarDays } from "lucide-react";
import { invoiceService } from "../../services/invoiceService";

const fmt = (v) => `$${Number(v ?? 0).toFixed(2)}`;
const formatDate = (d) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const statusStyles = {
  QUOTATION: "bg-[#FFF2DE] text-[#A76614]",
};

export default function MyQuotations() {
  const [raw, setRaw] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    invoiceService.listMyQuotations()
      .then((r) => setRaw(r.data))
      .catch((e) => setLoadError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((s) =>
      s.subscriptionNumber.toLowerCase().includes(q) ||
      (s.items?.[0]?.productName ?? "").toLowerCase().includes(q)
    );
  }, [raw, search]);

  return (
    <div className="min-h-screen bg-[#FAF7F0] p-4 md:p-8 text-[#5A3E2B]">
      <div className="max-w-7xl mx-auto space-y-7">

        <div>
          <p className="text-sm font-semibold text-[#718E55] mb-2">CUSTOMER DASHBOARD</p>
          <h1 className="text-3xl md:text-4xl font-bold">My Quotations</h1>
          <p className="text-gray-500 mt-2">Quotation requests you have submitted. Our team will be in touch.</p>
        </div>

        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{loadError}</div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { title: "Total Quotations", value: raw.length, icon: FileText, bg: "bg-[#F2E9DF]" },
            { title: "Pending Response", value: raw.length, icon: Clock3, bg: "bg-[#FFF2DE]" },
          ].map(({ title, value, icon: Icon, bg }) => (
            <div key={title} className="bg-white border border-[#EAE5DC] rounded-2xl p-5">
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}><Icon size={21} className="text-[#5A3E2B]" /></div>
              <p className="text-sm text-gray-500">{title}</p>
              <h2 className="text-3xl font-bold text-[#5A3E2B] mt-2">{value}</h2>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#EAE5DC] rounded-2xl p-4">
          <div className="relative">
            <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quotation or product..." aria-label="Search quotations"
              className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#87A96B]" />
          </div>
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
                    Pending
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
                    <span className="flex items-center gap-2 text-gray-500"><CalendarDays size={15} /> Requested</span>
                    <span className="font-semibold">{formatDate(sub.startDate)}</span>
                  </div>
                  {sub.quotationValidUntil && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500"><Clock3 size={15} /> Valid Until</span>
                      <span className="font-semibold">{formatDate(sub.quotationValidUntil)}</span>
                    </div>
                  )}
                </div>

                <button onClick={() => setSelected(sub)}
                  className="mt-auto pt-5 w-full border border-[#5A3E2B] text-[#5A3E2B] py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#FAF7F0]">
                  <Eye size={16} /> View Details
                </button>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && !loadError && (
          <div className="bg-white border border-[#EAE5DC] rounded-2xl text-center py-16">
            <FileText size={32} className="text-gray-300 mx-auto" />
            <h3 className="font-bold mt-4">No quotations yet</h3>
            <p className="text-sm text-gray-500 mt-2">Click "Get Quote" on any product to request a quotation.</p>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-3 mb-5">
              <div>
                <p className="text-sm text-[#718E55] font-semibold">QUOTATION DETAILS</p>
                <h2 className="text-xl font-bold mt-1">{selected.subscriptionNumber}</h2>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close"><X size={22} /></button>
            </div>

            <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFF2DE] text-[#A76614]">
              Pending Response
            </span>

            <div className="space-y-3 mt-5 text-sm">
              {[
                ["Requested On", formatDate(selected.startDate)],
                ["Valid Until", formatDate(selected.quotationValidUntil)],
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

            <div className="mt-5 bg-[#E8EEDC] border border-[#C9D7BA] rounded-xl p-4 text-sm text-[#496A36]">
              Our team will review your request and get back to you within 2 business days.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
