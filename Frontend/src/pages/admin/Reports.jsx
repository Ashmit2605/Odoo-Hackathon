import DashboardDataPage from "../../components/DashboardDataPage.jsx";

const columns = [
  { key: "report", label: "Report" },
  { key: "period", label: "Period" },
  { key: "generated", label: "Last generated" },
  { key: "status", label: "Status" },
];

const rows = [
  { id: "report-1", report: "Recurring revenue", period: "October 2026", generated: "Today, 9:42 AM", status: "Ready" },
  { id: "report-2", report: "Subscription growth", period: "Q3 2026", generated: "Oct 29, 2026", status: "Ready" },
  { id: "report-3", report: "Payment collection", period: "October 2026", generated: "Oct 28, 2026", status: "Ready" },
];

export default function Reports() {
  return (
    <DashboardDataPage
      title="Reports"
      description="Explore recent summaries of revenue, subscriptions, and payment activity."
      columns={columns}
      rows={rows}
      stats={[
        { label: "Available reports", value: "8", detail: "Across three categories" },
        { label: "Latest refresh", value: "Today", detail: "Sample reporting data" },
      ]}
    />
  );
}
