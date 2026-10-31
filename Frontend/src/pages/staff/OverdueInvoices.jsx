import DashboardDataPage from "../../components/DashboardDataPage.jsx";

const columns = [
  { key: "invoice", label: "Invoice" },
  { key: "customer", label: "Customer" },
  { key: "due", label: "Due date" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
];

const rows = [
  { id: "overdue-1", invoice: "INV-2048", customer: "Northstar Studio", due: "Oct 18, 2026", amount: "$480.00", status: "12 days overdue" },
  { id: "overdue-2", invoice: "INV-2033", customer: "Good Ground Co.", due: "Oct 22, 2026", amount: "$215.00", status: "8 days overdue" },
  { id: "overdue-3", invoice: "INV-2019", customer: "Cedar & Co.", due: "Oct 27, 2026", amount: "$890.00", status: "3 days overdue" },
];

export default function OverdueInvoices() {
  return (
    <DashboardDataPage
      title="Overdue invoices"
      description="Track unpaid invoices that have passed their due date."
      columns={columns}
      rows={rows}
      stats={[
        { label: "Overdue invoices", value: "5", detail: "Require follow-up" },
        { label: "Outstanding balance", value: "$2,340", detail: "Sample total" },
      ]}
    />
  );
}
