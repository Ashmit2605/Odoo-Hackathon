import ResourcePage from "../../components/ResourcePage.jsx";
import { createProduct, getProducts } from "../../services/productService.js";

export default function AddProduct() {
  return (
    <ResourcePage
      title="Products"
      load={getProducts}
      create={createProduct}
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Product" },
        { key: "productType", label: "Type" },
        { key: "salesPrice", label: "Sales price" },
      ]}
      fields={[
        { name: "name", label: "Product name" },
        { name: "productType", label: "Type", required: false },
        { name: "salesPrice", label: "Sales price", type: "number", step: "0.01" },
        { name: "costPrice", label: "Cost price", type: "number", step: "0.01", required: false },
        { name: "notes", label: "Notes", required: false },
      ]}
    />
  );
}
