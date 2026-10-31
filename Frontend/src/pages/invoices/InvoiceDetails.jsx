import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import {
  completeTestCheckout,
  createCheckout,
  getInvoice,
} from "../../services/invoiceService.js";

export default function InvoiceDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const refresh = useCallback(async () => {
    const result = await getInvoice(id);
    setInvoice(result);
  }, [id]);

  useEffect(() => {
    let active = true;
    getInvoice(id)
      .then((result) => {
        if (active) setInvoice(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Unable to load invoice.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const payTestInvoice = async () => {
    setPaying(true);
    setError("");
    setNotice("");
    try {
      const checkout = await createCheckout(invoice.id);
      const result = await completeTestCheckout(checkout.payment.id);
      setNotice(result.message);
      await refresh();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to complete checkout. No payment was recorded.",
      );
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading invoice...</p>;
  if (!invoice) return <p role="alert" className="text-red-700">{error || "Invoice not found."}</p>;

  const balance = Number(invoice.totalAmount) - Number(invoice.amountPaid);
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#5A3E2B]">{invoice.invoiceNumber}</h1>
          <p className="mt-1 text-gray-500">{invoice.customerName} · {invoice.status}</p>
        </div>
        <Link to="/invoices" className="font-semibold text-[#5A3E2B] hover:underline">Back to invoices</Link>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-amber-50 p-3 text-amber-900">{notice}</p>}
      <dl className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
        {[
          ["Invoice date", invoice.invoiceDate],
          ["Due date", invoice.dueDate],
          ["Subtotal", invoice.subtotal],
          ["Total", `${invoice.currency} ${invoice.totalAmount}`],
          ["Amount paid", `${invoice.currency} ${invoice.amountPaid}`],
          ["Balance due", `${invoice.currency} ${balance.toFixed(2)}`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
            <dd className="mt-1 text-gray-900">{value || "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-3">Item</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Unit price</th><th className="px-4 py-3">Amount</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.productName}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{item.unitPrice}</td>
                <td className="px-4 py-3">{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {user?.role === "CUSTOMER" && balance > 0 && !["CANCELLED", "PAID"].includes(invoice.status) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-semibold text-amber-950">Development test checkout</p>
          <p className="mt-1 text-sm text-amber-900">
            This demo records a test payment only. It does not charge a card or contact a payment provider.
          </p>
          <button type="button" disabled={paying} onClick={payTestInvoice} className="mt-4 rounded-lg bg-[#5A3E2B] px-5 py-2.5 font-semibold text-white disabled:opacity-60">
            {paying ? "Processing test..." : "Complete test payment"}
          </button>
        </div>
      )}
      {invoice.payments?.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold text-[#5A3E2B]">Verified payment history</h2>
          {invoice.payments.map((payment) => (
            <p key={payment.id} className="border-t py-2 text-sm text-gray-700">
              {payment.paymentDate} · {payment.method} · {invoice.currency} {payment.amount} · {payment.status}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
