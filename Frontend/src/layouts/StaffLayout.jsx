import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  RefreshCcw,
  User,
  Users,
  X,
} from "lucide-react";
import { getStaffUser } from "../components/staff/ui";

const links = [
  { to: "/staff/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/staff/customers", label: "Customers", icon: Users },
  { to: "/staff/quotations", label: "Quotations", icon: FileText },
  { to: "/staff/subscriptions", label: "Subscriptions", icon: RefreshCcw },
  { to: "/staff/invoices", label: "Invoices", icon: Receipt },
  { to: "/staff/payments", label: "Payments", icon: CreditCard },
  { to: "/staff/overdue-invoices", label: "Overdue Invoices", icon: AlertTriangle },
  { to: "/staff/profile", label: "My Profile", icon: User },
];

export default function StaffLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = getStaffUser();

  const logout = () => {
    ["token", "user"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    navigate("/login");
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-[#5A3E2B] p-5 text-white">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-[#B9D19F]">STAFF PORTAL</p>
          <p className="mt-1 truncate text-sm text-white/70">{user.name || "Staff member"}</p>
        </div>
        <button type="button" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isActive ? "bg-[#87A96B] text-[#14200F]" : "text-white/80 hover:bg-white/10"
              }`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-6 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
      >
        <LogOut size={18} /> Log out
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FCFAF7]">
      <aside className="hidden w-64 shrink-0 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-[#EAE5DC] bg-white px-4 py-3 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="text-[#5A3E2B]">
            <Menu size={22} />
          </button>
          <span className="font-bold text-[#5A3E2B]">Staff Portal</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}