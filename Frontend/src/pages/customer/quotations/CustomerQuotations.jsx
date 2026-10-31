import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { getMyQuotations, downloadQuotationPdf } from "../../../services/quotationService.js";
import QuotationStatusBadge from "../../../components/quotations/QuotationStatusBadge.jsx";
import Toast from "../../../components/Toast.jsx";
import { formatDate, formatCurrency } from "../../../utils/formatters.js";

export default function CustomerQuotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "info" });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyQuotations();
      const data = Array.isArray(res) ? res : res.data || res.quotations || [];
      setQuotations(data);
    } catch (err) {
      console.error("Failed to load quotations:", err);
      setError(err.message || "Failed to load quotations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = quotations.length;
    const pending = quotations.filter(
      (q) => q.status === "PENDING" || q.status === "NEEDS_INFORMATION"
    ).length;
    const accepted = quotations.filter((q) => q.status === "ACCEPTED").length;
    const rejected = quotations.filter((q) => q.status === "REJECTED").length;
    return { total, pending, accepted, rejected };
  }, [quotations]);

  // Filtering
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      // Status filter
      if (statusFilter !== "ALL" && q.status !== statusFilter) {
        return false;
      }

      // Search filter (number, notes, products)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const number = (q.quotationNumber || `QUO-${q.id}` || "").toLowerCase();
        const notes = (q.customerNotes || "").toLowerCase();
        const products = (q.items || [])
          .map((i) => i.productNameSnapshot || i.productName || i.product?.name || "")
          .join(" ")
          .toLowerCase();

        return number.includes(term) || notes.includes(term) || products.includes(term);
      }

      return true;
    });
  }, [quotations, statusFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredQuotations.length / pageSize) || 1;
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuotations.slice(start, start + pageSize);
  }, [filteredQuotations, currentPage, pageSize]);

  const handleDownloadPdf = async (e, quotation) => {
    e.stopPropagation();
    try {
      setDownloadingId(quotation.id);
      const blob = await downloadQuotationPdf(quotation.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quotation.quotationNumber || `quotation-${quotation.id}`}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Quotation PDF downloaded successfully", "success");
    } catch (err) {
      console.error("PDF download failed:", err);
      showToast(err.message || "Failed to download PDF", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const getProductsSummary = (quotation) => {
    if (!quotation.items || quotation.items.length === 0) return "—";
    const names = quotation.items.map(
      (i) => i.productNameSnapshot || i.productName || i.product?.name || "Product"
    );
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#5A3E2B]">
            Quotations
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Track requested quotations, view finalized pricing, and accept offers.
          </p>
        </div>

        <Link
          to="/customer/quotations/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#D5851F] text-white font-medium hover:bg-[#BD741A] transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Request a Quotation</span>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white border border-[#EAE5DA] rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F4F1E9] flex items-center justify-center text-[#5A3E2B] shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Total Quotations
            </div>
            <div className="text-2xl font-bold text-stone-800 mt-0.5">
              {stats.total}
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border border-[#EAE5DA] rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Pending / In Review
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-0.5">
              {stats.pending}
            </div>
          </div>
        </div>

        {/* Accepted */}
        <div className="bg-white border border-[#EAE5DA] rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Accepted
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">
              {stats.accepted}
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white border border-[#EAE5DA] rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Rejected
            </div>
            <div className="text-2xl font-bold text-red-600 mt-0.5">
              {stats.rejected}
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white border border-[#EAE5DA] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by ID, notes, or products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#FAF7F0]/40 border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-stone-700 placeholder-stone-400 text-sm focus:outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15 transition"
          />
        </div>

        {/* Status Dropdown Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-stone-500 text-sm font-medium">
            <Filter className="w-4 h-4 text-stone-400" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-stone-700 text-sm focus:outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="NEEDS_INFORMATION">Needs Information</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <button
            onClick={fetchQuotations}
            title="Refresh list"
            className="p-2.5 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-[#F1EEE6] transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Quotations Table / Content */}
      <div className="bg-white border border-[#EAE5DA] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-stone-100">
                <div className="h-4 bg-stone-200 rounded w-1/6"></div>
                <div className="h-4 bg-stone-200 rounded w-1/6"></div>
                <div className="h-4 bg-stone-200 rounded w-1/4"></div>
                <div className="h-4 bg-stone-200 rounded w-1/8"></div>
                <div className="h-6 bg-stone-200 rounded-full w-20"></div>
                <div className="h-8 bg-stone-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-stone-800">Failed to load quotations</h3>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">{error}</p>
            <button
              onClick={fetchQuotations}
              className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-xl transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F4F1E9] text-stone-400 mx-auto flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-stone-800">
              {searchTerm || statusFilter !== "ALL"
                ? "No matching quotations found"
                : "No quotations requested yet"}
            </h3>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "ALL"
                ? "Try adjusting your search criteria or resetting filters."
                : "Submit a quotation request to receive custom enterprise and plan pricing tailored to your needs."}
            </p>
            {searchTerm || statusFilter !== "ALL" ? (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                  setCurrentPage(1);
                }}
                className="mt-4 px-4 py-2 border border-stone-200 hover:bg-[#F1EEE6] text-stone-700 text-sm font-medium rounded-xl transition"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/customer/quotations/new"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#D5851F] hover:bg-[#BD741A] text-white text-sm font-medium rounded-xl transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Request a Quotation</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE5DA] bg-[#FCFAF7] text-xs font-semibold uppercase tracking-wider text-stone-500">
                  <th className="py-3.5 px-6">Quotation ID</th>
                  <th className="py-3.5 px-6">Requested Date</th>
                  <th className="py-3.5 px-6">Products / Items</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DA] text-sm text-stone-700">
                {paginatedQuotations.map((q) => {
                  const isAccepted = q.status === "ACCEPTED";
                  const qNum = q.quotationNumber || `QUO-${String(q.id).padStart(4, "0")}`;

                  return (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/customer/quotations/${q.id}`)}
                      className="hover:bg-[#FAF7F0] cursor-pointer transition"
                    >
                      <td className="py-4 px-6 font-semibold text-[#5A3E2B]">
                        {qNum}
                      </td>
                      <td className="py-4 px-6 text-stone-500">
                        {formatDate(q.createdAt)}
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate text-stone-600">
                        {getProductsSummary(q)}
                      </td>
                      <td className="py-4 px-6 font-medium text-stone-800">
                        {isAccepted ? formatCurrency(q.totalAmount) : "Pending"}
                      </td>
                      <td className="py-4 px-6">
                        <QuotationStatusBadge status={q.status} />
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Link
                          to={`/customer/quotations/${q.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#DDD6C6] bg-white rounded-lg text-xs font-medium text-stone-600 hover:bg-[#F1EEE6] transition shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>

                        {isAccepted && (
                          <button
                            type="button"
                            disabled={downloadingId === q.id}
                            onClick={(e) => handleDownloadPdf(e, q)}
                            title="Download PDF"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#87A96B]/15 text-[#2F4A1F] border border-[#87A96B]/30 hover:bg-[#87A96B]/25 rounded-lg text-xs font-medium transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{downloadingId === q.id ? "Saving..." : "PDF"}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {!loading && filteredQuotations.length > pageSize && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#EAE5DA] bg-[#FCFAF7] text-sm text-stone-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-stone-700">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-stone-700">
                {Math.min(currentPage * pageSize, filteredQuotations.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-stone-700">
                {filteredQuotations.length}
              </span>{" "}
              results
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-[#DDD6C6] bg-white rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F1EEE6] transition"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-stone-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-[#DDD6C6] bg-white rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F1EEE6] transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
