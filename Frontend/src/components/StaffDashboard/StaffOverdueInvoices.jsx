import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Mail, Wallet } from "lucide-react";
import { staffService } from "../../services/staffService";
import {
  Card,
  ErrorBanner,
  PageHeader,
  PageShell,
  Spinner,
  StatCard,
  StatusBadge,
  Table,
  darkBtn,
  formatCurrency,
  formatDate,
  getPendingAmount,
  ghostBtn,
} from "../../components/staff/ui";

const daysOverdue = (dueDate) => {
  if (!dueDate) return 0;
  const due = new Date(`${String(dueDate).slice(0, 10)}T00:00:00`);
  return Math.max(0, Math.floor((Date.now() - due.getTime()) / 86400000));
};

export default function StaffOverdueInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, cust] = await Promise.all([staffService.listOverdueInvoices(), staffService.listCustomers()]);
      setInvoices(Array.isArray(inv) ? inv : []);
      setCustomers(Array.isArray(cust) ? cust : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load overdue invoices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const total = invoices.reduce((sum, i) => sum + getPendingAmount(i), 0);
  const sorted = useMemo(() => [...invoices].sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate))), [invoices]);

  // The API has no reminder endpoint yet, so this opens the staff member's mail app.
  const remind = (invoice) => {
    const email = customerById.get(invoice.customerId)?.email;
    const subject = `Payment reminder: invoice ${invoice.invoiceNumber}`;
    const body = `Hello,\n\nThis is a reminder that invoice ${invoice.invoiceNumber} was due on ${formatDate(invoice.dueDate)} and ${formatCurrency(getPendingAmount(invoice))} is still outstanding.\n\nPlease arrange payment at your earliest convenience.\n\nThank you.`;
    window.location.href = `mailto:${email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) return <Spinner label="Loading overdue invoices" />;

  return (
    <PageShell>
      <PageHeader title="Overdue Invoices" subtitle="Identify and follow up on unpaid invoices." />
      <ErrorBanner message={error} onRetry={load} />

      <div className="grid gap-5 sm:grid-cols-2">
        <StatCard title="Overdue Invoices" value={invoices.length} description="Past due and unpaid" icon={AlertTriangle} iconBg="bg-red-50" />
        <StatCard title="Total Outstanding" value={formatCurrency(total)} description="Amount to collect" icon={Wallet} iconBg="bg-[#FFF2DE]" />
      </div>

      <Card title="Follow-up List" subtitle="Oldest due date first">
        <Table
          rows={sorted}
          empty="No overdue invoices. Everything is up to date!"
          columns={[
            { header: "Invoice", render: (i) => <span className="font-semibold">{i.invoiceNumber}</span> },
            { header: "Customer", render: (i) => customerById.get(i.customerId)?.name || (i.customerId ? `#${i.customerId}` : "—") },
            { header: "Due", render: (i) => formatDate(i.dueDate) },
            { header: "Days Late", render: (i) => <span className="font-semibold text-red-600">{daysOverdue(i.dueDate)}</span> },
            { header: "Status", render: () => <StatusBadge status="OVERDUE" /> },
            { header: "Pending", align: "right", render: (i) => <span className="font-semibold">{formatCurrency(getPendingAmount(i))}</span> },
            {
              header: "Actions",
              align: "right",
              render: (i) => (
                <div className="flex justify-end gap-2">
                  <button type="button" className={ghostBtn} onClick={() => remind(i)} title="Send reminder">
                    <Mail size={15} /> Remind
                  </button>
                  <Link to={`/staff/payments?invoiceId=${i.id}`} className={darkBtn}>
                    <Wallet size={15} /> Record
                  </Link>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </PageShell>
  );
}