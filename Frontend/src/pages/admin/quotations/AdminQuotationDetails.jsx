import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  HelpCircle,
  Download,
  Send,
  MessageSquare,
  History,
  AlertTriangle,
  FileText,
  DollarSign,
  Calculator,
  Loader2,
  X,
  AlertCircle,
  Save,
} from "lucide-react";
import {
  getAdminQuotation,
  acceptQuotation,
  rejectQuotation,
  requestMoreInfo,
  downloadAdminQuotationPdf,
  addMessage,
} from "../../../services/quotationService.js";
import QuotationStatusBadge from "../../../components/quotations/QuotationStatusBadge.jsx";
import Toast from "../../../components/Toast.jsx";
import { formatDate, formatDateTime, formatCurrency } from "../../../utils/formatters.js";

export default function AdminQuotationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Pricing Form state
  const [pricingItems, setPricingItems] = useState([]);
  const [additionalDiscount, setAdditionalDiscount] = useState("0");
  const [paymentTerms, setPaymentTerms] = useState("Net 30 Days");
  const [validUntil, setValidUntil] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Modals state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);

  // Modal form inputs
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestInfoMsg, setRequestInfoMsg] = useState("");

  // Messaging thread state
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "info" });

  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")?.id;
    } catch {
      return null;
    }
  })();

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminQuotation(id);
      const data = res.data || res.quotation || res;
      setQuotation(data);

      // Populate pricing state
      if (data.items && data.items.length > 0) {
        setPricingItems(
          data.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            planId: item.planId,
            productName:
              item.productNameSnapshot ||
              item.productName ||
              item.product?.name ||
              "Product",
            planName:
              item.planNameSnapshot || item.planName || item.plan?.name || "Standard",
            quantity: item.quantity || 1,
            unitPrice:
              item.unitPrice && Number(item.unitPrice) > 0
                ? String(item.unitPrice)
                : String(item.product?.salesPrice || "100.00"),
            discount: String(item.discount || "0"),
            taxRate:
              item.taxRate && Number(item.taxRate) > 0
                ? String(item.taxRate)
                : "18", // default 18% GST/tax
          }))
        );
      }

      setPaymentTerms(data.paymentTerms || "Net 30 Days");
      setAdminNotes(data.adminNotes || "");

      if (data.validUntil) {
        const d = new Date(data.validUntil).toISOString().split("T")[0];
        setValidUntil(d);
      } else {
        // default 30 days in future
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        setValidUntil(nextMonth.toISOString().split("T")[0]);
      }
    } catch (err) {
      console.error("Failed to fetch admin quotation:", err);
      setError(err.message || "Failed to load quotation details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchQuotation();
    }
  }, [id]);

  // Handle pricing row change
  const handleItemPriceChange = (index, field, value) => {
    const updated = [...pricingItems];
    updated[index][field] = value;
    setPricingItems(updated);
  };

  // Calculations for pricing
  const calculatedSummary = useMemo(() => {
    let subtotal = 0;
    let itemsDiscountTotal = 0;
    let totalTax = 0;

    const computedItems = pricingItems.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const disc = Number(item.discount) || 0;
      const rate = Number(item.taxRate) || 0;

      const itemSub = qty * price;
      const taxable = Math.max(0, itemSub - disc);
      const taxAmt = (taxable * rate) / 100;
      const lineTot = taxable + taxAmt;

      subtotal += itemSub;
      itemsDiscountTotal += disc;
      totalTax += taxAmt;

      return {
        ...item,
        taxAmount: taxAmt,
        lineTotal: lineTot,
      };
    });

    const addDisc = Number(additionalDiscount) || 0;
    const grandDiscount = itemsDiscountTotal + addDisc;
    const grandTotal = Math.max(0, subtotal - grandDiscount) + totalTax;

    return {
      computedItems,
      subtotal,
      totalDiscount: grandDiscount,
      totalTax,
      grandTotal,
    };
  }, [pricingItems, additionalDiscount]);

  // Handle Accept
  const handleAcceptConfirm = async () => {
    try {
      setActionLoading(true);
      const payload = {
        items: calculatedSummary.computedItems.map((item) => ({
          id: item.id,
          unitPrice: Number(item.unitPrice) || 0,
          discount: Number(item.discount) || 0,
          taxRate: Number(item.taxRate) || 0,
          taxAmount: item.taxAmount,
          lineTotal: item.lineTotal,
        })),
        subtotal: calculatedSummary.subtotal,
        discountAmount: calculatedSummary.totalDiscount,
        taxAmount: calculatedSummary.totalTax,
        totalAmount: calculatedSummary.grandTotal,
        paymentTerms,
        validUntil: validUntil || null,
        adminNotes: adminNotes.trim(),
      };

      await acceptQuotation(id, payload);
      setToast({ message: "Quotation officially accepted and finalized!", type: "success" });
      setShowAcceptModal(false);
      await fetchQuotation();
    } catch (err) {
      console.error("Accept failed:", err);
      setToast({ message: err.message || "Failed to accept quotation", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      setToast({ message: "Rejection reason is required.", type: "error" });
      return;
    }

    try {
      setActionLoading(true);
      await rejectQuotation(id, rejectionReason.trim());
      setToast({ message: "Quotation rejected successfully", type: "success" });
      setShowRejectModal(false);
      setRejectionReason("");
      await fetchQuotation();
    } catch (err) {
      console.error("Reject failed:", err);
      setToast({ message: err.message || "Failed to reject quotation", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Request More Info
  const handleRequestInfoConfirm = async () => {
    if (!requestInfoMsg.trim()) {
      setToast({ message: "Please specify the information needed.", type: "error" });
      return;
    }

    try {
      setActionLoading(true);
      await requestMoreInfo(id, requestInfoMsg.trim());
      setToast({ message: "Information request sent to customer", type: "success" });
      setShowRequestInfoModal(false);
      setRequestInfoMsg("");
      await fetchQuotation();
    } catch (err) {
      console.error("Request info failed:", err);
      setToast({ message: err.message || "Failed to request information", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSendingMsg(true);
      await addMessage(id, newMessage.trim());
      setNewMessage("");
      setToast({ message: "Message sent", type: "success" });
      await fetchQuotation();
    } catch (err) {
      console.error("Message send failed:", err);
      setToast({ message: err.message || "Failed to send message", type: "error" });
    } finally {
      setSendingMsg(false);
    }
  };

  // Handle Download PDF
  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await downloadAdminQuotationPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quotation.quotationNumber || `admin-quotation-${id}`}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setToast({ message: "PDF downloaded successfully", type: "success" });
    } catch (err) {
      console.error("PDF download failed:", err);
      setToast({ message: err.message || "Failed to download PDF", type: "error" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#87A96B]" />
        <p className="mt-3 text-sm text-stone-500">Loading quotation details...</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Link
          to="/admin/quotations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-800 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </Link>
        <div className="bg-white border border-[#EAE5DA] rounded-2xl p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-stone-800">Error Loading Quotation</h2>
          <p className="text-sm text-stone-500 mt-1">{error || "Quotation record not found"}</p>
          <button
            onClick={fetchQuotation}
            className="mt-4 px-4 py-2 bg-[#D5851F] hover:bg-[#BD741A] text-white text-sm font-medium rounded-xl transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const qNum = quotation.quotationNumber || `QUO-${String(quotation.id).padStart(4, "0")}`;
  const isAccepted = quotation.status === "ACCEPTED";
  const isRejected = quotation.status === "REJECTED";
  const isPending = quotation.status === "PENDING" || quotation.status === "NEEDS_INFORMATION";

  const customer = quotation.customer || {};
  const messages = quotation.messages || [];
  const activityLogs = quotation.activityLogs || quotation.logs || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />

      {/* Header and top actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/quotations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-800 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Quotations</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-[#5A3E2B]">
              Quotation {qNum}
            </h1>
            <QuotationStatusBadge status={quotation.status} size="lg" />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              Requested on: {formatDate(quotation.createdAt)}
            </span>
            {quotation.validUntil && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Valid Until: {formatDate(quotation.validUntil)}
              </span>
            )}
            {quotation.processedAt && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle className="w-3.5 h-3.5" />
                Processed on: {formatDateTime(quotation.processedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isPending && (
            <>
              <button
                type="button"
                onClick={() => setShowRequestInfoModal(true)}
                className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-semibold transition"
              >
                Request Info
              </button>

              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-semibold transition"
              >
                Reject
              </button>

              <button
                type="button"
                onClick={() => setShowAcceptModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#87A96B] hover:bg-[#729257] text-white text-sm font-semibold transition shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Accept & Issue Quotation</span>
              </button>
            </>
          )}

          {isAccepted && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#87A96B] hover:bg-[#729257] text-white text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Banners for rejected status */}
      {isRejected && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold block">Quotation Rejected</span>
            <span>Reason provided: {quotation.rejectionReason || "None provided"}</span>
          </div>
        </div>
      )}

      {/* Customer Info Card */}
      <div className="bg-white border border-[#EAE5DA] rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wider mb-4 border-b border-[#EAE5DA] pb-2">
          Customer & Organization Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-xs text-stone-400 block mb-0.5">Customer Name</span>
            <div className="font-semibold text-stone-800 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{customer.name || quotation.requestedByName || "Customer"}</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-stone-400 block mb-0.5">Email</span>
            <div className="text-stone-700 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{customer.email || quotation.requestedByEmail || "—"}</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-stone-400 block mb-0.5">Company</span>
            <div className="text-stone-700 flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{customer.companyName || "—"}</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-stone-400 block mb-0.5">Phone</span>
            <div className="text-stone-700 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{customer.phone || "—"}</span>
            </div>
          </div>

          {customer.address && (
            <div className="sm:col-span-2 lg:col-span-4 mt-1">
              <span className="text-xs text-stone-400 block mb-0.5">Address</span>
              <div className="text-stone-700 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{customer.address}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Pricing / Items on Left (2 cols), Messages & Activity on Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Requested Notes */}
          {quotation.customerNotes && (
            <div className="bg-[#FAF7F0] border border-[#EAE5DA] rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Customer's Requirements / Notes:
              </span>
              <p className="text-sm text-stone-800 leading-relaxed">
                {quotation.customerNotes}
              </p>
            </div>
          )}

          {/* Pricing Configurator or Finalized Table */}
          <div className="bg-white border border-[#EAE5DA] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EAE5DA] bg-[#FCFAF7] flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-stone-800 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#87A96B]" />
                  <span>
                    {isPending ? "Admin Pricing Configuration" : "Finalized Pricing & Items"}
                  </span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {isPending
                    ? "Set custom unit prices, applicable discounts, and tax rates for this quotation."
                    : "The agreed line item pricing and calculated totals."}
                </p>
              </div>

              {isPending && (
                <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200 font-medium">
                  Editable Mode
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE5DA] bg-[#FAF7F0]/60 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    <th className="py-3 px-4">Item & Plan</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-4">Unit Price (₹)</th>
                    <th className="py-3 px-3">Disc (₹)</th>
                    <th className="py-3 px-3">Tax %</th>
                    <th className="py-3 px-3 text-right">Tax (₹)</th>
                    <th className="py-3 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5DA] text-sm text-stone-700">
                  {isPending ? (
                    // EDITABLE MODE
                    calculatedSummary.computedItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-[#FAF7F0]/30">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-800">{item.productName}</div>
                          <div className="text-xs text-stone-500">{item.planName}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-stone-700">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemPriceChange(idx, "unitPrice", e.target.value)
                            }
                            className="w-24 bg-white border border-stone-200 rounded-lg py-1 px-2 text-xs text-stone-800 focus:outline-none focus:border-[#87A96B]"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount}
                            onChange={(e) =>
                              handleItemPriceChange(idx, "discount", e.target.value)
                            }
                            className="w-20 bg-white border border-stone-200 rounded-lg py-1 px-2 text-xs text-stone-800 focus:outline-none focus:border-[#87A96B]"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={item.taxRate}
                            onChange={(e) =>
                              handleItemPriceChange(idx, "taxRate", e.target.value)
                            }
                            className="w-16 bg-white border border-stone-200 rounded-lg py-1 px-2 text-xs text-stone-800 focus:outline-none focus:border-[#87A96B]"
                          />
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-stone-500 font-medium">
                          {formatCurrency(item.taxAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-stone-800">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    // READ ONLY MODE
                    (quotation.items || []).map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-stone-800">
                            {item.productNameSnapshot ||
                              item.productName ||
                              item.product?.name ||
                              "Item"}
                          </div>
                          <div className="text-xs text-stone-500">
                            {item.planNameSnapshot || item.planName || item.plan?.name || "Plan"}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-3.5 px-4 font-medium text-stone-700">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-3.5 px-3 text-xs text-stone-500">
                          {Number(item.discount) > 0 ? `-${formatCurrency(item.discount)}` : "—"}
                        </td>
                        <td className="py-3.5 px-3 text-xs text-stone-500">
                          {item.taxRate ? `${item.taxRate}%` : "—"}
                        </td>
                        <td className="py-3.5 px-3 text-right text-xs text-stone-500">
                          {formatCurrency(item.taxAmount || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-stone-800">
                          {formatCurrency(item.lineTotal || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Quotation-level fields (Discount, Valid Until, Payment Terms, Notes) */}
            <div className="p-6 bg-[#FCFAF7] border-t border-[#EAE5DA] space-y-6">
              {isPending && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Additional Discount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={additionalDiscount}
                      onChange={(e) => setAdditionalDiscount(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#87A96B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Valid Until Date
                    </label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#87A96B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="e.g. Net 30, Due upon receipt"
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#87A96B]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Notes to Customer / Special Terms
                    </label>
                    <textarea
                      rows="2"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Include payment link info, renewal clauses, or onboarding timeline..."
                      className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm text-stone-800 focus:outline-none focus:border-[#87A96B]"
                    />
                  </div>
                </div>
              )}

              {/* Financial Totals */}
              <div className="flex flex-col items-end pt-4 border-t border-[#EAE5DA]">
                <div className="w-full sm:w-80 space-y-2 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        isPending ? calculatedSummary.subtotal : quotation.subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-700">
                    <span>Total Discount</span>
                    <span className="font-semibold">
                      -
                      {formatCurrency(
                        isPending ? calculatedSummary.totalDiscount : quotation.discountAmount
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-stone-600">
                    <span>Total Tax</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        isPending ? calculatedSummary.totalTax : quotation.taxAmount
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-[#5A3E2B] pt-2 border-t border-[#EAE5DA]">
                    <span>Grand Total</span>
                    <span>
                      {formatCurrency(
                        isPending ? calculatedSummary.grandTotal : quotation.totalAmount
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Messages Thread & Activity Timeline */}
        <div className="space-y-6">
          {/* Messages / Inquiries */}
          <div className="bg-white border border-[#EAE5DA] rounded-2xl p-5 shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center gap-2 border-b border-[#EAE5DA] pb-3 mb-3">
              <MessageSquare className="w-4 h-4 text-[#87A96B]" />
              <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
                Conversation Thread
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-stone-400">
                  <MessageSquare className="w-8 h-8 stroke-1 mb-2" />
                  <p className="text-xs">
                    No conversation records yet. You can post a message to the customer below.
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.senderId === currentUserId || m.senderRole === "ADMIN";
                  return (
                    <div
                      key={m.id || idx}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="text-[11px] text-stone-400 mb-0.5 px-1">
                        {isMe ? "Admin (You)" : m.senderName || "Customer"} •{" "}
                        {formatDateTime(m.createdAt)}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          isMe
                            ? "bg-[#D5851F] text-white rounded-tr-none"
                            : "bg-[#FAF7F0] text-stone-800 border border-[#EAE5DA] rounded-tl-none"
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="pt-3 border-t border-[#EAE5DA] mt-3">
              <div className="relative">
                <textarea
                  rows="2"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Post message to customer..."
                  className="w-full bg-[#FAF7F0]/50 border border-stone-200 rounded-xl p-3 pr-10 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#87A96B] resize-none"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !newMessage.trim()}
                  className="absolute right-2.5 bottom-3.5 p-1.5 rounded-lg bg-[#87A96B] text-white hover:bg-[#729257] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sendingMsg ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white border border-[#EAE5DA] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#EAE5DA] pb-3">
              <History className="w-4 h-4 text-[#87A96B]" />
              <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
                Activity Audit Log
              </h2>
            </div>

            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAE5DA]">
              {activityLogs.length === 0 ? (
                <div className="text-xs text-stone-400 pl-8">
                  Requested on {formatDate(quotation.createdAt)}
                </div>
              ) : (
                activityLogs.map((log, idx) => (
                  <div key={log.id || idx} className="relative flex items-start pl-7 text-xs">
                    <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-[#87A96B] border-2 border-white ring-2 ring-[#87A96B]/20" />
                    <div>
                      <div className="font-semibold text-stone-700 capitalize">
                        {log.action?.toLowerCase().replace(/_/g, " ")}
                      </div>
                      <div className="text-stone-500 mt-0.5">{log.description}</div>
                      <div className="text-[10px] text-stone-400 mt-1">
                        {formatDateTime(log.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: ACCEPT CONFIRMATION */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EAE5DA] shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-3">
              <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Confirm & Issue Quotation</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-stone-600">
              Are you sure you want to approve this quotation with the configured pricing?
              The status will become <span className="font-semibold text-emerald-700">ACCEPTED</span> and
              an official PDF will be generated for the customer.
            </p>

            <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#EAE5DA] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Quotation ID:</span>
                <span className="font-semibold text-stone-800">{qNum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Grand Total:</span>
                <span className="font-bold text-[#5A3E2B] text-sm">
                  {formatCurrency(calculatedSummary.grandTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Validity:</span>
                <span className="font-semibold text-stone-800">
                  {validUntil ? formatDate(validUntil) : "Standard"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="px-4 py-2 border border-[#DDD6C6] bg-white rounded-xl text-xs font-semibold text-stone-600 hover:bg-[#F1EEE6]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleAcceptConfirm}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#87A96B] hover:bg-[#729257] text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Acceptance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT QUOTATION */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EAE5DA] shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-3">
              <h3 className="text-base font-bold text-red-700 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span>Reject Quotation Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Please state the reason for rejection. This reason will be recorded and visible
              to the customer.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Products currently out of regional service area or minimum user seats not met..."
                className="w-full bg-[#FAF7F0]/40 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-[#DDD6C6] bg-white rounded-xl text-xs font-semibold text-stone-600 hover:bg-[#F1EEE6]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={handleRejectConfirm}
                className="inline-flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REQUEST MORE INFORMATION */}
      {showRequestInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EAE5DA] shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-3">
              <h3 className="text-base font-bold text-blue-700 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                <span>Request Additional Information</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRequestInfoModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              The quotation status will be updated to <span className="font-semibold text-blue-600">NEEDS_INFORMATION</span> and
              your message will be added to the customer conversation thread.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Required Clarification / Questions <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="4"
                value={requestInfoMsg}
                onChange={(e) => setRequestInfoMsg(e.target.value)}
                placeholder="e.g. Could you please specify whether multi-currency billing or single entity invoice is preferred? Also clarify seat count for tier 2..."
                className="w-full bg-[#FAF7F0]/40 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRequestInfoModal(false)}
                className="px-4 py-2 border border-[#DDD6C6] bg-white rounded-xl text-xs font-semibold text-stone-600 hover:bg-[#F1EEE6]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !requestInfoMsg.trim()}
                onClick={handleRequestInfoConfirm}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Send Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
