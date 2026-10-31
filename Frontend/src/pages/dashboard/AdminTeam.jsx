import { useEffect, useState } from "react";
import { getCustomers } from "../../services/customerService.js";
import {
  assignStaff,
  getAdminUsers,
  getStaffAssignments,
  updateUserRole,
} from "../../services/adminService.js";

export default function AdminTeam() {
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [staffId, setStaffId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const reload = async () => {
    const [userRows, customerRows, assignmentRows] = await Promise.all([
      getAdminUsers(),
      getCustomers(),
      getStaffAssignments(),
    ]);
    setUsers(userRows);
    setCustomers(customerRows);
    setAssignments(assignmentRows);
  };

  useEffect(() => {
    let active = true;
    Promise.all([getAdminUsers(), getCustomers(), getStaffAssignments()])
      .then(([userRows, customerRows, assignmentRows]) => {
        if (!active) return;
        setUsers(userRows);
        setCustomers(customerRows);
        setAssignments(assignmentRows);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || "Unable to load team management.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const changeRole = async (user, role) => {
    setError("");
    setNotice("");
    try {
      await updateUserRole(user.id, role);
      setNotice(`${user.name}'s role updated.`);
      await reload();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update user role.");
    }
  };

  const submitAssignment = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await assignStaff(Number(staffId), Number(customerId));
      setNotice("Customer assigned to staff.");
      setStaffId("");
      setCustomerId("");
      await reload();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to assign customer.");
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-[#5A3E2B]">User and staff access</h1>
        <p className="mt-1 text-gray-500">Assign staff roles and scope their customer access.</p>
      </header>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-700">{notice}</p>}

      <form onSubmit={submitAssignment} className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 md:grid-cols-[1fr_1fr_auto]">
        <label className="space-y-1 text-sm font-medium text-gray-700">
          Staff member
          <select required value={staffId} onChange={(event) => setStaffId(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="">Select staff...</option>
            {users.filter((user) => user.role === "STAFF").map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-gray-700">
          Customer
          <select required value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="">Select customer...</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.email ? ` (${customer.email})` : ""}</option>)}
          </select>
        </label>
        <button type="submit" className="self-end rounded-lg bg-[#D5851F] px-5 py-2.5 font-semibold text-white">Assign customer</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <h2 className="px-5 pt-5 text-lg font-bold text-[#5A3E2B]">Users</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-gray-500">
            <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Change role</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-3">{user.name}</td>
                <td className="px-5 py-3">{user.email}</td>
                <td className="px-5 py-3">{user.role}</td>
                <td className="px-5 py-3">
                  {user.role === "ADMIN" ? "Protected" : (
                    <select aria-label={`Role for ${user.name}`} value={user.role} onChange={(event) => changeRole(user, event.target.value)} className="rounded border border-gray-300 px-2 py-1">
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="STAFF">STAFF</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <h2 className="px-5 pt-5 text-lg font-bold text-[#5A3E2B]">Staff assignments</h2>
        {assignments.length === 0 ? <p className="p-5 text-sm text-gray-500">No staff assignments yet.</p> : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Staff</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Assigned</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{assignments.map((item) => <tr key={`${item.staffId}:${item.customerId}`}><td className="px-5 py-3">{item.staffName} ({item.staffEmail})</td><td className="px-5 py-3">{item.customerName}</td><td className="px-5 py-3">{new Date(item.assignedAt).toLocaleDateString()}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </section>
  );
}
