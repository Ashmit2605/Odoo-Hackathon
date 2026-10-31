import ResourcePage from "../../components/ResourcePage.jsx";
import { getSubscriptions } from "../../services/subscriptionService.js";

const columns = [
  { key: "id", label: "ID" },
  { key: "subscriptionNumber", label: "Number" },
  { key: "customerName", label: "Customer" },
  { key: "planName", label: "Plan" },
  { key: "nextBillingDate", label: "Next billing" },
  { key: "status", label: "Status" },
];

export default function Subscriptions() {
  return <ResourcePage title="Subscriptions" load={getSubscriptions} columns={columns} detailPath={(id) => `/subscriptions/${id}`} />;
}
