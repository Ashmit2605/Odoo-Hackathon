import ResourcePage from "../../components/ResourcePage.jsx";
import { createPlan, getPlans } from "../../services/planService.js";

export default function AddPlan() {
  return (
    <ResourcePage
      title="Plans"
      load={getPlans}
      create={createPlan}
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Plan" },
        { key: "price", label: "Price" },
        { key: "billingFrequency", label: "Frequency" },
      ]}
      fields={[
        { name: "name", label: "Plan name" },
        { name: "price", label: "Price", type: "number", step: "0.01" },
        {
          name: "billingFrequency",
          label: "Frequency",
          options: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map((value) => ({ value, label: value })),
        },
        { name: "minQuantity", label: "Minimum quantity", type: "number", min: 1 },
      ]}
    />
  );
}
