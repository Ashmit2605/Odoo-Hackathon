<<<<<<< HEAD
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const getHeaders = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? { Authorization: "Bearer " + token } : {};
};

async function request(path) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers: getHeaders() });
  } catch {
    throw new Error("Unable to connect to the customer API. Check that the backend is running.");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The customer API returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(result.error || "Unable to load customers.");
  }
  return result;
}

export async function getCustomers(role = "STAFF") {
  const result = role === "ADMIN"
    ? await request("/api/customers?limit=100")
    : await request("/api/staff/customers");
  const customers = Array.isArray(result) ? result : result.data;
  if (!Array.isArray(customers)) {
    throw new Error("The customer API returned an invalid customer list.");
  }
  return customers;
}

export async function getCustomer(id, role = "STAFF") {
  const result = role === "ADMIN"
    ? await request(`/api/customers/${encodeURIComponent(id)}`)
    : await request(`/api/staff/customers/${encodeURIComponent(id)}`);
  return result.data ?? result;
}
=======
import api from "./api.js";

export const getCustomers = async () => (await api.get("/api/customers")).data;
export const getCustomer = async (id) => (await api.get(`/api/customers/${id}`)).data;
export const createCustomer = async (customer) => (await api.post("/api/customers", customer)).data;
>>>>>>> 315d366 (done)
