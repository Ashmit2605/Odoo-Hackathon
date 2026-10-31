import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Calendar,
  Clock,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Send,
  History,
  AlertTriangle,
  CheckCircle,
  FileText,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import {
  getQuotation,
  addMessage,
  downloadQuotationPdf,
} from "../../../services/quotationService.js";
import QuotationStatusBadge from "../../../components/quotations/QuotationStatusBadge.jsx";
import Toast from "../../../components/Toast.jsx";
import { formatDate, formatDateTime, formatCurrency } from "../../../utils/formatters.js";

export default function CustomerQuotationDetails() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Message thread state
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });

  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")?.id;
    } catch {
      return null;
    }
  })();

  const fetchQuotationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getQuotation(id);
      const data = res.data || res.quotation || res;
      setQuotation(data);
    } catch (err) {
      console.error("Failed to load quotation:", err);
      setError(err.message || "Quotation could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchQuotationData();
    }
  }, [id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);
      await addMessage(id, newMessage.trim());
      setNewMessage("");
      setToast({ message: "Message sent successfully", type: "success" });
      // Refresh to update thread and activity log
      await fetchQuotationData();
    } catch (err) {
      console.error("Failed to send message:", err);
      setToast({ message: err.message || "Failed to send message", type: "error" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await downloadQuotationPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quotation.quotationNumber || `quotation-${id}`}.pdf`;
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
          to="/customer/quotations"
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
            onClick={fetchQuotationData}
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
  const isNeedsInfo = quotation.status === "NEEDS_INFORMATION";
  const isPending = quotation.status === "PENDING";

  const customer = quotation.customer || {};
  const items = quotation.items || [];
  const messages = quotation.messages || [];
  const activityLogs = quotation.activityLogs || quotation.logs || [];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />

      {/* Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/customer/quotations"
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
          </div>
        </div>

        {/* Action Button: Download PDF if accepted */}
        {isAccepted && (
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#87A96B] hover:bg-[#729257] text-white font-medium text-sm transition shadow-sm disabled:opacity-50"
          >
            {downloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download Official PDF</span>
          </button>
        )}
      </div>

      {/* Status Warning / Info Banners */}
      {isNeedsInfo && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold block">Additional Information Requested</span>
            <span>
              Our sales team requires more details regarding your subscription request.
              Please check the messages below and reply at your convenience.
            </span>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold block">Quotation Rejected</span>
            <span>
              Reason: {quotation.rejectionReason || "No specific reason provided."}
            </span>
          </div>
        </div>
      )}

      {isAccepted && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold block">Quotation Finalized & Accepted</span>
            <span>
              This quotation has been officially approved. You can download the PDF
              or contact your account manager for contract execution.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer info, Items, Pricing Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info card */}
          <div className="bg-white border border-[#EAE5DA] rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wider">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-stone-700">
                <User className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="font-medium">{customer.name || quotation.requestedByName || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="truncate">{customer.email || quotation.requestedByEmail || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <Building className="w-4 h-4 text-stone-400 shrink-0" />
                <span>{customer.companyName || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                <span>{customer.phone || "—"}</span>
              </div>
              {customer.address && (
                <div className="sm:col-span-2 flex items-start gap-2 text-stone-700">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Requested Items Table */}
          <div className="bg-white border border-[#EAE5DA] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EAE5DA] bg-[#FCFAF7] flex items-center justify-between">
              <h2 className="text-base font-semibold text-stone-800">
                Quotation Line Items
              </h2>
              <span className="text-xs text-stone-500 font-medium">
                {items.length} {items.length === 1 ? "Item" : "Items"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE5DA] bg-[#FAF7F0]/60 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    <th className="py-3 px-5">Product & Details</th>
                    <th className="py-3 px-4">Plan / Cycle</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    {isAccepted && <th className="py-3 px-3 text-right">Tax</th>}
                    {isAccepted && <th className="py-3 px-3 text-right">Discount</th>}
                    <th className="py-3 px-5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5DA] text-sm text-stone-700">
                  {items.map((item, idx) => {
                    const prodName =
                      item.productNameSnapshot ||
                      item.productName ||
                      item.product?.name ||
                      `Item ${idx + 1}`;
                    const planName =
                      item.planNameSnapshot ||
                      item.planName ||
                      item.plan?.name ||
                      "—";
                    const cycle =
                      item.billingCycleSnapshot ||
                      item.plan?.billingFrequency ||
                      "—";
                    const variantName =
                      item.variantName || item.variant?.variantName || null;

                    return (
                      <tr key={item.id || idx} className="hover:bg-[#FAF7F0]/40">
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-stone-800">{prodName}</div>
                          {variantName && (
                            <div className="text-xs text-stone-500">
                              Variant: {variantName}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          <div>{planName}</div>
                          <div className="text-xs text-stone-400 capitalize">{cycle}</div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-medium">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right text-stone-600 font-medium">
                          {isAccepted ? formatCurrency(item.unitPrice) : "TBD"}
                        </td>
                        {isAccepted && (
                          <td className="py-3.5 px-3 text-right text-stone-500 text-xs">
                            {formatCurrency(item.taxAmount || 0)}
                          </td>
                        )}
                        {isAccepted && (
                          <td className="py-3.5 px-3 text-right text-stone-500 text-xs">
                            {Number(item.discount) > 0
                              ? `-${formatCurrency(item.discount)}`
                              : "—"}
                          </td>
                        )}
                        <td className="py-3.5 px-5 text-right font-semibold text-stone-800">
                          {isAccepted
                            ? formatCurrency(item.lineTotal || item.amount || 0)
                            : "Pending"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-6 bg-[#FCFAF7] border-t border-[#EAE5DA] flex flex-col items-end">
              <div className="w-full sm:w-80 space-y-2 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {isAccepted ? formatCurrency(quotation.subtotal) : "Pending"}
                  </span>
                </div>

                {isAccepted && Number(quotation.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="font-medium">
                      -{formatCurrency(quotation.discountAmount)}
                    </span>
                  </div>
                )}

                {isAccepted && (
                  <div className="flex justify-between text-stone-600">
                    <span>Tax</span>
                    <span className="font-medium">
                      {formatCurrency(quotation.taxAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold text-[#5A3E2B] pt-2 border-t border-[#EAE5DA]">
                  <span>Total Amount</span>
                  <span>
                    {isAccepted ? formatCurrency(quotation.totalAmount) : "Pending Review"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Terms card */}
          {(quotation.customerNotes || quotation.adminNotes || quotation.paymentTerms) && (
            <div className="bg-white border border-[#EAE5DA] rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wider">
                Notes & Terms
              </h3>

              {quotation.customerNotes && (
                <div>
                  <span className="text-xs font-semibold text-stone-400 block mb-1">
                    Your Requirements / Request Notes:
                  </span>
                  <p className="text-sm text-stone-700 bg-[#FAF7F0] p-3 rounded-xl border border-[#EAE5DA]">
                    {quotation.customerNotes}
                  </p>
                </div>
              )}

              {quotation.adminNotes && (
                <div>
                  <span className="text-xs font-semibold text-stone-400 block mb-1">
                    Brightloop Team Notes:
                  </span>
                  <p className="text-sm text-stone-700 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    {quotation.adminNotes}
                  </p>
                </div>
              )}

              {quotation.paymentTerms && (
                <div>
                  <span className="text-xs font-semibold text-stone-400 block mb-1">
                    Payment Terms:
                  </span>
                  <p className="text-sm text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200">
                    {quotation.paymentTerms}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Messages Thread & Activity Timeline */}
        <div className="space-y-6">
          {/* Messages & Inquiries Card */}
          <div className="bg-white border border-[#EAE5DA] rounded-2xl p-5 shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center gap-2 border-b border-[#EAE5DA] pb-3 mb-3">
              <MessageSquare className="w-4 h-4 text-[#87A96B]" />
              <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
                Conversation
              </h2>
            </div>

            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-stone-400">
                  <MessageSquare className="w-8 h-8 stroke-1 mb-2" />
                  <p className="text-xs">
                    No messages yet. Send an inquiry or clarification to our pricing desk below.
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.senderId === currentUserId || m.senderRole === "CUSTOMER";
                  return (
                    <div
                      key={m.id || idx}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="text-[11px] text-stone-400 mb-0.5 px-1">
                        {isMe ? "You" : m.senderName || "Brightloop Staff"} •{" "}
                        {formatDateTime(m.createdAt)}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          isMe
                            ? "bg-[#87A96B] text-white rounded-tr-none"
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

            {/* Reply form */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-[#EAE5DA] mt-3">
              <div className="relative">
                <textarea
                  rows="2"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type message to pricing desk..."
                  className="w-full bg-[#FAF7F0]/50 border border-stone-200 rounded-xl p-3 pr-10 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#87A96B] focus:ring-1 focus:ring-[#87A96B]/20 resize-none"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="absolute right-2.5 bottom-3.5 p-1.5 rounded-lg bg-[#D5851F] text-white hover:bg-[#BD741A] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline Card */}
          <div className="bg-white border border-[#EAE5DA] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#EAE5DA] pb-3">
              <History className="w-4 h-4 text-[#87A96B]" />
              <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
                Activity History
              </h2>
            </div>

            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAE5DA]">
              {activityLogs.length === 0 ? (
                <div className="text-xs text-stone-400 pl-8">
                  Quotation requested on {formatDate(quotation.createdAt)}
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
    </div>
  );
}
