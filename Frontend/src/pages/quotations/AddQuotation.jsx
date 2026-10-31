<<<<<<< HEAD
import React from "react";
import RequestQuotation from "../customer/quotations/RequestQuotation.jsx";

export default function AddQuotation() {
  return <RequestQuotation />;
=======
import ResourcePage from "../../components/ResourcePage.jsx";
import { getCustomers } from "../../services/customerService.js";
import { getPlans } from "../../services/planService.js";
import { createQuotation, getQuotations } from "../../services/subscriptionService.js";
import { useEffect, useState } from "react";

export default function AddQuotation() {
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
            "Unable to load customers and plans for quotations.",
        );
      });
  }, []);

  return (
    <>
      {lookupError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{lookupError}</p>}
      <ResourcePage
        title="Quotations"
        load={getQuotations}
        create={createQuotation}
        columns={[
          { key: "id", label: "ID" },
          { key: "subscriptionNumber", label: "Quotation" },
          { key: "customerName", label: "Customer" },
          { key: "planName", label: "Plan" },
          { key: "status", label: "Status" },
        ]}
        fields={[
          { name: "customerId", label: "Customer", options: customers.map(({ id, name }) => ({ value: id, label: name })) },
          { name: "planId", label: "Plan", options: plans.map(({ id, name }) => ({ value: id, label: name })) },
          { name: "startDate", label: "Start date", type: "date" },
          { name: "quotationValidUntil", label: "Valid until", type: "date", required: false },
        ]}
      />
    </>
  );
>>>>>>> 315d366 (done)
}
