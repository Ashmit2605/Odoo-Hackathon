import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { staffService } from "../../services/staffService";
import {
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  Modal,
  PageHeader,
  PageShell,
  Spinner,
  SuccessBanner,
  Table,
  ghostBtn,
  inputClass,
  primaryBtn,
} from "./ui.jsx";

const emptyForm = { name: "", email: "", phone: "", address: "" };

export default function StaffCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await staffService.listCustomers();
      setCustomers(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.email, c.phone, c.companyName].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [customers, query]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Only send fields that have a value
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim() !== ""));
      await staffService.createCustomer(payload);
      setSuccess("Customer created successfully.");
      setShowCreate(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.message || "Unable to create customer.");
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (customer) => {
    setSelected(customer);
    setDetailLoading(true);
    try {
      const fresh = await staffService.getCustomer(customer.id);
      if (fresh) setSelected(fresh);
    } catch (err) {
      setError(err.message || "Unable to load customer details.");
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <Spinner label="Loading customers" />;

  return (
    <PageShell>
      <PageHeader
        title="Customers"
        subtitle="View and manage customer records."
        action={
          <button type="button" className={primaryBtn} onClick={() => setShowCreate(true)}>
            <Plus size={18} /> Add Customer
          </button>
        }
      />
      <ErrorBanner message={error} onRetry={load} />
      <SuccessBanner message={success} />

      <Card>
        <div className="relative mb-5 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or phone"
            className={`${inputClass} pl-10`}
          />
        </div>

        <Table
          rows={filtered}
          empty={customers.length ? "No customers match your search." : "No customers yet. Add your first one."}
          columns={[
            { header: "ID", render: (c) => <span className="text-gray-400">#{c.id}</span> },
            { header: "Name", render: (c) => <span className="font-semibold">{c.name || c.companyName || "—"}</span> },
            { header: "Email", render: (c) => c.email || "—" },
            { header: "Phone", render: (c) => c.phone || "—" },
            {
              header: "",
              align: "right",
              render: (c) => (
                <button type="button" className={ghostBtn} onClick={() => openDetail(c)}>
                  View
                </button>
              ),
            },
          ]}
        />
      </Card>

      {showCreate && (
        <Modal title="Add Customer" onClose={() => setShowCreate(false)}>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Name">
              <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Address">
              <textarea rows={2} className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className={ghostBtn} onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className={primaryBtn} disabled={saving}>{saving ? "Saving…" : "Create Customer"}</button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title="Customer Details" onClose={() => setSelected(null)}>
          {detailLoading ? (
            <Spinner />
          ) : (
            <dl className="space-y-3 text-sm">
              {Object.entries(selected).length === 0 && <EmptyState message="No details available." />}
              {Object.entries(selected).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 border-b border-[#EAE5DC] pb-2 last:border-0">
                  <dt className="capitalize text-gray-500">{key.replace(/([A-Z])/g, " $1")}</dt>
                  <dd className="break-all text-right font-semibold">{value === null || value === "" ? "—" : String(value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </Modal>
      )}
    </PageShell>
  );
}