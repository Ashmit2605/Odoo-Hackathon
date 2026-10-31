const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(url, options = {}) {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  // For PDF downloads, return blob
  if (res.headers.get('content-type')?.includes('application/pdf')) {
    return res.blob();
  }

  return res.json();
}

/**
 * Customer quotation endpoints
 */
export async function createQuotation(data) {
  return request('/quotations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyQuotations() {
  return request('/quotations/my');
}

export async function getQuotation(id) {
  return request(`/quotations/${id}`);
}

export async function addMessage(id, message) {
  return request(`/quotations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function downloadQuotationPdf(id) {
  return request(`/quotations/${id}/pdf`, {
    method: 'GET',
    headers: { Accept: 'application/pdf' },
  });
}

/**
 * Admin quotation endpoints
 */
export async function getAdminQuotations(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);

  const qs = query.toString();
  return request(`/admin/quotations${qs ? `?${qs}` : ''}`);
}

export async function getAdminQuotation(id) {
  return request(`/admin/quotations/${id}`);
}

export async function acceptQuotation(id, data = {}) {
  return request(`/admin/quotations/${id}/accept`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function rejectQuotation(id, reason) {
  return request(`/admin/quotations/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify(typeof reason === 'string' ? { reason } : reason),
  });
}

export async function requestMoreInfo(id, message) {
  return request(`/admin/quotations/${id}/request-information`, {
    method: 'PUT',
    body: JSON.stringify(typeof message === 'string' ? { message } : message),
  });
}

export async function downloadAdminQuotationPdf(id) {
  return request(`/admin/quotations/${id}/pdf`, {
    method: 'GET',
    headers: { Accept: 'application/pdf' },
  });
}

/**
 * Catalog helpers for Request Quotation Form
 */
export async function getProducts() {
  return request('/products');
}

export async function getProductVariants(productId) {
  return request(`/products/${productId}/variants`).catch(async () => {
    // Fallback: try resource endpoint or all variants
    return request('/product-variants');
  });
}

export async function getPlans() {
  return request('/plans');
}
