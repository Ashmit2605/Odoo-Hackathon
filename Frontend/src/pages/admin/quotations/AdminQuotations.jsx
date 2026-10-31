import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight,
  Building,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { getAdminQuotations } from "../../../services/quotationService.js";
import QuotationStatusBadge from "../../../components/quotations/QuotationStatusBadge.jsx";
import Toast from "../../../components/Toast.jsx";
import { formatDate, formatCurrency } from "../../../utils/formatters.js";

export default function AdminQuotations() {
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [serverPagination, setServerPagination] = useState(null);

  const [toast, setToast] = useState({ message: "", type: "info" });

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminQuotations({
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        page,
        limit,
      });

      const list = Array.isArray(res) ? res : res.data || res.quotations || [];
      setQuotations(list);

      if (res.pagination) {
        setServerPagination(res.pagination);
      } else {
        setServerPagination(null);
      }
    } catch (err) {
      console.error("Failed to load admin quotations:", err);
      setError(err.message || "Failed to load quotations.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, limit]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // Fallback client-side filtering if server didn't filter
  const displayedQuotations = useMemo(() => {
    if (serverPagination) {
      return quotations;
    }

    return quotations.filter((q) => {
      if (statusFilter !== "ALL" && q.status !== statusFilter) return false;

      if (search.trim()) {
        const term = search.toLowerCase();
        const num = (q.quotationNumber || `QUO-${q.id}`).toLowerCase();
        const custName = (q.customer?.name || q.requestedByName || "").toLowerCase();
        const custEmail = (q.customer?.email || q.requestedByEmail || "").toLowerCase();
        const custCompany = (q.customer?.companyName || "").toLowerCase();
        const notes = (q.customerNotes || "").toLowerCase();

        return (
          num.includes(term) ||
          custName.includes(term) ||
          custEmail.includes(term) ||
          custCompany.includes(term) ||
          notes.includes(term)
        );
      }

      return true;
    });
  }, [quotations, serverPagination, statusFilter, search]);

  // Overall stats
  const stats = useMemo(() => {
    const total = quotations.length;
    const pending = quotations.filter(
      (q) => q.status === "PENDING" || q.status === "NEEDS_INFORMATION"
    ).length;
    const accepted = quotations.filter((q) => q.status === "ACCEPTED").length;
    const rejected = quotations.filter((q) => q.status === "REJECTED").length;
    return { total, pending, accepted, rejected };
  }, [quotations]);

  // Pagination calculation
  const totalItems = serverPagination?.total || displayedQuotations.length;
  const totalPages = serverPagination?.totalPages || Math.ceil(displayedQuotations.length / limit) || 1;
  const paginatedList = useMemo(() => {
    if (serverPagination) return displayedQuotations;
    const start = (page - 1) * limit;
    return displayedQuotations.slice(start, start + limit);
  }, [displayedQuotations, serverPagination, page, limit]);

  const getProductsSummary = (q) => {
    if (!q.items || q.items.length === 0) return "—";
    const names = q.items.map(
      (i) => i.productNameSnapshot || i.productName || i.product?.name || "Product"
    );
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
  };

  const getCustomerName = (q) => q.customer?.name || q.requestedByName || "Customer";
  const getCustomerEmail = (q) => q.customer?.email || q.requestedByEmail || "—";
  const getCustomerCompany = (q) => q.customer?.companyName || "—";
  const getCustomerPhone = (q) => q.customer?.phone || "—";

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
            Quotation Management
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Review incoming subscription quotation requests, configure custom pricing, and issue proposals.
          </p>
        </div>

        <button
          onClick={fetchQuotations}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#DDD6C6] bg-white rounded-xl text-stone-600 text-sm font-medium hover:bg-[#F1EEE6] transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="bg-white border border-[#EAE5DA] rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F4F1E9] flex items-center justify-center text-[#5A3E2B] shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Total Requests
            </div>
            <div className="text-2xl font-bold text-stone-800 mt-0.5">
              {stats.total}
            </div>
          </div>
        </div>

        {/* Pending Review */}
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

        {/* Accepted / Confirmed */}
        <div className="bg-white border border-[#EAE5DA] rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Accepted Proposals
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

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#EAE5DA] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by ID, customer name, company, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#FAF7F0]/40 border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-stone-700 placeholder-stone-400 text-sm focus:outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15 transition"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-stone-500 text-sm font-medium">
            <Filter className="w-4 h-4 text-stone-400" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
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
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#EAE5DA] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-stone-100">
                <div className="h-4 bg-stone-200 rounded w-1/8"></div>
                <div className="h-4 bg-stone-200 rounded w-1/5"></div>
                <div className="h-4 bg-stone-200 rounded w-1/6"></div>
                <div className="h-4 bg-stone-200 rounded w-1/6"></div>
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
              className="mt-4 px-4 py-2 bg-[#D5851F] hover:bg-[#BD741A] text-white text-sm font-medium rounded-xl transition"
            >
              Try Again
            </button>
          </div>
        ) : paginatedList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F4F1E9] text-stone-400 mx-auto flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-stone-800">No quotation requests found</h3>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== "ALL"
                ? "No records matched your search or status filter."
                : "Customer quotation requests will appear here when submitted."}
            </p>
            {(search || statusFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setPage(1);
                }}
                className="mt-4 px-4 py-2 border border-stone-200 hover:bg-[#F1EEE6] text-stone-700 text-sm font-medium rounded-xl transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE5DA] bg-[#FCFAF7] text-xs font-semibold uppercase tracking-wider text-stone-500">
                  <th className="py-3.5 px-6">Quotation ID</th>
                  <th className="py-3.5 px-6">Customer & Company</th>
                  <th className="py-3.5 px-6">Contact</th>
                  <th className="py-3.5 px-6">Requested Date</th>
                  <th className="py-3.5 px-6">Products</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DA] text-sm text-stone-700">
                {paginatedList.map((q) => {
                  const qNum = q.quotationNumber || `QUO-${String(q.id).padStart(4, "0")}`;
                  const isPending = q.status === "PENDING" || q.status === "NEEDS_INFORMATION";

                  return (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/admin/quotations/${q.id}`)}
                      className="hover:bg-[#FAF7F0] cursor-pointer transition"
                    >
                      <td className="py-4 px-6 font-semibold text-[#5A3E2B]">
                        {qNum}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-stone-800">
                          {getCustomerName(q)}
                        </div>
                        <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{getCustomerCompany(q)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs text-stone-600 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{getCustomerEmail(q)}</span>
                        </div>
                        {getCustomerPhone(q) !== "—" && (
                          <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{getCustomerPhone(q)}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-stone-500 text-xs">
                        {formatDate(q.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-stone-600 max-w-xs truncate text-xs">
                        {getProductsSummary(q)}
                      </td>
                      <td className="py-4 px-6">
                        <QuotationStatusBadge status={q.status} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/admin/quotations/${q.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            isPending
                              ? "bg-[#D5851F] text-white hover:bg-[#BD741A] shadow-sm"
                              : "border border-[#DDD6C6] bg-white text-stone-600 hover:bg-[#F1EEE6]"
                          }`}
                        >
                          {isPending ? (
                            <>
                              <span>Process</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </>
                          )}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {!loading && totalItems > limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#EAE5DA] bg-[#FCFAF7] text-sm text-stone-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-stone-700">
                {(page - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-stone-700">
                {Math.min(page * limit, totalItems)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-stone-700">{totalItems}</span>{" "}
              results
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-[#DDD6C6] bg-white rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F1EEE6] transition"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-stone-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
