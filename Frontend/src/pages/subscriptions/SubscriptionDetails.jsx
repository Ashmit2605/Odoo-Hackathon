import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import {
  getSubscription,
  requestStaffCancellation,
  reinstateSubscription,
  requestCancellation,
} from "../../services/subscriptionService.js";

export default function SubscriptionDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setSubscription(await getSubscription(id));
  }, [id]);

  useEffect(() => {
    let active = true;
    getSubscription(id)
      .then((result) => {
        if (active) setSubscription(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Unable to load subscription.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const transition = async (action, successMessage) => {
    setSaving(true);
    setError("");
    try {
      await action(id);
      setNotice(successMessage);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update subscription.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading subscription...</p>;
  if (!subscription) return <p role="alert" className="text-red-700">{error || "Subscription not found."}</p>;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#5A3E2B]">{subscription.subscriptionNumber}</h1>
          <p className="mt-1 text-gray-500">{subscription.planName} · {subscription.status}</p>
        </div>
        <Link to="/subscriptions" className="font-semibold text-[#5A3E2B] hover:underline">Back to subscriptions</Link>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-700">{notice}</p>}
      <dl className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
        {[
          ["Customer", subscription.customerName],
          ["Plan", subscription.planName],
          ["Source", subscription.source],
          ["Agreed price", `${subscription.currency} ${subscription.agreedPrice}`],
          ["Start date", subscription.startDate],
          ["Current period end", subscription.currentPeriodEnd],
          ["Next billing", subscription.nextBillingDate],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
            <dd className="mt-1 text-gray-900">{value || "—"}</dd>
          </div>
        ))}
      </dl>
      {["CUSTOMER", "ADMIN", "STAFF"].includes(user?.role) && (
        <div className="flex flex-wrap gap-3">
          {["ACTIVE", "PAST_DUE"].includes(subscription.status) && (
            <button type="button" disabled={saving} onClick={() => transition(requestCancellation, "Cancellation scheduled for the end of the current billing period.")} className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700 disabled:opacity-60">
              Schedule cancellation
            </button>
          )}
          {subscription.status === "CANCEL_SCHEDULED" && (
            <button type="button" disabled={saving} onClick={() => transition(reinstateSubscription, "Cancellation reversed. Subscription remains active.")} className="rounded-lg bg-[#5A3E2B] px-4 py-2 font-semibold text-white disabled:opacity-60">
              Reverse cancellation
            </button>
          )}
          {user?.role === "STAFF" && ["ACTIVE", "PAST_DUE"].includes(subscription.status) && (
            <button type="button" disabled={saving} onClick={() => transition(requestStaffCancellation, "Cancellation request sent to an administrator for review.")} className="rounded-lg border border-amber-400 px-4 py-2 font-semibold text-amber-800 disabled:opacity-60">
              Request cancellation review
            </button>
          )}
        </div>
      )}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold text-[#5A3E2B]">Invoices</h2>
        {subscription.invoices?.length ? subscription.invoices.map((invoice) => (
          <p key={invoice.id} className="border-t py-2 text-sm">
            <Link to={`/invoices/${invoice.id}`} className="font-semibold text-[#5A3E2B] hover:underline">{invoice.invoiceNumber}</Link>
            {" · "}{invoice.status}{" · "}{subscription.currency} {invoice.totalAmount}
          </p>
        )) : <p className="text-sm text-gray-500">No invoices found.</p>}
      </div>
    </section>
  );
}
