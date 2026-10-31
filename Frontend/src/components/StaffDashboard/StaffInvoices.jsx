import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Mail, Printer } from "lucide-react";
import { staffService } from "../../services/staffService";
import {
  Card,
  ErrorBanner,
  PageHeader,
  PageShell,
  Spinner,
  StatusBadge,
  SuccessBanner,
  Table,
  darkBtn,
  formatCurrency,
  formatDate,
  getPendingAmount,
  ghostBtn,
} from "../../components/staff/ui";

const FILTERS = ["ALL", "DRAFT", "CONFIRMED", "PAID"];

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

const printInvoice = (invoice) => {
  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${escapeHtml(invoice.invoiceNumber)}</title>
    <style>
      body{font-family:system-ui,sans-serif;color:#5A3E2B;padding:40px}
      h1{margin:0 0 4px} table{width:100%;border-collapse:collapse;margin-top:24px}
      td{padding:10px 0;border-bottom:1px solid #EAE5DC} td:last-child{text-align:right;font-weight:600}
    </style></head><body>
    <h1>Invoice ${escapeHtml(invoice.invoiceNumber)}</h1>
    <p>Status: ${escapeHtml(invoice.status)}</p>
    <table>
      <tr><td>Invoice date</td><td>${escapeHtml(formatDate(invoice.invoiceDate))}</td></tr>
      <tr><td>Due date</td><td>${escapeHtml(formatDate(invoice.dueDate))}</td></tr>
      <tr><td>Total amount</td><td>${escapeHtml(formatCurrency(invoice.totalAmount))}</td></tr>
      <tr><td>Amount paid</td><td>${escapeHtml(formatCurrency(invoice.amountPaid))}</td></tr>
      <tr><td>Balance due</td><td>${escapeHtml(formatCurrency(getPendingAmount(invoice)))}</td></tr>
    </table></body></html>`);
  win.document.close();
  win.focus();
  win.print();
};

export default function StaffInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, cust] = await Promise.all([staffService.listInvoices(), staffService.listCustomers()]);
      setInvoices(Array.isArray(inv) ? inv : []);
      setCustomers(Array.isArray(cust) ? cust : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load invoices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const visible = filter === "ALL" ? invoices : invoices.filter((i) => i.status === filter);

  const confirm = async (invoice) => {
    setBusyId(invoice.id);
    setError("");
    setSuccess("");
    try {
      const updated = await staffService.confirmInvoice(invoice.id);
      if (!updated) throw new Error("Only draft invoices can be confirmed.");
      setInvoices((list) => list.map((i) => (i.id === invoice.id ? { ...i, ...updated } : i)));
      setSuccess(`Invoice ${invoice.invoiceNumber} confirmed.`);
    } catch (err) {
      setError(err.message || "Unable to confirm invoice.");
    } finally {
      setBusyId(null);
    }
  };

  // The API has no "send" endpoint yet, so this opens the staff member's mail app.
  const sendByEmail = (invoice) => {
    const email = customerById.get(invoice.customerId)?.email;
    const subject = `Invoice ${invoice.invoiceNumber}`;
    const body = `Hello,\n\nYour invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.totalAmount)} is due on ${formatDate(invoice.dueDate)}.\nBalance due: ${formatCurrency(getPendingAmount(invoice))}.\n\nThank you.`;
    window.location.href = `mailto:${email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) return <Spinner label="Loading invoices" />;

  return (
    <PageShell>
      <PageHeader title="Invoices" subtitle="View, confirm, send and print invoices." />
      <ErrorBanner message={error} onRetry={load} />
      <SuccessBanner message={success} />

      <Card
        action={
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  filter === f ? "bg-[#5A3E2B] text-white" : "border border-[#EAE5DC] hover:bg-[#FCFAF7]"
                }`}
              >
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        }
      >
        <Table
          rows={visible}
          empty="No invoices found."
          columns={[
            { header: "Invoice", render: (i) => <span className="font-semibold">{i.invoiceNumber}</span> },
            { header: "Customer", render: (i) => customerById.get(i.customerId)?.name || (i.customerId ? `#${i.customerId}` : "—") },
            { header: "Due", render: (i) => formatDate(i.dueDate) },
            { header: "Total", render: (i) => formatCurrency(i.totalAmount) },
            { header: "Balance", render: (i) => formatCurrency(getPendingAmount(i)) },
            { header: "Status", render: (i) => <StatusBadge status={i.status} /> },
            {
              header: "Actions",
              align: "right",
              render: (i) => (
                <div className="flex justify-end gap-2">
                  {i.status === "DRAFT" && (
                    <button type="button" className={darkBtn} disabled={busyId === i.id} onClick={() => confirm(i)}>
                      <CheckCircle2 size={15} /> {busyId === i.id ? "…" : "Confirm"}
                    </button>
                  )}
                  <button type="button" className={ghostBtn} onClick={() => sendByEmail(i)} title="Send by email">
                    <Mail size={15} />
                  </button>
                  <button type="button" className={ghostBtn} onClick={() => printInvoice(i)} title="Print">
                    <Printer size={15} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </PageShell>
  );
}