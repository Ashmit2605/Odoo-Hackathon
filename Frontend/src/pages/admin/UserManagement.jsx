import DashboardDataPage from "../../components/DashboardDataPage.jsx";

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
];

const rows = [
  { id: "user-1", name: "Olivia Martin", email: "olivia@example.com", role: "Administrator", status: "Active" },
  { id: "user-2", name: "Jordan Lee", email: "jordan@example.com", role: "Staff", status: "Active" },
  { id: "user-3", name: "Sam Taylor", email: "sam@example.com", role: "Staff", status: "Pending invite" },
];

export default function UserManagement() {
  return (
    <DashboardDataPage
      title="User management"
      description="Review workspace users, their access roles, and invitation status."
      columns={columns}
      rows={rows}
      stats={[
        { label: "Workspace users", value: "12", detail: "Across all access roles" },
        { label: "Pending invitations", value: "2", detail: "Awaiting acceptance" },
      ]}
    />
  );
}
