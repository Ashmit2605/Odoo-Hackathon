import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  LoaderCircle,
  Package,
  RefreshCw,
  Repeat,
  Users,
} from "lucide-react";
import { getStaffOverview } from "../../services/staffOverviewService.js";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const getStaffName = () => {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"
    );
    return user.name?.trim().split(/\s+/)[0] || "there";
  } catch {
    return "there";
  }
};

const invoiceStatusClass = {
  DRAFT: "bg-stone-100 text-stone-600",
  CONFIRMED: "bg-amber-50 text-amber-700",
  PAID: "bg-[#E8EEDC] text-[#496A36]",
  CANCELLED: "bg-red-50 text-red-600",
};

function MetricCard({ title, value, detail, icon: Icon, tone }) {
  return (
    <article className="rounded-2xl border border-[#EAE5DA] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">{title}</p>
          <p className="mt-3 text-2xl font-bold text-stone-800">{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-4 text-xs text-stone-400">{detail}</p>
    </article>
  );
}

function SectionHeader({ title, to, linkText = "View all" }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-stone-800">{title}</h2>
      <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-[#63894A] hover:text-[#496A36]">
        {linkText}<ArrowUpRight size={15} />
      </Link>
    </div>
  );
}

export default function StaffOverview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOverview(await getStaffOverview());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the staff dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getStaffOverview()
      .then((result) => {
        if (!cancelled) {
          setOverview(result);
          setError("");
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load the staff dashboard.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !overview) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#FCFAF7]">
        <LoaderCircle size={30} className="animate-spin text-[#87A96B]" />
        <span className="sr-only">Loading staff overview</span>
      </div>
    );
  }

  const metrics = overview?.metrics;

  return (
    <div className="min-h-full bg-[#FCFAF7] p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#63894A]">Staff overview</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-800">
              Welcome back, {getStaffName()}
            </h1>
            <p className="mt-2 text-sm text-stone-500">A live snapshot of customers, subscriptions, and billing.</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DDD6C6] bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-[#F4F1E9] disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="flex items-center gap-2"><AlertCircle size={17} />{error}</span>
            <button type="button" onClick={refresh} className="font-semibold underline">Try again</button>
          </div>
        )}

        {metrics && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Staff workspace metrics">
              <MetricCard title="Customers" value={metrics.totalCustomers} detail="Customer accounts in the workspace" icon={Users} tone="bg-[#87A96B]/10 text-[#63894A]" />
              <MetricCard title="Active subscriptions" value={metrics.activeSubscriptions} detail="Active and confirmed subscriptions" icon={Repeat} tone="bg-blue-50 text-blue-700" />
              <MetricCard title="Pending invoices" value={metrics.pendingInvoices} detail="Invoices awaiting payment" icon={FileText} tone="bg-amber-50 text-amber-700" />
              <MetricCard title="Overdue invoices" value={metrics.overdueInvoices} detail={`${formatCurrency(metrics.outstandingAmount)} outstanding`} icon={AlertCircle} tone="bg-red-50 text-red-600" />
              <MetricCard title="Payments received" value={formatCurrency(metrics.revenue)} detail="Recorded customer payments" icon={CreditCard} tone="bg-emerald-50 text-emerald-700" />
              <MetricCard title="Products" value={metrics.totalProducts} detail="Products available in catalog" icon={Package} tone="bg-violet-50 text-violet-700" />
              <MetricCard title="Invoices" value={metrics.totalInvoices} detail="Invoices issued" icon={FileText} tone="bg-orange-50 text-orange-700" />
              <MetricCard title="Workspace" value="Operational" detail={overview.dailySummary} icon={CalendarClock} tone="bg-[#F4F1E9] text-[#63894A]" />
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <div className="overflow-hidden rounded-2xl border border-[#EAE5DA] bg-white xl:col-span-2">
                <div className="p-5 md:p-6">
                  <SectionHeader title="Recent invoices" to="/staff/invoices" />
                  {overview.recentInvoices.length === 0 ? (
                    <p className="py-12 text-center text-sm text-stone-500">Invoices will appear here as they are created.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#EAE5DA] text-xs uppercase tracking-wide text-stone-400">
                            <th className="pb-3 pr-4 font-semibold">Invoice</th>
                            <th className="pb-3 pr-4 font-semibold">Customer</th>
                            <th className="pb-3 pr-4 font-semibold">Date</th>
                            <th className="pb-3 pr-4 font-semibold">Amount</th>
                            <th className="pb-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.recentInvoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b border-[#F1EEE6] last:border-0">
                              <td className="py-3.5 pr-4 font-semibold text-stone-700">{invoice.invoiceNumber}</td>
                              <td className="py-3.5 pr-4 text-stone-600">{invoice.customerName || "—"}</td>
                              <td className="py-3.5 pr-4 text-stone-500">{formatDate(invoice.invoiceDate)}</td>
                              <td className="py-3.5 pr-4 font-medium text-stone-700">{formatCurrency(invoice.totalAmount)}</td>
                              <td className="py-3.5">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${invoiceStatusClass[invoice.status] || "bg-stone-100 text-stone-600"}`}>
                                  {invoice.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#EAE5DA] bg-white p-5 md:p-6">
                <SectionHeader title="Recent customers" to="/staff/customers" />
                {overview.recentCustomers.length === 0 ? (
                  <p className="py-12 text-center text-sm text-stone-500">New customers will appear here.</p>
                ) : (
                  <div className="space-y-4">
                    {overview.recentCustomers.map((customer) => (
                      <div key={customer.id} className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#87A96B]/10 text-[#63894A]">
                          <Building2 size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-700">{customer.name}</p>
                          <p className="truncate text-xs text-stone-400">{customer.companyName || customer.email || "Customer"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#EAE5DA] bg-white p-5 md:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-stone-800">Quick access</h2>
                <p className="mt-1 text-sm text-stone-500">Common customer and billing workflows.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { title: "Customers", detail: "Review customer accounts", to: "/staff/customers", icon: Users },
                  { title: "Quotations", detail: "Manage customer offers", to: "/staff/quotations", icon: FileText },
                  { title: "Overdue invoices", detail: `${metrics.overdueInvoices} need attention`, to: "/staff/overdue", icon: AlertCircle },
                  { title: "Product catalog", detail: "Browse available products", to: "/staff/products", icon: Package },
                ].map(({ title, detail, to, icon: Icon }) => (
                  <Link key={to} to={to} className="group flex items-center gap-3 rounded-xl border border-[#EAE5DA] p-4 transition hover:border-[#C9D7BA] hover:bg-[#FCFAF7]">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F1E9] text-[#63894A]">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-stone-700">{title}</span>
                      <span className="mt-1 block truncate text-xs text-stone-400">{detail}</span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-[#63894A]" />
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
