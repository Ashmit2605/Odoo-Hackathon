import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Wallet } from "lucide-react";
import { staffService } from "../../services/staffService";
import {
  Card,
  ErrorBanner,
  Field,
  PageHeader,
  PageShell,
  Spinner,
  StatusBadge,
  SuccessBanner,
  Table,
  formatCurrency,
  getPendingAmount,
  inputClass,
  primaryBtn,
} from "../../components/staff/ui";

const METHODS = ["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE"];

export default function StaffPayments() {
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({
    invoiceId: searchParams.get("invoiceId") || "",
    amount: "",
    method: "CASH",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await staffService.listInvoices();
      setInvoices(Array.isArray(data) ? data : []);
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

  const payable = useMemo(
    () => invoices.filter((i) => i.status === "CONFIRMED" && getPendingAmount(i) > 0),
    [invoices]
  );
  const selected = payable.find((i) => String(i.id) === String(form.invoiceId));

  const onInvoiceChange = (invoiceId) => {
    const invoice = payable.find((i) => String(i.id) === String(invoiceId));
    setForm({ ...form, invoiceId, amount: invoice ? String(getPendingAmount(invoice)) : "" });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const result = await staffService.recordPayment({
        invoiceId: Number(form.invoiceId),
        amount: Number(form.amount),
        method: form.method,
      });
      setHistory((h) => [
        {
          id: result.payment?.id ?? Date.now(),
          invoiceNumber: selected?.invoiceNumber,
          amount: form.amount,
          method: form.method,
          invoiceStatus: result.invoiceStatus,
        },
        ...h,
      ]);
      setSuccess(
        result.invoiceStatus === "PAID"
          ? "Payment recorded. The invoice is fully paid and its subscription is now active."
          : "Payment recorded. The invoice still has a balance due."
      );
      setForm({ invoiceId: "", amount: "", method: "CASH" });
      await load();
    } catch (err) {
      setError(err.message || "Unable to record payment.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading payments" />;

  return (
    <PageShell>
      <PageHeader title="Payments" subtitle="Record payments against invoices." />
      <ErrorBanner message={error} onRetry={load} />
      <SuccessBanner message={success} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Record Payment" subtitle="Only confirmed, unpaid invoices are listed" className="lg:col-span-1">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Invoice">
              <select required className={inputClass} value={form.invoiceId} onChange={(e) => onInvoiceChange(e.target.value)}>
                <option value="">Select an invoice</option>
                {payable.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.invoiceNumber} — {formatCurrency(getPendingAmount(i))} due
                  </option>
                ))}
              </select>
            </Field>
            {selected && (
              <p className="rounded-xl bg-[#FCFAF7] px-4 py-3 text-xs text-gray-500">
                Total {formatCurrency(selected.totalAmount)} · Paid {formatCurrency(selected.amountPaid)} · Balance{" "}
                <span className="font-semibold text-[#5A3E2B]">{formatCurrency(getPendingAmount(selected))}</span>
              </p>
            )}
            <Field label="Amount (INR)">
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                max={selected ? getPendingAmount(selected) : undefined}
                className={inputClass}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Method">
              <select className={inputClass} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {METHODS.map((m) => (
                  <option key={m} value={m}>{m.replaceAll("_", " ")}</option>
                ))}
              </select>
            </Field>
            <button type="submit" className={`${primaryBtn} w-full`} disabled={saving || !form.invoiceId}>
              <Wallet size={17} /> {saving ? "Recording…" : "Record Payment"}
            </button>
          </form>
        </Card>

        <Card title="Recorded This Session" subtitle="Payments you recorded from this page" className="lg:col-span-2">
          <Table
            rows={history}
            empty="Payments you record will appear here."
            columns={[
              { header: "Invoice", render: (p) => <span className="font-semibold">{p.invoiceNumber || "—"}</span> },
              { header: "Method", render: (p) => p.method.replaceAll("_", " ") },
              { header: "Amount", render: (p) => formatCurrency(p.amount) },
              { header: "Invoice Status", render: (p) => <StatusBadge status={p.invoiceStatus} /> },
            ]}
          />
        </Card>
      </div>
    </PageShell>
  );
}