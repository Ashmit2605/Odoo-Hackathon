// The staff API has no "list quotations/subscriptions" endpoint yet, so quotations
// created from this browser are remembered locally. This lets the Quotations and
// Subscriptions pages show them and confirm them. Replace with API calls when available.
const KEY = "staff_created_quotations";

export const loadStoredQuotations = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveStoredQuotations = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable */
  }
};

export const addStoredQuotation = (quotation) => {
  const next = [quotation, ...loadStoredQuotations().filter((q) => q.id !== quotation.id)];
  saveStoredQuotations(next);
  return next;
};

export const updateStoredQuotation = (id, patch) => {
  const next = loadStoredQuotations().map((q) => (q.id === id ? { ...q, ...patch } : q));
  saveStoredQuotations(next);
  return next;
};