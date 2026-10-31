import DashboardDataPage from "../../components/DashboardDataPage.jsx";

const columns = [
  { key: "category", label: "Category" },
  { key: "preference", label: "Preference" },
  { key: "value", label: "Current value" },
];

const rows = [
  { id: "setting-1", category: "Profile", preference: "Display name", value: "Workspace member" },
  { id: "setting-2", category: "Notifications", preference: "Invoice reminders", value: "Email enabled" },
  { id: "setting-3", category: "Appearance", preference: "Interface theme", value: "Warm white and sage" },
];

export default function Settings() {
  return (
    <DashboardDataPage
      title="Profile & settings"
      description="Review your profile and workspace preferences."
      columns={columns}
      rows={rows}
      stats={[
        { label: "Profile", value: "Up to date", detail: "Sample account settings" },
        { label: "Notifications", value: "Enabled", detail: "Email reminders are on" },
      ]}
    />
  );
}
