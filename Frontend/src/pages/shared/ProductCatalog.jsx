import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Package, Percent, RefreshCw, Search, Tag, ShoppingCart, FileText, X, CheckCircle } from "lucide-react";
import { productService } from "../../services/productService";
import { invoiceService } from "../../services/invoiceService";

const getLoadErrorMessage = (error) => {
  if (error instanceof TypeError) {
    return "Unable to connect to the product API. Start the backend and check VITE_API_URL.";
  }
  return error instanceof Error ? error.message : "Unable to load products.";
};

const formatPrice = (price) => {
  const amount = Number(price);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : `$${price}`;
};

const PAYMENT_METHODS = ['CARD', 'CASH', 'BANK_TRANSFER', 'UPI', 'OTHER'];

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [buyTarget, setBuyTarget] = useState(null); // { product, quantity, method, step }
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    productService.list()
      .then((result) => {
        if (cancelled) return;
        setProducts(result.data);
        setError("");
      })
      .catch((loadError) => {
        if (!cancelled) setError(getLoadErrorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBuyNow = async () => {
    if (!buyTarget) return;
    setSubmitting(true);
    setActionError("");
    try {
      const { data: invoice } = await invoiceService.buyNow(buyTarget.product.id, buyTarget.quantity);
      const { data: result } = await invoiceService.pay(invoice.id, buyTarget.method);
      setBuyTarget(null);
      setActionMsg(`Payment successful! Invoice ${result.invoice.invoiceNumber} is now PAID.`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestQuotation = async (product) => {
    setSubmitting(true);
    setActionError("");
    try {
      await invoiceService.requestQuotation(product.id, 1);
      setActionMsg(`Quotation requested! Invoice ${invoice.invoiceNumber} created. Our team will be in touch.`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await productService.list();
      setProducts(result.data);
      setError("");
    } catch (loadError) {
      setError(getLoadErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.productType, product.notes]
        .some((value) => value?.toLocaleLowerCase().includes(query))
    );
  }, [products, search]);

  return (
    <section className="min-h-full bg-[#FCFAF7] p-6 sm:p-8" style={{ fontFamily: "'Urbanist', sans-serif" }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#87A96B]">Catalog</p>
            <h1 className="mt-1 text-2xl font-bold text-stone-800">Products</h1>
            <p className="mt-1 text-sm text-stone-500">Browse the products currently available.</p>
          </div>
          <div className="flex gap-2">
            <label className="flex min-w-0 items-center gap-2 rounded-xl border border-[#DDD6C6] bg-white px-3 py-2 text-stone-400 focus-within:border-[#87A96B] sm:w-64">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="w-full bg-transparent text-sm text-stone-700 outline-none placeholder:text-stone-400"
              />
            </label>
            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              aria-label="Refresh products"
              className="rounded-xl border border-[#DDD6C6] bg-white p-2.5 text-stone-500 hover:bg-[#F4F1E9] disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
            <button type="button" onClick={loadProducts} className="text-sm font-semibold text-red-800 underline">
              Retry
            </button>
          </div>
        )}

        {loading && products.length === 0 ? (
          <div className="rounded-2xl border border-[#EAE5DA] bg-white px-6 py-16 text-center text-sm text-stone-500">
            Loading products…
          </div>
        ) : !error && visibleProducts.length === 0 ? (
          <div className="rounded-2xl border border-[#EAE5DA] bg-white px-6 py-16 text-center">
            <Package size={28} className="mx-auto mb-3 text-[#87A96B]" />
            <p className="font-semibold text-stone-700">
              {products.length ? "No matching products" : "No products available yet"}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {products.length ? "Try another search." : "Products will appear here when they are added to the catalog."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => {
              const activeDiscounts = (product.discounts ?? []).filter((discount) => discount.isActive);
              return (
                <article key={product.id} className="flex flex-col rounded-2xl border border-[#EAE5DA] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#87A96B]/10 text-[#63894A]">
                        <Package size={20} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-stone-800">{product.name}</h2>
                        <p className="mt-0.5 text-xs text-stone-500">{product.productType || "Product"}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-lg font-bold text-stone-800">{formatPrice(product.salesPrice)}</p>
                  </div>

                  {product.notes && <p className="mt-4 line-clamp-3 text-sm text-stone-600">{product.notes}</p>}

                  <div className="mt-4 space-y-2 border-t border-[#F1EEE6] pt-3">
                    {product.tax && (
                      <p className="flex items-center gap-2 text-xs text-stone-500">
                        <Tag size={14} className="text-[#87A96B]" />
                        {product.tax.name} ({product.tax.percentage}%)
                      </p>
                    )}
                    {product.variants?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {product.variants.map((variant) => (
                          <span key={variant.id} className="rounded-full bg-[#F4F1E9] px-2.5 py-1 text-xs text-stone-600">
                            {variant.variantName}
                            {Number(variant.extraPrice) > 0 ? ` (+${formatPrice(variant.extraPrice)})` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                    {activeDiscounts.map((discount) => (
                      <p key={discount.id} className="flex items-center gap-2 text-xs font-medium text-[#63894A]">
                        <Percent size={14} />
                        {discount.name}: {discount.value}{discount.type === "PERCENTAGE" ? "%" : ""}
                      </p>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setBuyTarget({ product, quantity: 1, method: 'CARD' })}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#87A96B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6d8f55] transition"
                    >
                      <ShoppingCart size={14} /> Buy Now
                    </button>
                    <button
                      onClick={() => handleRequestQuotation(product)}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#87A96B] px-3 py-2 text-xs font-semibold text-[#63894A] hover:bg-[#F4F1E9] transition disabled:opacity-50"
                    >
                      <FileText size={14} /> Get Quote
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Action feedback */}
      {(actionMsg || actionError) && (
        <div className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border px-5 py-4 shadow-lg flex items-start gap-3 ${
          actionError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-[#E8EEDC] border-[#C9D7BA] text-[#496A36]'
        }`}>
          {actionError ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
          <p className="text-sm flex-1">{actionMsg || actionError}</p>
          <button onClick={() => { setActionMsg(""); setActionError(""); }}><X size={16} /></button>
        </div>
      )}

      {/* Buy Now modal */}
      {buyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setBuyTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone-800">Buy Now</h2>
              <button onClick={() => setBuyTarget(null)}><X size={18} /></button>
            </div>
            <p className="font-medium text-stone-700 mb-1">{buyTarget.product.name}</p>
            <p className="text-sm text-stone-500 mb-4">{formatPrice(buyTarget.product.salesPrice)} each</p>

            <label className="block mb-3">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Quantity</span>
              <input type="number" min={1} value={buyTarget.quantity}
                onChange={(e) => setBuyTarget((t) => ({ ...t, quantity: Math.max(1, Number(e.target.value)) }))}
                className="mt-1 w-full rounded-lg border border-[#DDD6C6] px-3 py-2 text-sm focus:border-[#87A96B] focus:outline-none" />
            </label>

            <label className="block mb-5">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Payment Method</span>
              <select value={buyTarget.method}
                onChange={(e) => setBuyTarget((t) => ({ ...t, method: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#DDD6C6] px-3 py-2 text-sm focus:border-[#87A96B] focus:outline-none">
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </label>

            {actionError && <p className="mb-3 text-xs text-red-600">{actionError}</p>}

            <div className="flex gap-3">
              <button onClick={() => setBuyTarget(null)}
                className="flex-1 rounded-xl border border-[#DDD6C6] py-2.5 text-sm font-semibold text-stone-600 hover:bg-[#F4F1E9]">
                Cancel
              </button>
              <button onClick={handleBuyNow} disabled={submitting}
                className="flex-1 rounded-xl bg-[#87A96B] py-2.5 text-sm font-semibold text-white hover:bg-[#6d8f55] disabled:opacity-50">
                {submitting ? 'Processing…' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
