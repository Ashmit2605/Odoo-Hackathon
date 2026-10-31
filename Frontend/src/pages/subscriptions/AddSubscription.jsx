import { useEffect, useState } from "react";
import ResourcePage from "../../components/ResourcePage.jsx";
import { getCustomers } from "../../services/customerService.js";
import { getPlans } from "../../services/planService.js";
import {
  createSubscription,
  getSubscriptions,
} from "../../services/subscriptionService.js";

export default function AddSubscription() {
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    Promise.all([getCustomers(), getPlans()])
      .then(([customerRows, planRows]) => {
        setCustomers(customerRows);
        setPlans(planRows);
      })
      .catch((requestError) => {
        setLookupError(
          requestError.response?.data?.message ||
            "Unable to load customers and plans.",
        );
      });
  }, []);

  return (
    <>
      {lookupError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{lookupError}</p>}
      <ResourcePage
        title="Subscriptions"
        load={getSubscriptions}
        create={createSubscription}
        columns={[
          { key: "id", label: "ID" },
          { key: "subscriptionNumber", label: "Subscription" },
          { key: "customerName", label: "Customer" },
          { key: "planName", label: "Plan" },
          { key: "status", label: "Status" },
        ]}
        fields={[
          { name: "customerId", label: "Customer", type: "number", options: customers.map(({ id, name }) => ({ value: id, label: name })) },
          { name: "planId", label: "Plan", type: "number", options: plans.map(({ id, name }) => ({ value: id, label: name })) },
          { name: "startDate", label: "Start date", type: "date" },
          { name: "expiryDate", label: "Expiry date", type: "date", required: false },
        ]}
      />
    </>
  );
}
