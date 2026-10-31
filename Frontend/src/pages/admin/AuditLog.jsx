import DashboardDataPage from "../../components/DashboardDataPage.jsx";

const columns = [
  { key: "actor", label: "User" },
  { key: "action", label: "Activity" },
  { key: "target", label: "Record" },
  { key: "when", label: "When" },
];

const rows = [
  { id: "audit-1", actor: "Olivia Martin", action: "Updated plan", target: "Business Annual", when: "Today, 10:14 AM" },
  { id: "audit-2", actor: "Jordan Lee", action: "Created quotation", target: "QT-1048", when: "Today, 9:36 AM" },
  { id: "audit-3", actor: "Olivia Martin", action: "Changed discount", target: "WELCOME10", when: "Yesterday, 4:52 PM" },
];

export default function AuditLog() {
  return (
    <DashboardDataPage
      title="Audit log"
      description="Review a chronological record of recent changes made in the workspace."
      columns={columns}
      rows={rows}
      stats={[
        { label: "Events today", value: "24", detail: "Across all users" },
        { label: "Active users", value: "5", detail: "With recent activity" },
      ]}
    />
  );
}
