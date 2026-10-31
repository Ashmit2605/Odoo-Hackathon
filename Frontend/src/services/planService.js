import api from "./api.js";

export const getPlans = async () => (await api.get("/api/plans")).data;
export const getPublicPlans = async () => (await api.get("/api/public/plans")).data;
export const getPlan = async (id) => (await api.get(`/api/plans/${id}`)).data;
export const createPlan = async (plan) => (await api.post("/api/plans", plan)).data;
export const updatePlan = async (id, changes) => (await api.patch(`/api/plans/${id}`, changes)).data;
