<<<<<<< HEAD
import { useState, useEffect, useCallback } from "react";
import { Plus, X, Eye, Pencil, Trash2, ChevronDown, ChevronUp, Tag, Percent, Package, DollarSign, AlertCircle, Loader2 } from "lucide-react";
import { productService } from "../../services/productService";

/* ── shared style tokens ── */
const S = {
  label: "block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1",
  input: "w-full rounded-lg border border-[#DDD6C6] bg-white px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:border-[#87A96B] focus:outline-none focus:ring-2 focus:ring-[#87A96B]/20",
  section: "rounded-xl border border-[#EAE5DA] bg-white p-5",
  sectionTitle: "flex items-center gap-2 text-sm font-semibold text-stone-700 mb-4",
  badge: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
};

const PRODUCT_TYPES = ["Storable Product", "Consumable", "Service", "Digital"];

const emptyForm = () => ({
  name: "", productType: "", salesPrice: "", costPrice: "", notes: "",
  taxRate: { name: "", percentage: "" },
  variants: [],
  discounts: [],
});

const emptyDiscount = () => ({
  name: "",
  type: "PERCENTAGE",
  value: "",
  appliesTo: "PRODUCT",
  minPurchase: "0",
  minQuantity: "1",
  validFrom: "",
  validUntil: "",
  usageLimit: "",
  usageCount: "0",
  isActive: true,
});

const getLoadErrorMessage = (error) => {
  if (error instanceof TypeError) {
    return "Unable to connect to the product API. Start the backend and check VITE_API_URL.";
  }
  return error instanceof Error ? error.message : "Unable to load products.";
};

/* ── collapsible section ── */
function Collapsible({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={S.section}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between">
        <span className={S.sectionTitle}>
          <Icon size={16} className="text-[#87A96B]" />
          {title}
        </span>
        {open ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
      </button>
      {open && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );
}

/* ── dynamic row list ── */
function RowList({ rows, onChange, onAdd, onRemove, fields }) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          {fields.map((f) =>
            f.type === "select" ? (
              <select key={f.key} value={row[f.key]} onChange={(e) => onChange(i, f.key, e.target.value)}
                className={`${S.input} flex-1`}>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input key={f.key} type={f.inputType || "text"} placeholder={f.placeholder}
                value={row[f.key]} onChange={(e) => onChange(i, f.key, e.target.value)}
                className={`${S.input} flex-1`} />
            )
          )}
          <button type="button" onClick={() => onRemove(i)} className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500">
            <X size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={onAdd}
        className="flex items-center gap-1.5 text-xs font-medium text-[#87A96B] hover:underline">
        <Plus size={13} /> Add row
      </button>
    </div>
  );
}

function DiscountRuleForm({ discount, index, onChange, onRemove }) {
  const field = (key, label, type = "text", props = {}) => (
    <label className="block" key={key}>
      <span className={S.label}>{label}</span>
      <input
        type={type}
        value={discount[key]}
        onChange={(event) => onChange(index, key, event.target.value)}
        className={S.input}
        {...props}
      />
    </label>
  );

  return (
    <div className="space-y-4 rounded-xl border border-[#EAE5DA] bg-[#FCFAF7] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-700">
          Discount rule {index + 1}
        </h3>
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label={`Remove discount rule ${index + 1}`}
          className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500"
        >
          <X size={15} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {field("name", "Name", "text", { maxLength: 150, required: true })}
        <label className="block">
          <span className={S.label}>Type</span>
          <select
            value={discount.type}
            onChange={(event) => onChange(index, "type", event.target.value)}
            className={S.input}
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed amount</option>
          </select>
        </label>
        {field("value", discount.type === "PERCENTAGE" ? "Value (%)" : "Value", "number", {
          min: 0,
          max: discount.type === "PERCENTAGE" ? 100 : undefined,
          step: "0.01",
          required: true,
        })}
        <label className="block">
          <span className={S.label}>Applies to</span>
          <input value="Product" readOnly className={`${S.input} bg-[#F4F1E9]`} />
          <input type="hidden" value="PRODUCT" />
        </label>
        {field("minPurchase", "Minimum purchase", "number", { min: 0, step: "0.01" })}
        {field("minQuantity", "Minimum quantity", "number", { min: 1, step: 1, required: true })}
        {field("validFrom", "Valid from", "date")}
        {field("validUntil", "Valid until", "date")}
        {field("usageLimit", "Usage limit (optional)", "number", { min: 0, step: 1 })}
        {field("usageCount", "Usage count", "number", { min: 0, step: 1 })}
      </div>

      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={discount.isActive}
          onChange={(event) => onChange(index, "isActive", event.target.checked)}
          className="accent-[#87A96B]"
        />
        Active
      </label>
    </div>
  );
}

