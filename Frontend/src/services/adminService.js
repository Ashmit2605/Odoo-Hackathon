import api from "./api.js";

export const getAdminUsers = async () => (await api.get("/api/admin/users")).data;
export const updateUserRole = async (id, role) =>
  (await api.patch(`/api/admin/users/${id}/role`, { role })).data;
export const getStaffAssignments = async () =>
  (await api.get("/api/admin/staff-assignments")).data;
export const assignStaff = async (staffId, customerId) =>
  (await api.post("/api/admin/staff-assignments", { staffId, customerId })).data;
