const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/invoices`;

const headers = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handle = async (res) => {
  const data = await res.json().catch(() => { throw new Error('Invalid response'); });
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data;
};

export const invoiceService = {
  /* Customer — products */
  buyNow: (productId, quantity = 1) =>
    fetch(`${BASE}/my`, { method: 'POST', headers: headers(), body: JSON.stringify({ productId, quantity }) }).then(handle),
  requestQuotation: (productId, quantity = 1) =>
    fetch(`${BASE}/my/quotation`, { method: 'POST', headers: headers(), body: JSON.stringify({ productId, quantity }) }).then(handle),

  /* Customer — subscriptions & quotations */
  listMySubscriptions: () => fetch(`${BASE}/my/subscriptions`, { headers: headers() }).then(handle),
  listMyQuotations: () => fetch(`${BASE}/my/quotations`, { headers: headers() }).then(handle),

  /* Customer — invoices & payments */
  listMine: () => fetch(`${BASE}/my`, { headers: headers() }).then(handle),
  pay: (id, method = 'CARD', note = '') =>
    fetch(`${BASE}/my/${id}/pay`, { method: 'POST', headers: headers(), body: JSON.stringify({ method, note }) }).then(handle),
  listMyPayments: () => fetch(`${BASE}/my-payments`, { headers: headers() }).then(handle),

  /* Admin */
  listAll: () => fetch(BASE, { headers: headers() }).then(handle),
  listAllPayments: () => fetch(`${BASE}/payments`, { headers: headers() }).then(handle),
};