/* ── slide-over form panel ── */
function ProductForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(() => initial ? {
    name: initial.name ?? "",
    productType: initial.productType ?? "",
    salesPrice: initial.salesPrice ?? "",
    costPrice: initial.costPrice ?? "",
    notes: initial.notes ?? "",
    taxRate: initial.tax
      ? {
          id: initial.tax.id,
          name: initial.tax.name ?? "",
          percentage: initial.tax.percentage ?? "",
        }
      : { name: "", percentage: "" },
    variants: initial.variants?.length ? initial.variants.map(v => ({ variantName: v.variantName, extraPrice: v.extraPrice })) : [],
    discounts: initial.discounts?.map((discount) => ({
      id: discount.id,
      name: discount.name ?? "",
      type: discount.type ?? "PERCENTAGE",
      value: discount.value ?? "",
      appliesTo: discount.appliesTo ?? "PRODUCT",
      minPurchase: discount.minPurchase ?? "0",
      minQuantity: discount.minQuantity ?? "1",
      validFrom: discount.validFrom ?? "",
      validUntil: discount.validUntil ?? "",
      usageLimit: discount.usageLimit ?? "",
      usageCount: discount.usageCount ?? "0",
      isActive: discount.isActive ?? true,
    })) ?? [],
  } : emptyForm());

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const listChange = (key, i, field, val) =>
    setForm((f) => ({ ...f, [key]: f[key].map((r, idx) => idx === i ? { ...r, [field]: val } : r) }));
  const listAdd = (key, blank) => setForm((f) => ({ ...f, [key]: [...f[key], blank] }));
  const listRemove = (key, i) => setForm((f) => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30" onClick={onClose}>
      <div className="flex h-[90vh] w-full max-w-2xl flex-col bg-[#FCFAF7] rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#EAE5DA] bg-white px-6 py-4">
          <h2 className="text-base font-semibold text-stone-800">{initial ? "Edit Product" : "New Product"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-[#F1EEE6]"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Basic Info */}
          <div className={S.section}>
            <p className={S.sectionTitle}><Package size={16} className="text-[#87A96B]" />Basic Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={S.label}>Product Name *</label>
                <input required maxLength={200} placeholder="e.g. Premium Widget" value={form.name}
                  onChange={(e) => set("name", e.target.value)} className={S.input} />
              </div>
              <div>
                <label className={S.label}>Product Type</label>
                <select value={form.productType} onChange={(e) => set("productType", e.target.value)} className={S.input}>
                  <option value="">Select type</option>
                  {PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={S.label}>Sales Price *</label>
                <input required type="number" min="0" step="0.01" placeholder="0.00" value={form.salesPrice}
                  onChange={(e) => set("salesPrice", e.target.value)} className={S.input} />
              </div>
              <div>
                <label className={S.label}>Cost Price *</label>
                <input required type="number" min="0" step="0.01" placeholder="0.00" value={form.costPrice}
                  onChange={(e) => set("costPrice", e.target.value)} className={S.input} />
              </div>
              <div className="col-span-2">
                <label className={S.label}>Notes</label>
                <textarea rows={3} placeholder="Internal notes..." value={form.notes}
                  onChange={(e) => set("notes", e.target.value)} className={`${S.input} resize-none`} />
              </div>
            </div>
          </div>

          {/* Variants */}
          <Collapsible icon={Tag} title="Brand / Variant Configuration">
            <p className="text-xs text-stone-400 -mt-1">Add product variants with optional extra price.</p>
            <RowList
              rows={form.variants}
              onChange={(i, k, v) => listChange("variants", i, k, v)}
              onAdd={() => listAdd("variants", { variantName: "", extraPrice: "" })}
              onRemove={(i) => listRemove("variants", i)}
              fields={[
                { key: "variantName", placeholder: "Variant name (e.g. Red / XL)" },
                { key: "extraPrice", placeholder: "Extra price", inputType: "number" },
              ]}
            />
          </Collapsible>

          <Collapsible icon={Percent} title="Tax rate" defaultOpen={Boolean(initial?.tax)}>
            <p className="text-xs text-stone-400">
              Add an optional tax rule for this product. Leave both fields blank for no tax.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={S.label}>Tax name</span>
                <input
                  maxLength={100}
                  placeholder="e.g. Standard VAT"
                  value={form.taxRate.name}
                  onChange={(event) =>
                    set("taxRate", { ...form.taxRate, name: event.target.value })
                  }
                  className={S.input}
                />
              </label>
              <label>
                <span className={S.label}>Percentage (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 20"
                  value={form.taxRate.percentage}
                  onChange={(event) =>
                    set("taxRate", { ...form.taxRate, percentage: event.target.value })
                  }
                  className={S.input}
                />
              </label>
            </div>
          </Collapsible>

          <Collapsible icon={Percent} title="Discount rules">
            <p className="text-xs text-stone-400">
              Configure product-scoped discounts and their eligibility and usage limits.
            </p>
            {form.discounts.map((discount, index) => (
              <DiscountRuleForm
                key={`discount-${discount.id ?? "new"}-${index}`}
                discount={discount}
                index={index}
                onChange={(i, key, value) =>
                  listChange("discounts", i, key, value)
                }
                onRemove={(i) => listRemove("discounts", i)}
              />
            ))}
            <button
              type="button"
              onClick={() => listAdd("discounts", emptyDiscount())}
              className="flex items-center gap-1.5 text-xs font-medium text-[#87A96B] hover:underline"
            >
              <Plus size={13} /> Add discount rule
            </button>
          </Collapsible>

        </div>

        <div className="flex justify-end gap-3 border-t border-[#EAE5DA] bg-white px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-[#DDD6C6] px-4 py-2 text-sm text-stone-600 hover:bg-[#F1EEE6]">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.name || !form.salesPrice || !form.costPrice}
            className="rounded-lg bg-[#87A96B] px-5 py-2 text-sm font-semibold text-[#14200F] hover:bg-[#76986a] disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {initial ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── view modal ── */
function ViewModal({ product, onClose }) {
  const row = (label, val) => val ? (
    <div key={label} className="flex justify-between py-2 border-b border-[#F4F1E9] last:border-0">
      <span className="text-xs text-stone-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-stone-700">{val}</span>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#EAE5DA] px-5 py-4">
          <h3 className="text-sm font-semibold text-stone-800">{product.name}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-stone-400 hover:bg-[#F1EEE6]"><X size={16} /></button>
        </div>
        <div className="px-5 py-4 space-y-0">
          {row("Type", product.productType)}
          {row("Sales Price", `$${product.salesPrice}`)}
          {row("Cost Price", `$${product.costPrice}`)}
          {row("Tax", product.tax ? `${product.tax.name} (${product.tax.percentage}%)` : null)}
          {row("Notes", product.notes)}
          {product.variants?.some(v => v.attribute) && row("Variants", product.variants.map(v => `${v.attribute}: ${v.values}`).join(" | "))}
          {product.taxes?.some(t => t.name) && row("Taxes", product.taxes.map(t => `${t.name} (${t.rate}${t.type === "Percentage" ? "%" : " fixed"})`).join(", "))}
        </div>
        <div className="flex justify-end border-t border-[#EAE5DA] px-5 py-3">
          <button onClick={onClose} className="rounded-lg bg-[#87A96B] px-4 py-2 text-sm font-semibold text-[#14200F] hover:bg-[#76986a]">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── main page ── */
export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => productService.list(), []);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((res) => {
        if (cancelled) return;
        setError(null);
        setProducts(res.data);
      })
      .catch((error) => {
        if (!cancelled) setError(getLoadErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [load]);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const res = await load();
      setError(null);
      setProducts(res.data);
    } catch (error) {
      setError(getLoadErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (form) => {
    try {
      setSaving(true);
      const taxName = form.taxRate.name.trim();
      const taxPercentage = form.taxRate.percentage;
      const hasTaxName = taxName.length > 0;
      const hasTaxPercentage = taxPercentage !== "";
      if (hasTaxName !== hasTaxPercentage) {
        throw new Error("Enter both a tax name and percentage, or leave both blank.");
      }
      if (
        hasTaxPercentage &&
        (!Number.isFinite(Number(taxPercentage)) ||
          Number(taxPercentage) < 0 ||
          Number(taxPercentage) > 100)
      ) {
        throw new Error("Tax percentage must be between 0 and 100.");
      }

      for (const [index, discount] of form.discounts.entries()) {
        if (!discount.name.trim()) {
          throw new Error(`Enter a name for discount rule ${index + 1}.`);
        }
        if (
          discount.value === "" ||
          !Number.isFinite(Number(discount.value)) ||
          Number(discount.value) < 0
        ) {
          throw new Error(`Enter a valid value for discount rule ${index + 1}.`);
        }
        if (
          discount.type === "PERCENTAGE" &&
          Number(discount.value) > 100
        ) {
          throw new Error("Percentage discounts cannot exceed 100%.");
        }
        if (
          discount.validFrom &&
          discount.validUntil &&
          discount.validUntil < discount.validFrom
        ) {
          throw new Error(`The end date for discount rule ${index + 1} must be on or after its start date.`);
        }
        if (
          discount.usageLimit !== "" &&
          Number(discount.usageLimit) < Number(discount.usageCount)
        ) {
          throw new Error(`The usage limit for discount rule ${index + 1} cannot be less than its usage count.`);
        }
      }

      const payload = {
        name: form.name, productType: form.productType || null,
        salesPrice: form.salesPrice, costPrice: form.costPrice,
        taxRate: hasTaxName
          ? {
              ...(form.taxRate.id ? { id: form.taxRate.id } : {}),
              name: taxName,
              percentage: taxPercentage,
            }
          : null,
        notes: form.notes || null,
        variants: (form.variants || []).filter(v => v.variantName),
        discounts: form.discounts.map((discount) => ({
          ...(discount.id ? { id: discount.id } : {}),
          ...discount,
          name: discount.name.trim(),
          appliesTo: "PRODUCT",
        })),
      };
      if (editing) await productService.update(editing.id, payload);
      else await productService.create(payload);
      await load();
      setShowForm(false); setEditing(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      await productService.remove(id);
      await load();
      setDeleteId(null);
    } catch (e) { alert(e.message); }
    finally { setDeleting(false); }
  };

  const typeColor = { "Storable Product": "bg-blue-50 text-blue-700", Service: "bg-purple-50 text-purple-700", Consumable: "bg-amber-50 text-amber-700", Digital: "bg-teal-50 text-teal-700" };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-[#FCFAF7]">
      <Loader2 size={28} className="animate-spin text-[#87A96B]" />
    </div>
  );

  if (error) return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#FCFAF7]">
      <AlertCircle size={28} className="text-red-400" />
      <p className="text-sm text-stone-500">{error}</p>
      <button onClick={handleRetry} className="rounded-lg bg-[#87A96B] px-4 py-2 text-sm font-semibold text-[#14200F]">Retry</button>
    </div>
  );

  return (
    <div className="min-h-full bg-[#FCFAF7] p-6 sm:p-8" style={{ fontFamily: "'Urbanist', sans-serif" }}>
      <div className="mx-auto max-w-7xl">

        {/* header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#87A96B]">Catalog</p>
            <h1 className="mt-0.5 text-2xl font-bold text-stone-800">Products</h1>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 rounded-xl bg-[#87A96B] px-4 py-2.5 text-sm font-semibold text-[#14200F] shadow-sm hover:bg-[#76986a]">
            <Plus size={16} /> New Product
          </button>
        </div>

        {/* stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Products", value: products.length, icon: Package, color: "bg-[#87A96B]/10 text-[#87A96B]" },
            { label: "Storable", value: products.filter(p => p.productType === "Storable Product").length, icon: Package, color: "bg-blue-50 text-blue-600" },
            { label: "Services", value: products.filter(p => p.productType === "Service").length, icon: DollarSign, color: "bg-purple-50 text-purple-600" },
            { label: "With Discounts", value: products.filter(p => p.discounts?.length > 0).length, icon: Percent, color: "bg-amber-50 text-amber-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-[#EAE5DA] bg-white px-5 py-4 shadow-sm">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon size={18} />
              </span>
              <div>
                <p className="text-2xl font-bold text-stone-800">{value}</p>
                <p className="text-xs text-stone-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* table */}
        <div className="rounded-2xl border border-[#EAE5DA] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EAE5DA] bg-[#FCFAF7]">
                  {["Sr No", "Name", "Type", "Sales Price", "Cost Price", "Tax", "Discount", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-stone-400">No products yet. Click <strong>New Product</strong> to add one.</td></tr>
                )}
                {products.map((p, i) => {
                  const tax = p.tax ? `${p.tax.name} ${p.tax.percentage}%` : "—";
                  const disc = p.discounts?.length ? `${p.discounts[0].type} ${p.discounts[0].value}${p.discounts[0].type === "PERCENTAGE" ? "%" : ""}` : "—";
                  return (
                    <tr key={p.id} className="border-b border-[#F4F1E9] last:border-0 hover:bg-[#FCFAF7] transition-colors">
                      <td className="px-5 py-3.5 text-stone-400 font-medium">{i + 1}</td>
                      <td className="px-5 py-3.5 font-semibold text-stone-800">{p.name}</td>
                      <td className="px-5 py-3.5">
                        {p.productType
                          ? <span className={`${S.badge} ${typeColor[p.productType] || "bg-stone-100 text-stone-600"}`}>{p.productType}</span>
                          : <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-stone-700">${p.salesPrice}</td>
                      <td className="px-5 py-3.5 text-stone-500">${p.costPrice}</td>
                      <td className="px-5 py-3.5 text-stone-500">{tax}</td>
                      <td className="px-5 py-3.5 text-stone-500">{disc}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewing(p)} title="View"
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-[#F1EEE6] hover:text-stone-700">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => { setEditing(p); setShowForm(true); }} title="Edit"
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-[#87A96B]/10 hover:text-[#87A96B]">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteId(p.id)} title="Delete"
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* form panel */}
      {showForm && (
        <ProductForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={saving}
        />
      )}

      {/* view modal */}
      {viewing && <ViewModal product={viewing} onClose={() => setViewing(null)} />}

      {/* delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="px-5 py-5">
              <h3 className="text-sm font-semibold text-stone-800 mb-1">Delete product?</h3>
              <p className="text-sm text-stone-500">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#EAE5DA] px-5 py-4">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-[#DDD6C6] px-4 py-2 text-sm text-stone-600 hover:bg-[#F1EEE6]">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60 flex items-center gap-2">
                {deleting && <Loader2 size={13} className="animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
=======
import ResourcePage from "../../components/ResourcePage.jsx";
import { getProducts } from "../../services/productService.js";

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Product" },
  { key: "productType", label: "Type" },
  { key: "salesPrice", label: "Sales price" },
  { key: "taxPercentage", label: "Tax %" },
];

export default function Products() {
  return <ResourcePage title="Products" load={getProducts} columns={columns} />;
>>>>>>> 315d366 (done)
}
