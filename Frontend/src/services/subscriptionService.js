import api from "./api.js";

export const getSubscriptions = async () => (await api.get("/api/subscriptions")).data;
export const getSubscription = async (id) => (await api.get(`/api/subscriptions/${id}`)).data;
export const createSubscription = async (subscription) =>
  (await api.post("/api/subscriptions", subscription)).data;
export const subscribeToPlan = async (planId) =>
  (await api.post("/api/customer/subscriptions", { planId })).data;
export const updateSubscription = async (id, changes) =>
  (await api.patch(`/api/subscriptions/${id}`, changes)).data;
export const requestCancellation = async (id) =>
  (await api.post(`/api/subscriptions/${id}/cancel`)).data;
export const reinstateSubscription = async (id) =>
  (await api.post(`/api/subscriptions/${id}/reinstate`)).data;
export const requestStaffCancellation = async (id, note) =>
  (await api.post(`/api/staff/subscriptions/${id}/cancellation-request`, { note })).data;
export const getQuotations = async () => (await api.get("/api/quotations")).data;
export const createQuotation = async (quotation) =>
  (await api.post("/api/quotations", quotation)).data;
