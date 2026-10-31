import DashboardDataPage from "../../components/DashboardDataPage.jsx";

const columns = [
  { key: "name", label: "Template" },
  { key: "type", label: "Document type" },
  { key: "updated", label: "Last updated" },
  { key: "status", label: "Status" },
];

const rows = [
  { id: "tpl-1", name: "Standard subscription", type: "Quotation", updated: "Oct 28, 2026", status: "Active" },
  { id: "tpl-2", name: "Annual renewal", type: "Quotation", updated: "Oct 24, 2026", status: "Active" },
  { id: "tpl-3", name: "Service add-on", type: "Quotation", updated: "Oct 18, 2026", status: "Draft" },
];

export default function QuotationTemplates() {
  return (
    <DashboardDataPage
      title="Quotation templates"
      description="Browse the templates used to prepare consistent customer quotations."
      columns={columns}
      rows={rows}
      stats={[
        { label: "Templates", value: "12", detail: "Across all document types" },
        { label: "Active", value: "9", detail: "Ready to use" },
      ]}
    />
  );
}
