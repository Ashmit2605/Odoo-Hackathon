import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FilePlus2 } from "lucide-react";
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
  formatDate,
  inputClass,
  primaryBtn,
} from "../../components/staff/ui";
import { addStoredQuotation, loadStoredQuotations } from "./staffQuotationStore";

const today = () => new Date().toISOString().slice(0, 10);

export default function StaffQuotations() {
  const [customers, setCustomers] = useState([]);
  const [recent, setRecent] = useState(loadStoredQuotations());
  const [form, setForm] = useState({ customerId: "", templateId: "", startDate: today() });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    staffService
      .listCustomers()
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Unable to load customers."));
  }, []);

  const customerLabel = (id) => {
    const customer = customers.find((c) => String(c.id) === String(id));
    return customer?.name || customer?.email || `Customer #${id}`;
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const created = await staffService.createQuotation({
        customerId: Number(form.customerId),
        templateId: Number(form.templateId),
        startDate: form.startDate || undefined,
      });
      setRecent(addStoredQuotation(created));
      setSuccess(`Quotation ${created.subscriptionNumber} created. Confirm it from the Subscriptions page.`);
      setForm({ customerId: "", templateId: "", startDate: today() });
    } catch (err) {
      setError(err.message || "Unable to create quotation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <PageHeader title="Quotations" subtitle="Create quotations from existing templates." />
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="New Quotation" subtitle="Pick a customer and a template" className="lg:col-span-1">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Customer">
              <select required className={inputClass} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">Select a customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name || c.email || `Customer #${c.id}`}</option>
                ))}
              </select>
            </Field>
            <Field label="Template ID">
              <input required type="number" min="1" className={inputClass} value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })} placeholder="e.g. 1" />
            </Field>
            <Field label="Start Date">
              <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <button type="submit" className={`${primaryBtn} w-full`} disabled={saving}>
              <FilePlus2 size={17} /> {saving ? "Creating…" : "Create Quotation"}
            </button>
          </form>
        </Card>

        <Card
          title="Recently Created"
          subtitle="Quotations created from this browser"
          className="lg:col-span-2"
          action={<Link to="/staff/subscriptions" className="text-sm font-semibold text-[#718E55] hover:text-[#5A3E2B]">Go to Subscriptions</Link>}
        >
          <Table
            rows={recent}
            empty="Quotations you create will appear here."
            columns={[
              { header: "Number", render: (q) => <span className="font-semibold">{q.subscriptionNumber}</span> },
              { header: "Customer", render: (q) => customerLabel(q.customerId) },
              { header: "Start", render: (q) => formatDate(q.startDate) },
              { header: "Status", render: (q) => <StatusBadge status={q.status} /> },
            ]}
          />
        </Card>
      </div>
    </PageShell>
  );
}