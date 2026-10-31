import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  LoaderCircle,
  Receipt,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import { invoiceService } from "../../services/invoiceService";

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

const getCustomerName = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    return user.name?.trim().split(/\s+/)[0] || "there";
  } catch {
    return "there";
  }
};

const getPendingAmount = (invoice) =>
  Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.amountPaid || 0));

const fetchOverviewData = async () => {
  const [subscriptions, quotations, invoices, payments] = await Promise.all([
    invoiceService.listMySubscriptions(),
    invoiceService.listMyQuotations(),
    invoiceService.listMine(),
    invoiceService.listMyPayments(),
  ]);
  return {
    subscriptions: subscriptions.data ?? [],
    quotations: quotations.data ?? [],
    invoices: invoices.data ?? [],
    payments: payments.data ?? [],
  };
};

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: "bg-[#E8EEDC] text-[#496A36]",
    CONFIRMED: "bg-[#E8EEDC] text-[#496A36]",
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

function StatCard({ title, value, description, icon: Icon, iconBg }) {
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
      <p className="mt-4 text-xs text-gray-400">{description}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle, to, linkText }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-[#5A3E2B]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="flex items-center gap-1 text-sm font-semibold text-[#718E55] transition hover:text-[#5A3E2B]">
          {linkText || "View All"}
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}

