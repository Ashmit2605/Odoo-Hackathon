
import { useMemo, useState } from "react";
import {
  Search,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CalendarDays,
  ShieldCheck,
  CreditCard,
  Info,
} from "lucide-react";

// DEMO DATA — replace with GET /api/v1/plans
const demoPlans = [
  {
    id: "PLAN-001",
    name: "Starter",
    description: "Essential tools for individuals getting started.",
    price: 499,
    billingInterval: "MONTHLY",
    features: [
      "Basic subscription access",
      "Email notifications",
      "Invoice downloads",
      "Payment history",
    ],
    popular: false,
    isActive: true,
  },
  {
    id: "PLAN-002",
    name: "Professional",
    description: "Advanced features for growing businesses.",
    price: 999,
    billingInterval: "MONTHLY",
    features: [
      "Everything in Starter",
      "Advanced subscription tools",
      "Priority support",
      "Detailed billing reports",
      "Subscription management",
    ],
    popular: true,
    isActive: true,
  },
  {
    id: "PLAN-003",
    name: "Business",
    description: "A complete subscription solution for teams.",
    price: 4999,
    billingInterval: "YEARLY",
    features: [
      "Everything in Professional",
      "Team access",
      "Advanced analytics",
      "Dedicated support",
      "Custom onboarding",
    ],
    popular: false,
    isActive: true,
  },
  {
    id: "PLAN-004",
    name: "Enterprise",
    description: "Premium annual subscription for large teams.",
    price: 11999,
    billingInterval: "YEARLY",
    features: [
      "Everything in Business",
      "Premium assistance",
      "Enterprise reporting",
      "Dedicated account support",
      "Advanced configuration",
    ],
    popular: false,
    isActive: true,
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function PlanCard({ plan, onDetails, onSubscribe }) {
  return (
    <div
      className={`relative bg-white rounded-2xl border ${
        plan.popular
          ? "border-[#87A96B] ring-1 ring-[#87A96B]"
          : "border-[#EAE5DC]"
      } p-6 flex flex-col hover:shadow-lg transition-shadow`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1.5 bg-[#87A96B] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          <Sparkles size={13} />
          Most Popular
        </span>
      )}

      <div className="mt-2">
        <h3 className="text-xl font-bold text-[#5A3E2B]">
          {plan.name}
        </h3>

        <p className="text-sm text-gray-500 mt-2 min-h-10">
          {plan.description}
        </p>
      </div>

      <div className="mt-7">
        <span className="text-3xl font-bold text-[#5A3E2B]">
          {formatCurrency(plan.price)}
        </span>
        <span className="text-sm text-gray-500 ml-1">
          /{plan.billingInterval === "MONTHLY" ? "month" : "year"}
        </span>
      </div>

      <div className="border-t border-[#EAE5DC] my-6" />

      <p className="text-sm font-bold text-[#5A3E2B] mb-4">
        What's included
      </p>

      <ul className="space-y-3 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm text-gray-600">
            <Check
              size={17}
              className="text-[#718E55] shrink-0 mt-0.5"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-3 mt-8">
        <button
          onClick={() => onSubscribe(plan)}
          className="w-full flex items-center justify-center gap-2 bg-[#5A3E2B] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#493120] transition"
        >
          Subscribe Now
          <ArrowRight size={17} />
        </button>

        <button
          onClick={() => onDetails(plan)}
          className="w-full border border-[#EAE5DC] text-[#5A3E2B] py-3 rounded-xl text-sm font-semibold hover:bg-[#FAF7F0] transition"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

export default function AvailablePlans() {
  // Replace with API state when integrating backend.
  const [plans] = useState(demoPlans);
  const [search, setSearch] = useState("");
  const [billingFilter, setBillingFilter] = useState("ALL");
  const [detailsPlan, setDetailsPlan] = useState(null);
  const [subscribePlan, setSubscribePlan] = useState(null);
  const [notice, setNotice] = useState("");

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch = plan.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesBilling =
        billingFilter === "ALL" ||
        plan.billingInterval === billingFilter;

      return plan.isActive && matchesSearch && matchesBilling;
    });
  }, [plans, search, billingFilter]);

  const handleSubscribe = () => {
    if (!subscribePlan) return;

    // BACKEND INTEGRATION:
    // POST /api/v1/subscriptions/self-service
    // Body: { planId: subscribePlan.id }
    //
    // The backend should:
    // 1. Validate the plan and authenticated customer.
    // 2. Create a PENDING_PAYMENT subscription.
    // 3. Generate the first UNPAID invoice.
    // 4. Return subscriptionId and invoiceId.
    //
    // Only after the backend confirms creation should the
    // frontend navigate to the invoice payment screen.

    setNotice(
      `Demo only: ${subscribePlan.name} was selected. No subscription or invoice has been created.`
    );
    setSubscribePlan(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] p-4 md:p-8 text-[#5A3E2B]">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#718E55] mb-2">
              CUSTOMER DASHBOARD
            </p>

            <h1 className="text-3xl md:text-4xl font-bold">
              Available Plans
            </h1>

            <p className="text-gray-500 mt-2">
              Explore subscription plans and choose the right one for you.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#E8EEDC] text-[#496A36] px-4 py-3 rounded-xl text-sm font-medium">
            <ShieldCheck size={18} />
            Secure subscription management
          </div>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="bg-white border border-[#EAE5DC] rounded-2xl p-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search subscription plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#87A96B]"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#FAF7F0] rounded-xl p-1.5">
            {[
              ["ALL", "All Plans"],
              ["MONTHLY", "Monthly"],
              ["YEARLY", "Yearly"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setBillingFilter(value)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                  billingFilter === value
                    ? "bg-[#87A96B] text-white shadow-sm"
                    : "text-[#5A3E2B] hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {notice && (
          <div
            role="status"
            className="bg-[#E8EEDC] border border-[#C9D7BA] rounded-xl px-5 py-4 flex items-start justify-between gap-3 text-sm"
          >
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* PLAN CARDS */}
        {filteredPlans.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onDetails={setDetailsPlan}
                onSubscribe={setSubscribePlan}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#EAE5DC] rounded-2xl text-center py-16">
            <Search size={32} className="text-gray-300 mx-auto" />
            <h3 className="font-bold mt-4">
              No plans found
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Try a different search or billing filter.
            </p>
          </div>
        )}

        {/* HOW IT WORKS */}
        <div className="bg-white border border-[#EAE5DC] rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold">
            How subscriptions work
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {[
              {
                icon: Check,
                title: "Choose a Plan",
                description: "Select a monthly or yearly subscription.",
              },
              {
                icon: CreditCard,
                title: "Pay Your Invoice",
                description:
                  "An invoice is generated after subscription creation. Pay it manually.",
              },
              {
                icon: CalendarDays,
                title: "Manage Renewals",
                description:
                  "Renewal invoices are generated automatically. You pay when due.",
              },
            ].map(({ icon: Icon, title, description }, index) => (
              <div key={title} className="flex gap-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-[#E8EEDC] flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#718E55]">
                    STEP {index + 1}
                  </p>
                  <h3 className="font-bold mt-1">{title}</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PLAN DETAILS MODAL */}
      {detailsPlan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Plan details"
            className="bg-white rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-sm text-[#718E55] font-semibold">
                  PLAN DETAILS
                </p>
                <h2 className="text-2xl font-bold mt-2">
                  {detailsPlan.name}
                </h2>
              </div>
              <button
                onClick={() => setDetailsPlan(null)}
                aria-label="Close details"
              >
                <X size={22} />
              </button>
            </div>

            <p className="text-gray-500 mt-4">
              {detailsPlan.description}
            </p>

            <div className="bg-[#FAF7F0] rounded-xl p-5 mt-6">
              <p className="text-sm text-gray-500">
                Subscription Price
              </p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(detailsPlan.price)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Billed {detailsPlan.billingInterval.toLowerCase()}
              </p>
            </div>

            <h3 className="font-bold mt-6 mb-4">
              Included Features
            </h3>

            <ul className="space-y-3">
              {detailsPlan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <Check size={17} className="text-[#718E55]" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                setSubscribePlan(detailsPlan);
                setDetailsPlan(null);
              }}
              className="w-full mt-8 bg-[#5A3E2B] text-white rounded-xl py-3 font-semibold flex justify-center items-center gap-2"
            >
              Subscribe Now
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}

      {/* SUBSCRIBE CONFIRMATION MODAL */}
      {subscribePlan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm subscription"
            className="bg-white rounded-2xl w-full max-w-md p-7 shadow-xl"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">
                Confirm Subscription
              </h2>
              <button
                onClick={() => setSubscribePlan(null)}
                aria-label="Close confirmation"
              >
                <X size={21} />
              </button>
            </div>

            <div className="bg-[#FAF7F0] border border-[#EAE5DC] rounded-xl p-5 mt-6">
              <h3 className="font-bold text-lg">
                {subscribePlan.name}
              </h3>
              <p className="text-2xl font-bold mt-3">
                {formatCurrency(subscribePlan.price)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {subscribePlan.billingInterval === "MONTHLY"
                  ? "Monthly billing"
                  : "Yearly billing"}
              </p>
            </div>

            <div className="flex gap-2 mt-5 text-sm text-gray-500">
              <Info size={18} className="shrink-0" />
              <p>
                The subscription will remain pending until your
                first invoice is paid and verified.
              </p>
            </div>

            <div className="flex gap-3 mt-7">
              <button
                onClick={() => setSubscribePlan(null)}
                className="flex-1 border border-[#EAE5DC] rounded-xl py-3 font-semibold"
              >
                Go Back
              </button>

              <button
                onClick={handleSubscribe}
                className="flex-1 bg-[#D5851F] text-white rounded-xl py-3 font-semibold hover:bg-[#BD741A]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
