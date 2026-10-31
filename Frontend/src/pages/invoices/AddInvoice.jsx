import { useEffect, useState } from "react";
import { createInvoice } from "../../services/invoiceService.js";
import { getCustomers } from "../../services/customerService.js";
import { getProducts } from "../../services/productService.js";

export default function AddInvoice() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getCustomers(), getProducts()])
      .then(([customerRows, productRows]) => {
        setCustomers(customerRows);
        setProducts(productRows);
      })
      .catch((requestError) => {
        setError(
          requestError.response?.data?.message ||
            "Unable to load customers and products.",
        );
      });
  }, []);

  const selectedProduct = products.find((product) => String(product.id) === productId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const invoice = await createInvoice({
        customerId: Number(customerId),
        dueDate: dueDate || undefined,
        items: [
          {
            productName: selectedProduct.name,
            quantity: Number(quantity),
            unitPrice: Number(selectedProduct.salesPrice),
            taxPercentage: Number(selectedProduct.taxPercentage || 0),
          },
        ],
      });
      setMessage(`Invoice ${invoice.invoiceNumber} created.`);
      setCustomerId("");
      setProductId("");
      setQuantity("1");
      setDueDate("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to create the invoice.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#5A3E2B]">Create invoice</h1>
        <p className="mt-1 text-gray-500">Choose a customer and product to create a confirmed invoice.</p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-700">{message}</p>}
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 md:max-w-2xl md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-gray-700">
          Customer
          <select required value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="">Select customer...</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-gray-700">
          Product
          <select required value={productId} onChange={(event) => setProductId(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="">Select product...</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name} — ₹{product.salesPrice}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-gray-700">
          Quantity
          <input required min="1" step="1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium text-gray-700">
          Due date
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <p className="text-sm text-gray-500 md:col-span-2">
          {selectedProduct ? `Total before tax: ₹${(Number(selectedProduct.salesPrice) * Number(quantity || 0)).toFixed(2)}` : "The invoice total is calculated from the selected product and quantity."}
        </p>
        <button type="submit" disabled={saving || customers.length === 0 || products.length === 0} className="rounded-lg bg-[#D5851F] px-5 py-2.5 font-semibold text-white disabled:opacity-60 md:col-span-2">
          {saving ? "Creating..." : "Create invoice"}
        </button>
      </form>
    </section>
  );
}
