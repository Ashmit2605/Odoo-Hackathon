<<<<<<< HEAD
const BASE = `${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/api/products`;

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const headers = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handle = async (response) => {
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The product API returned an invalid response.");
  }
  if (!response.ok) {
    const issues = result.issues
      ?.map((issue) => {
        const path = issue.path ? `${issue.path}: ` : "";
        return `${path}${issue.message}`;
      })
      .join("; ");
    throw new Error(
      issues
        ? `${result.error ?? "Request failed"}: ${issues}`
        : result.error ?? "Request failed"
    );
  }
  return result;
};

export const productService = {
  list: () => fetch(BASE, { headers: headers() }).then(handle),
  get: (id) => fetch(`${BASE}/${id}`, { headers: headers() }).then(handle),
  create: (body) =>
    fetch(BASE, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(handle),
  update: (id, body) =>
    fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(body),
    }).then(handle),
  remove: (id) =>
    fetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers: headers(),
    }).then(handle),
};
=======
import api from "./api.js";

export const getProducts = async () => (await api.get("/api/products")).data;
export const getProduct = async (id) => (await api.get(`/api/products/${id}`)).data;
export const createProduct = async (product) => (await api.post("/api/products", product)).data;
>>>>>>> 315d366 (done)
