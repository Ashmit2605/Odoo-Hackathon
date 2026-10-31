import DashboardDataPage from "../../components/DashboardDataPage.jsx";

const columns = [
  { key: "name", label: "Tax rule" },
  { key: "region", label: "Region" },
  { key: "rate", label: "Rate" },
  { key: "status", label: "Status" },
];

const rows = [
  { id: "tax-1", name: "Standard VAT", region: "United Kingdom", rate: "20%", status: "Active" },
  { id: "tax-2", name: "Reduced VAT", region: "United Kingdom", rate: "5%", status: "Active" },
  { id: "tax-3", name: "GST", region: "Australia", rate: "10%", status: "Active" },
];

export default function Taxes() {
  return (
    <DashboardDataPage
      title="Taxes"
      description="Review tax rules and rates applied to subscriptions and invoices."
      columns={columns}
      rows={rows}
      stats={[
        { label: "Tax rules", value: "8", detail: "Configured regions" },
        { label: "Active rules", value: "7", detail: "One rule is archived" },
      ]}
    />
  );
}
