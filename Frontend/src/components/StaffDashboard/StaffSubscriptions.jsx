import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { staffService } from "../../services/staffService";
import {
  Card,
  ErrorBanner,
  Field,
  PageHeader,
  PageShell,
  StatusBadge,
  SuccessBanner,
  Table,
  darkBtn,
  formatDate,
  inputClass,
  primaryBtn,
} from "../../components/staff/ui";
import { loadStoredQuotations, updateStoredQuotation } from "./staffQuotationStore";

export default function StaffSubscriptions() {
  const [items, setItems] = useState(loadStoredQuotations());
  const [manualId, setManualId] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const confirm = async (id) => {
    setBusyId(id);
    setError("");
    setSuccess("");
    try {
      const updated = await staffService.confirmSubscription(id);
      if (!updated) {
        throw new Error("Nothing was confirmed. It may already be confirmed or is not awaiting payment.");
      }
      setItems(updateStoredQuotation(updated.id, updated));
      setSuccess(`Subscription ${updated.subscriptionNumber || `#${id}`} confirmed.`);
    } catch (err) {
      setError(err.message || "Unable to confirm subscription.");
    } finally {
      setBusyId(null);
    }
  };

  const submitManual = (event) => {
    event.preventDefault();
    if (manualId) confirm(Number(manualId));
  };

  return (
    <PageShell>
      <PageHeader title="Subscriptions" subtitle="Confirm and monitor subscriptions." />
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <Card title="Awaiting Confirmation" subtitle="Quotations created from this browser">
        <Table
          rows={items}
          empty="No quotations yet. Create one from the Quotations page."
          columns={[
            { header: "Number", render: (s) => <span className="font-semibold">{s.subscriptionNumber}</span> },
            { header: "Customer", render: (s) => `#${s.customerId}` },
            { header: "Start", render: (s) => formatDate(s.startDate) },
            { header: "Next Billing", render: (s) => formatDate(s.nextBillingDate) },
            { header: "Status", render: (s) => <StatusBadge status={s.status} /> },
            {
              header: "",
              align: "right",
              render: (s) =>
                s.status === "PENDING_PAYMENT" ? (
                  <button type="button" className={darkBtn} disabled={busyId === s.id} onClick={() => confirm(s.id)}>
                    <CheckCircle2 size={16} /> {busyId === s.id ? "Confirming…" : "Confirm"}
                  </button>
                ) : null,
            },
          ]}
        />
      </Card>

      <Card title="Confirm by ID" subtitle="For subscriptions not created in this browser">
        <form onSubmit={submitManual} className="flex max-w-md flex-wrap items-end gap-3">
          <div className="flex-1">
            <Field label="Subscription ID">
              <input type="number" min="1" required className={inputClass} value={manualId} onChange={(e) => setManualId(e.target.value)} />
            </Field>
          </div>
          <button type="submit" className={primaryBtn} disabled={busyId !== null}>Confirm</button>
        </form>
        <p className="mt-4 text-xs text-gray-400">
          Subscriptions become active automatically once their invoice is fully paid.
        </p>
      </Card>
    </PageShell>
  );
}