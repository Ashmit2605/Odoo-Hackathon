import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import { getPlans, updatePlan } from "../../services/planService.js";

const formatPrice = (plan) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: plan.currency || "INR",
  }).format(Number(plan.price));

export default function Plans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const result = await getPlans();
    setPlans(result);
  };

  useEffect(() => {
    let active = true;
    getPlans()
      .then((result) => {
        if (active) setPlans(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Unable to load plans.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const beginEdit = (plan) => {
    setEditId(plan.id);
    setForm({
      name: plan.name,
      price: plan.price,
      currency: plan.currency || "INR",
      billingFrequency: plan.billingFrequency,
      description: plan.description || "",
      isActive: plan.isActive,
    });
    setError("");
    setNotice("");
  };

  const save = async (event) => {
    event.preventDefault();
    try {
      await updatePlan(editId, { ...form, price: Number(form.price) });
      setNotice("Plan updated. Existing subscriptions retain their agreed price and billing frequency.");
      setEditId(null);
      await reload();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update plan.");
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#5A3E2B]">Plans</h1>
          <p className="mt-1 text-gray-500">Active plans are available for customer self-service.</p>
        </div>
        {user?.role === "ADMIN" && <Link to="/plans/new" className="rounded-lg bg-[#D5851F] px-4 py-2.5 font-semibold text-white">Create plan</Link>}
      </header>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-700">{notice}</p>}
      {loading ? <p className="text-gray-500">Loading plans...</p> : plans.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">No plans created yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Billing cycle</th><th className="px-4 py-3">Availability</th>{user?.role === "ADMIN" && <th className="px-4 py-3">Actions</th>}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((plan) => (
                <tr key={plan.id}>
                  {editId === plan.id ? (
                    <td colSpan={user?.role === "ADMIN" ? 5 : 4} className="p-4">
                      <form onSubmit={save} className="grid gap-3 md:grid-cols-5">
                        <input aria-label="Plan name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded border px-3 py-2" />
                        <div className="flex gap-2">
                          <input aria-label="Plan price" type="number" min="0" step="0.01" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="min-w-0 flex-1 rounded border px-3 py-2" />
                          <input aria-label="Currency" maxLength="3" required value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} className="w-20 rounded border px-2 py-2" />
                        </div>
                        <select aria-label="Billing frequency" value={form.billingFrequency} onChange={(event) => setForm({ ...form, billingFrequency: event.target.value })} className="rounded border px-3 py-2">
                          {["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map((frequency) => <option key={frequency}>{frequency}</option>)}
                        </select>
                        <select aria-label="Plan availability" value={String(form.isActive)} onChange={(event) => setForm({ ...form, isActive: event.target.value === "true" })} className="rounded border px-3 py-2">
                          <option value="true">Active</option><option value="false">Inactive</option>
                        </select>
                        <div className="flex gap-2">
                          <button type="submit" className="rounded bg-[#5A3E2B] px-3 py-2 font-semibold text-white">Save</button>
                          <button type="button" onClick={() => setEditId(null)} className="rounded border px-3 py-2">Cancel</button>
                        </div>
                        <textarea aria-label="Plan description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="rounded border px-3 py-2 md:col-span-5" placeholder="Plan description" />
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3"><p className="font-semibold text-[#5A3E2B]">{plan.name}</p>{plan.description && <p className="mt-1 text-xs text-gray-500">{plan.description}</p>}</td>
                      <td className="px-4 py-3">{formatPrice(plan)}</td>
                      <td className="px-4 py-3">{plan.billingFrequency}</td>
                      <td className="px-4 py-3">{plan.isActive ? "Active" : "Inactive"}</td>
                      {user?.role === "ADMIN" && <td className="px-4 py-3"><button type="button" onClick={() => beginEdit(plan)} className="font-semibold text-[#5A3E2B] hover:underline">Edit</button></td>}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
