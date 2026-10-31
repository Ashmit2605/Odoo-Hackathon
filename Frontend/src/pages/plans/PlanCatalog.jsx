import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicPlans } from "../../services/planService.js";
import { subscribeToPlan } from "../../services/subscriptionService.js";
import useAuth from "../../hooks/useAuth.js";

export default function PlanCatalog() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submittingPlanId, setSubmittingPlanId] = useState(null);

  useEffect(() => {
    getPublicPlans()
      .then(setPlans)
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Unable to load plans.");
      });
  }, []);

  const subscribe = async (planId) => {
    setError("");
    setMessage("");
    setSubmittingPlanId(planId);
    try {
      const result = await subscribeToPlan(planId);
      setMessage(
        `Subscription ${result.subscriptionNumber} created. Invoice ${result.invoice.invoiceNumber} is awaiting payment.`,
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to start this subscription.",
      );
    } finally {
      setSubmittingPlanId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF7F0] px-5 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#5A3E2B]">Subscription plans</h1>
            <p className="mt-2 text-gray-600">Choose a plan. Access starts after its first invoice is paid.</p>
          </div>
          {user ? (
            <Link to="/dashboard" className="font-semibold text-[#5A3E2B] hover:underline">Dashboard</Link>
          ) : (
            <Link to="/login" className="font-semibold text-[#5A3E2B] hover:underline">Sign in</Link>
          )}
        </div>
        {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
        {message && <p role="status" className="mb-5 rounded-lg bg-green-50 p-3 text-green-700">{message}</p>}
        {plans.length === 0 && !error ? (
          <p className="rounded-2xl bg-white p-8 text-gray-500">Loading available plans...</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-[#5A3E2B]">{plan.name}</h2>
                {plan.description && <p className="mt-2 text-sm text-gray-600">{plan.description}</p>}
                <p className="mt-6 text-3xl font-bold text-[#5A3E2B]">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: plan.currency || "INR" }).format(Number(plan.price))}
                  <span className="ml-1 text-sm font-normal text-gray-500">/ {plan.billingFrequency.toLowerCase()}</span>
                </p>
                {user?.role === "CUSTOMER" ? (
                  <button
                    type="button"
                    disabled={submittingPlanId !== null}
                    onClick={() => subscribe(plan.id)}
                    className="mt-6 w-full rounded-xl bg-[#D5851F] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {submittingPlanId === plan.id ? "Creating subscription..." : "Subscribe"}
                  </button>
                ) : user ? (
                  <p className="mt-6 text-sm text-gray-500">Customer accounts can subscribe to this plan.</p>
                ) : (
                  <Link to="/login" className="mt-6 block rounded-xl bg-[#D5851F] px-4 py-3 text-center font-semibold text-white">Sign in to subscribe</Link>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
