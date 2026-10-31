import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AlertCircle, Building2, Mail, Phone, RefreshCw, Search, Users } from "lucide-react";
import { getCustomers } from "../../services/customerService.js";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

export default function Customers() {
  const location = useLocation();
  const role = location.pathname.startsWith("/admin") ? "ADMIN" : "STAFF";
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCustomers(await getCustomers(role));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    let cancelled = false;
    getCustomers(role)
      .then((result) => {
        if (!cancelled) {
          setCustomers(result);
          setError("");
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load customers.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  const filteredCustomers = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.companyName, customer.address]
        .some((value) => String(value ?? "").toLocaleLowerCase().includes(term))
    );
  }, [customers, query]);

  return (
    <div className="min-h-full bg-[#FCFAF7] p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#63894A]">Customer directory</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-800">Customers</h1>
            <p className="mt-2 text-sm text-stone-500">View customer records currently stored in the workspace.</p>
          </div>
          <button
            type="button"
            onClick={loadCustomers}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DDD6C6] bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-[#F4F1E9] disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="flex items-center gap-4 rounded-2xl border border-[#EAE5DA] bg-white p-5 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#87A96B]/10 text-[#63894A]">
              <Users size={20} />
            </span>
            <div>
              <p className="text-sm text-stone-500">Total customers</p>
              <p className="mt-1 text-2xl font-bold text-stone-800">{customers.length}</p>
            </div>
          </article>
          <label className="flex items-center gap-3 rounded-2xl border border-[#EAE5DA] bg-white px-4 py-3 shadow-sm focus-within:border-[#87A96B]">
            <Search size={18} className="shrink-0 text-stone-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, phone, or company"
              aria-label="Search customers"
              className="w-full bg-transparent text-sm text-stone-700 outline-none placeholder:text-stone-400"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="flex items-center gap-2"><AlertCircle size={17} />{error}</span>
            <button type="button" onClick={loadCustomers} className="font-semibold underline">Retry</button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-[#EAE5DA] bg-white shadow-sm">
          {loading && customers.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-stone-500">Loading customers…</div>
          ) : !error && filteredCustomers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users size={30} className="mx-auto mb-3 text-[#87A96B]" />
              <p className="font-semibold text-stone-700">
                {customers.length ? "No matching customers" : "No customers found"}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {customers.length ? "Try a different search." : "Customer records will appear here when available."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-[#F4F1E9] text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Customer</th>
                    <th className="px-5 py-3.5 font-semibold">Company</th>
                    <th className="px-5 py-3.5 font-semibold">Email</th>
                    <th className="px-5 py-3.5 font-semibold">Phone</th>
                    <th className="px-5 py-3.5 font-semibold">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-t border-[#F1EEE6] hover:bg-[#FCFAF7]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#87A96B]/10 text-[#63894A]">
                            <Users size={16} />
                          </span>
                          <div>
                            <p className="font-semibold text-stone-800">{customer.name || "Unnamed customer"}</p>
                            <p className="text-xs text-stone-400">Customer #{customer.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-stone-600">
                        {customer.companyName ? (
                          <span className="inline-flex items-center gap-2"><Building2 size={15} className="text-stone-400" />{customer.companyName}</span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4 text-stone-600">
                        {customer.email ? (
                          <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-2 hover:text-[#63894A]">
                            <Mail size={15} className="text-stone-400" />{customer.email}
                          </a>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4 text-stone-600">
                        {customer.phone ? (
                          <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-2 hover:text-[#63894A]">
                            <Phone size={15} className="text-stone-400" />{customer.phone}
                          </a>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4 text-stone-500">{formatDate(customer.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !error && customers.length > 0 && (
            <div className="border-t border-[#EAE5DA] px-5 py-3 text-xs text-stone-400">
              Showing {filteredCustomers.length} of {customers.length} customers
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
