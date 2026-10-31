import DashboardDataPage from "../../components/DashboardDataPage.jsx";

const columns = [
  { key: "code", label: "Code" },
  { key: "offer", label: "Offer" },
  { key: "redemptions", label: "Redemptions" },
  { key: "status", label: "Status" },
];

const rows = [
  { id: "discount-1", code: "WELCOME10", offer: "10% off first month", redemptions: "48", status: "Active" },
  { id: "discount-2", code: "ANNUAL15", offer: "15% off annual plans", redemptions: "21", status: "Active" },
  { id: "discount-3", code: "SPRING25", offer: "25% off first invoice", redemptions: "64", status: "Expired" },
];

export default function Discounts() {
  return (
    <DashboardDataPage
      title="Discounts"
      description="Review promotional offers and their recent redemption activity."
      columns={columns}
      rows={rows}
      stats={[
        { label: "Active offers", value: "6", detail: "Available to customers" },
        { label: "Redemptions this month", value: "133", detail: "Across all offers" },
      ]}
    />
  );
}
