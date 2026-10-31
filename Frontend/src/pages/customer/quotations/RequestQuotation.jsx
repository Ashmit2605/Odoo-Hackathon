import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Trash2,
  ArrowLeft,
  Send,
  Building,
  Mail,
  Phone,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import {
  createQuotation,
  getProducts,
  getPlans,
  getProductVariants,
} from "../../../services/quotationService.js";
import Toast from "../../../components/Toast.jsx";
import { formatCurrency } from "../../../utils/formatters.js";

export default function RequestQuotation() {
  const navigate = useNavigate();

  // User and customer info from storage
  const [userInfo, setUserInfo] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);

  // Catalog state
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [variantsCache, setVariantsCache] = useState({});
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Form state
  const [customerNotes, setCustomerNotes] = useState("");
  const [items, setItems] = useState([
    {
      id: 1,
      productId: "",
      variantId: "",
      planId: "",
      quantity: 1,
      expectedStartDate: new Date().toISOString().split("T")[0],
      billingCycle: "",
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ message: "", type: "info" });

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      const c = JSON.parse(localStorage.getItem("customer") || "null");
      setUserInfo(u);
      setCustomerInfo(c);
    } catch {
      // ignore JSON parse error
    }

    async function loadCatalog() {
      try {
        setCatalogLoading(true);
        const [prodRes, planRes] = await Promise.allSettled([
          getProducts(),
          getPlans(),
        ]);

        if (prodRes.status === "fulfilled") {
          const prods = Array.isArray(prodRes.value)
            ? prodRes.value
            : prodRes.value.data || [];
          setAvailableProducts(prods);
        }

        if (planRes.status === "fulfilled") {
          const plans = Array.isArray(planRes.value)
            ? planRes.value
            : planRes.value.data || [];
          setAvailablePlans(plans);
        }
      } catch (err) {
        console.error("Failed to load catalog data:", err);
      } finally {
        setCatalogLoading(false);
      }
    }

    loadCatalog();
  }, []);

  // Fetch variants when a product is selected
  const handleProductChange = async (index, productId) => {
    const updated = [...items];
    updated[index].productId = productId;
    updated[index].variantId = ""; // reset variant

    setItems(updated);

    if (!productId) return;

    // Check if variants already cached
    if (variantsCache[productId]) return;

    // First check if product in availableProducts already has variants
    const prod = availableProducts.find((p) => String(p.id) === String(productId));
    if (prod && Array.isArray(prod.variants) && prod.variants.length > 0) {
      setVariantsCache((prev) => ({ ...prev, [productId]: prod.variants }));
      return;
    }

    try {
      const res = await getProductVariants(productId);
      const variants = Array.isArray(res) ? res : res.data || [];
      const filtered = variants.filter(
        (v) => !v.productId || String(v.productId) === String(productId)
      );
      setVariantsCache((prev) => ({
        ...prev,
        [productId]: filtered.length > 0 ? filtered : variants,
      }));
    } catch (err) {
      console.warn("Could not load variants for product", productId, err);
      setVariantsCache((prev) => ({ ...prev, [productId]: [] }));
    }
  };

  const handlePlanChange = (index, planId) => {
    const updated = [...items];
    updated[index].planId = planId;
    const plan = availablePlans.find((p) => String(p.id) === String(planId));
    updated[index].billingCycle = plan ? plan.billingFrequency || "MONTHLY" : "";
    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        productId: "",
        variantId: "",
        planId: "",
        quantity: 1,
        expectedStartDate: new Date().toISOString().split("T")[0],
        billingCycle: "",
      },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!items || items.length === 0) {
      errs.general = "Please add at least one product.";
    }

    items.forEach((item, idx) => {
      if (!item.productId) {
        errs[`product_${idx}`] = "Product is required";
      }
      if (!item.planId) {
        errs[`plan_${idx}`] = "Subscription plan is required";
      }
      if (!item.quantity || Number(item.quantity) < 1) {
        errs[`quantity_${idx}`] = "Quantity must be at least 1";
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setToast({
        message: "Please fix all validation errors before submitting.",
        type: "error",
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerNotes: customerNotes.trim(),
        items: items.map((item) => ({
          productId: Number(item.productId),
          variantId: item.variantId ? Number(item.variantId) : null,
          planId: Number(item.planId),
          quantity: Number(item.quantity),
          expectedStartDate: item.expectedStartDate || null,
        })),
      };

      const res = await createQuotation(payload);
      setToast({
        message: "Quotation request submitted successfully!",
        type: "success",
      });

      const newId = res.id || res.data?.id || res.quotation?.id;
      setTimeout(() => {
        if (newId) {
          navigate(`/customer/quotations/${newId}`);
        } else {
          navigate("/customer/quotations");
        }
      }, 1200);
    } catch (err) {
      console.error("Submission error:", err);
      setToast({
        message: err.message || "Failed to submit quotation request. Please try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const customerName = customerInfo?.name || userInfo?.name || "Valued Customer";
  const customerEmail = customerInfo?.email || userInfo?.email || "—";
  const companyName = customerInfo?.companyName || "—";
  const phone = customerInfo?.phone || "—";
  const address = customerInfo?.address || "—";

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />

      {/* Back button & page header */}
      <div>
        <Link
          to="/customer/quotations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-800 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-[#5A3E2B]">
          Request a Quotation
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Specify your desired software products, tier plans, and requirements.
          Our team will evaluate custom volume rates and prepare your official quotation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information Card (Auto-populated) */}
        <div className="bg-white border border-[#EAE5DA] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-3 mb-4">
            <h2 className="text-base font-semibold text-stone-800 flex items-center gap-2">
              <User className="w-4 h-4 text-[#87A96B]" />
              <span>Customer Details</span>
            </h2>
            <span className="text-xs bg-[#FAF7F0] text-stone-500 px-2.5 py-1 rounded-md border border-[#EAE5DA]">
              Auto-filled from profile
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs font-medium text-stone-400 block mb-0.5">Contact Name</span>
              <div className="text-stone-800 font-medium flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{customerName}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-stone-400 block mb-0.5">Email Address</span>
              <div className="text-stone-800 font-medium flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{customerEmail}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-stone-400 block mb-0.5">Company Name</span>
              <div className="text-stone-800 font-medium flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{companyName}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-stone-400 block mb-0.5">Phone Number</span>
              <div className="text-stone-800 font-medium flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{phone}</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <span className="text-xs font-medium text-stone-400 block mb-0.5">Billing Address</span>
              <div className="text-stone-800 font-medium flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Items Section */}
        <div className="bg-white border border-[#EAE5DA] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE5DA] pb-3">
            <div>
              <h2 className="text-base font-semibold text-stone-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#87A96B]" />
                <span>Requested Products & Plans</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Add one or more products you wish to subscribe to.
              </p>
            </div>

            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#87A96B]/15 text-[#2F4A1F] border border-[#87A96B]/30 hover:bg-[#87A96B]/25 rounded-xl text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Product</span>
            </button>
          </div>

          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {catalogLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-stone-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-[#87A96B]" />
              <span>Loading products and subscription plans...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const variants = variantsCache[item.productId] || [];
                const prodErr = errors[`product_${index}`];
                const planErr = errors[`plan_${index}`];
                const qtyErr = errors[`quantity_${index}`];

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-[#FAF7F0]/40 border border-[#EAE5DA] rounded-xl relative transition space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="text-stone-400 hover:text-red-600 transition p-1 rounded-lg"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Product selection */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Product <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          className={`w-full bg-white border ${
                            prodErr ? "border-red-400 ring-1 ring-red-400" : "border-stone-200"
                          } rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15`}
                        >
                          <option value="">Select a Product</option>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.salesPrice ? `(${formatCurrency(p.salesPrice)})` : ""}
                            </option>
                          ))}
                        </select>
                        {prodErr && <p className="text-xs text-red-500 mt-1">{prodErr}</p>}
                      </div>

                      {/* Variant selection */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Variant / Edition{" "}
                          <span className="text-stone-400 font-normal">(Optional)</span>
                        </label>
                        <select
                          value={item.variantId}
                          disabled={!item.productId || variants.length === 0}
                          onChange={(e) => handleItemChange(index, "variantId", e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed focus:outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15"
                        >
                          <option value="">
                            {variants.length > 0 ? "Standard / Default" : "No variants available"}
                          </option>
                          {variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.variantName || v.name}{" "}
                              {v.extraPrice && Number(v.extraPrice) > 0
                                ? `(+${formatCurrency(v.extraPrice)})`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Plan selection */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Subscription Plan <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.planId}
                          onChange={(e) => handlePlanChange(index, e.target.value)}
                          className={`w-full bg-white border ${
                            planErr ? "border-red-400 ring-1 ring-red-400" : "border-stone-200"
                          } rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15`}
                        >
                          <option value="">Select a Plan</option>
                          {availablePlans.map((pl) => (
                            <option key={pl.id} value={pl.id}>
                              {pl.name} ({pl.billingFrequency || "Monthly"})
                            </option>
                          ))}
                        </select>
                        {planErr && <p className="text-xs text-red-500 mt-1">{planErr}</p>}
                      </div>

                      {/* Billing Cycle indicator */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Billing Frequency
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={item.billingCycle || "Auto-set by Plan"}
                          className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-500 cursor-not-allowed"
                        />
                      </div>

                      {/* Quantity input */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Quantity / Users <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className={`w-full bg-white border ${
                            qtyErr ? "border-red-400 ring-1 ring-red-400" : "border-stone-200"
                          } rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15`}
                        />
                        {qtyErr && <p className="text-xs text-red-500 mt-1">{qtyErr}</p>}
                      </div>

                      {/* Expected Start Date */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Expected Start Date
                        </label>
                        <input
                          type="date"
                          value={item.expectedStartDate}
                          onChange={(e) =>
                            handleItemChange(index, "expectedStartDate", e.target.value)
                          }
                          className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Additional Notes Card */}
        <div className="bg-white border border-[#EAE5DA] rounded-2xl p-6 shadow-sm space-y-3">
          <label className="block text-sm font-semibold text-stone-800">
            Special Requirements / Notes to Brightloop Team
          </label>
          <p className="text-xs text-stone-500">
            Mention any volume requirements, payment terms preferred, or integration requests.
          </p>
          <textarea
            rows="4"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="e.g., We are onboarding 50 team members across 2 branch offices starting next month. Please include multi-tier discount options and annual prepayment terms."
            className="w-full bg-[#FAF7F0]/30 border border-stone-200 rounded-xl p-3.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#87A96B] focus:ring-2 focus:ring-[#87A96B]/15 transition"
          />
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/customer/quotations"
            className="px-5 py-2.5 border border-[#DDD6C6] bg-white rounded-xl text-sm font-medium text-stone-600 hover:bg-[#F1EEE6] transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D5851F] hover:bg-[#BD741A] text-white text-sm font-semibold rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Quotation Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
