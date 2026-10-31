import ResourcePage from "../../components/ResourcePage.jsx";
import { createCustomer, getCustomers } from "../../services/customerService.js";

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "companyName", label: "Company" },
  { key: "phone", label: "Phone" },
];

export default function Customers() {
  return (
    <ResourcePage
      title="Customers"
      load={getCustomers}
      create={createCustomer}
      columns={columns}
      detailPath={(id) => `/customers/${id}`}
      fields={[
        { name: "name", label: "Name" },
        { name: "email", label: "Email", type: "email", required: false },
        { name: "companyName", label: "Company", required: false },
        { name: "phone", label: "Phone", required: false },
        { name: "address", label: "Address", required: false },
      ]}
    />
  );
}
