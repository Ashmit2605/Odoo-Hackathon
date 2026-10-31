// Staff API client. Adjust BASE if your Express app mounts routes under a different prefix.
const API_ROOT = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BASE = `${API_ROOT}/staff`;

const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    /* empty body */
  }
  if (!response.ok) {
    throw new Error(json?.message || json?.error || `Request failed (${response.status})`);
  }
  return json?.data ?? json;
}

export const staffService = {
  // 1. Dashboard
  getDashboard: () => request("/dashboard"),

  // 2. Customers
  listCustomers: () => request("/customers"),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (payload) => request("/customers", { method: "POST", body: payload }),

  // 3. Invoices
  listInvoices: () => request("/invoices"),
  confirmInvoice: (id) => request(`/invoices/${id}/confirm`, { method: "PATCH" }),

  // 4. Payments
  recordPayment: (payload) => request("/payments", { method: "POST", body: payload }),

  // 5. Overdue invoices
  listOverdueInvoices: () => request("/overdue-invoices"),

  // 6. Quotations
  createQuotation: (payload) => request("/quotations", { method: "POST", body: payload }),

  // 7. Subscriptions
  confirmSubscription: (id) => request(`/subscriptions/${id}/confirm`, { method: "PATCH" }),

  // 8. Profile
  updateProfile: (payload) => request("/profile", { method: "PUT", body: payload }),
};