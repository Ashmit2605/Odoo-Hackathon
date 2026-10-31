import DashboardDataPage from "../../components/DashboardDataPage.jsx";

const columns = [
  { key: "report", label: "Report" },
  { key: "period", label: "Period" },
  { key: "generated", label: "Last generated" },
  { key: "availability", label: "Availability" },
];

const rows = [
  { id: "staff-report-1", report: "Invoice activity", period: "October 2026", generated: "Today, 9:42 AM", availability: "View only" },
  { id: "staff-report-2", report: "Subscription status", period: "October 2026", generated: "Oct 29, 2026", availability: "View only" },
  { id: "staff-report-3", report: "Customer activity", period: "Q3 2026", generated: "Oct 27, 2026", availability: "View only" },
];

export default function StaffReports() {
  return (
    <DashboardDataPage
      title="Reports"
      description="View operational summaries for invoices, subscriptions, and customer activity."
      columns={columns}
      rows={rows}
      stats={[
        { label: "Available reports", value: "3", detail: "Staff read-only access" },
        { label: "Latest refresh", value: "Today", detail: "Sample reporting data" },
      ]}
    />
  );
}