export default function CustomerOverview() {
  const [snapshot, setSnapshot] = useState({
    subscriptions: [],
    quotations: [],
    invoices: [],
    payments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      setSnapshot(await fetchOverviewData());
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchOverviewData()
      .then((result) => {
        if (!cancelled) {
          setSnapshot(result);
          setError("");
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load your dashboard.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(() => {
    const activeSubscriptions = snapshot.subscriptions.filter(
      (subscription) => ["ACTIVE", "CONFIRMED"].includes(subscription.status)
    );
    const pendingInvoices = snapshot.invoices.filter(
      (invoice) => !["PAID", "CANCELLED"].includes(invoice.status) && getPendingAmount(invoice) > 0
    );
    const nextRenewal = activeSubscriptions
      .map((subscription) => subscription.nextBillingDate)
      .filter((date) => date && date >= new Date().toISOString().slice(0, 10))
      .sort()[0] ?? null;

    const activities = [
      ...snapshot.payments.map((payment) => ({
        id: `payment-${payment.id}`,
        title: "Payment completed",
        description: `Payment for invoice ${payment.invoiceNumber}`,
        date: payment.paymentDate,
        type: "payment",
      })),
      ...snapshot.subscriptions.map((subscription) => ({
        id: `subscription-${subscription.id}`,
        title: `Subscription ${String(subscription.status).toLowerCase()}`,
        description: subscription.items?.[0]?.productName || subscription.subscriptionNumber,
        date: subscription.createdAt || subscription.startDate,
        type: "subscription",
      })),
      ...snapshot.quotations.map((quotation) => ({
        id: `quotation-${quotation.id}`,
        title: "Quotation received",
        description: quotation.items?.[0]?.productName || quotation.subscriptionNumber,
        date: quotation.createdAt || quotation.startDate,
        type: "quotation",
      })),
      ...snapshot.invoices.map((invoice) => ({
        id: `invoice-${invoice.id}`,
        title: `Invoice ${String(invoice.status).toLowerCase()}`,
        description: invoice.invoiceNumber,
        date: invoice.invoiceDate,
        type: "invoice",
      })),
    ]
      .filter((activity) => activity.date)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 5);

    return {
      activeSubscriptions,
      pendingInvoices,
      nextRenewal,
      pendingAmount: pendingInvoices.reduce((total, invoice) => total + getPendingAmount(invoice), 0),
      totalPaid: snapshot.payments.reduce((total, payment) => total + Number(payment.amount || 0), 0),
      activities,
    };
  }, [snapshot]);

  const stats = [
    {
      title: "Active Subscriptions",
      value: data.activeSubscriptions.length,
      description: "Currently active plans",
      icon: RefreshCcw,
      iconBg: "bg-[#E8EEDC]",
    },
    {
      title: "Pending Payments",
      value: formatCurrency(data.pendingAmount),
      description: "Amount awaiting payment",
      icon: Wallet,
      iconBg: "bg-[#FFF2DE]",
    },
    {
      title: "Next Renewal",
      value: formatDate(data.nextRenewal),
      description: "Upcoming billing date",
      icon: CalendarDays,
      iconBg: "bg-[#F2E9DF]",
    },
    {
      title: "Total Paid",
      value: formatCurrency(data.totalPaid),
      description: "Lifetime successful payments",
      icon: CheckCircle2,
      iconBg: "bg-[#E8EEDC]",
    },
  ];

  const activityIcons = {
    quotation: FileText,
    payment: CreditCard,
    subscription: RefreshCcw,
    invoice: Receipt,
  };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#FCFAF7] p-8">
        <LoaderCircle size={30} className="animate-spin text-[#87A96B]" />
        <span className="sr-only">Loading your dashboard</span>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FCFAF7] p-4 text-[#5A3E2B] md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#718E55]">CUSTOMER DASHBOARD</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Welcome back, {getCustomerName()}</h1>
            <p className="mt-2 text-gray-500">Here's what's happening with your subscriptions.</p>
          </div>
          <Link to="/customer/plans" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#87A96B] px-5 py-3 font-semibold text-[#14200F] transition hover:bg-[#76986a]">
            Explore Plans <ArrowRight size={18} />
          </Link>
        </div>

        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="flex items-center gap-2"><AlertCircle size={17} />{error}</span>
            <button type="button" onClick={loadOverview} className="font-semibold underline">Retry</button>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#EAE5DC] bg-white p-5 md:col-span-2 md:p-7">
            <SectionHeader title="My Subscriptions" subtitle="Your current subscription plans" to="/customer/subscriptions" />
            <div className="space-y-4">
              {data.activeSubscriptions.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">You don't have any active subscriptions yet.</p>
              ) : data.activeSubscriptions.slice(0, 3).map((subscription) => {
                const item = subscription.items?.[0];
                return (
                  <div key={subscription.id} className="rounded-xl border border-[#EAE5DC] p-4 md:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[#5A3E2B]">{item?.productName || subscription.subscriptionNumber}</h3>
                        <p className="mt-1 text-xs text-gray-400">{subscription.subscriptionNumber}</p>
                      </div>
                      <StatusBadge status={subscription.status} />
                    </div>
                    <div className="mt-5 flex flex-wrap justify-between gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Subscription value</p>
                        <p className="mt-1 font-semibold">{formatCurrency(item?.amount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Next Billing</p>
                        <p className="mt-1 font-semibold">{formatDate(subscription.nextBillingDate)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#EAE5DC] bg-white p-5 md:p-7">
            <SectionHeader title="Pending Invoices" subtitle="Payments that need your attention" to="/customer/invoices" />
            <div className="space-y-4">
              {data.pendingInvoices.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 size={30} className="mx-auto text-[#87A96B]" />
                  <p className="mt-3 text-sm text-gray-500">You're all caught up!</p>
                </div>
              ) : data.pendingInvoices.slice(0, 3).map((invoice) => (
                <div key={invoice.id} className="rounded-xl border border-[#EAE5DC] bg-[#FCFAF7] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{invoice.invoiceNumber}</span>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <p className="mt-3 text-2xl font-bold">{formatCurrency(getPendingAmount(invoice))}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Clock3 size={14} /> Due {formatDate(invoice.dueDate)}
                  </div>
                  <Link to="/customer/invoices" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5A3E2B] py-2.5 text-sm font-semibold text-white transition hover:bg-[#493120]">
                    <CreditCard size={16} /> View Invoice
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#EAE5DC] bg-white p-5 lg:col-span-2 md:p-7">
            <SectionHeader title="Recent Activity" subtitle="Latest updates on your account" />
            {data.activities.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">Your account activity will appear here.</p>
            ) : (
              <div className="divide-y divide-[#EAE5DC]">
                {data.activities.map((activity) => {
                  const Icon = activityIcons[activity.type] || AlertCircle;
                  return (
                    <div key={activity.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8EEDC]">
                        <Icon size={19} className="text-[#5A3E2B]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold">{activity.title}</h3>
                        <p className="mt-1 truncate text-xs text-gray-500">{activity.description}</p>
                      </div>
                      <span className="whitespace-nowrap text-xs text-gray-400">{formatDate(activity.date)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#EAE5DC] bg-white p-5 md:p-7">
            <SectionHeader title="Quick Actions" />
            <div className="space-y-3">
              {[
                { label: "Browse Plans", description: "Find a subscription", to: "/customer/plans", icon: RefreshCcw },
                { label: "My Quotations", description: "Review your quotations", to: "/customer/quotations", icon: FileText },
                { label: "My Invoices", description: "Review outstanding bills", to: "/customer/invoices", icon: Receipt },
                { label: "Payment History", description: "View your transactions", to: "/customer/payments", icon: CreditCard },
              ].map(({ label, description, to, icon: Icon }) => (
                <Link key={label} to={to} className="flex items-center gap-3 rounded-xl border border-[#EAE5DC] p-3 transition hover:bg-[#FCFAF7]">
                  <div className="rounded-lg bg-[#E8EEDC] p-2.5"><Icon size={18} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="mt-1 text-xs text-gray-400">{description}</p>
                  </div>
                  <ArrowUpRight size={17} className="text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
