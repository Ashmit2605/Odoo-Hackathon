<<<<<<< HEAD
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import SidebarFooter from "./SidebarFooter.jsx";
import SidebarSection from "./SidebarSection.jsx";
import SidebarUserCard from "./SidebarUserCard.jsx";
import { roleLabels, sidebarMenus } from "./sidebarMenu.js";

export default function Sidebar({
  role = "admin",
  variant,
  collapsed = false,
  onToggleCollapsed,
  onLogout,
  darkMode = false,
  onToggleTheme,
  onNavigate,
}) {
  const sections = sidebarMenus[role] ?? sidebarMenus.customer;
  const theme = variant ?? (role === "admin" ? "dark" : "light");

  return (
    <aside className={`app-sidebar sidebar--${theme}${collapsed ? " is-collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">S</div>
        {!collapsed && (
          <div className="sidebar-brand-copy">
            <span className="sidebar-brand-name">Sage</span>
            <span className="sidebar-brand-caption">SUBSCRIPTION HUB</span>
          </div>
        )}
        {onToggleCollapsed && (
          <button
            type="button"
            className="sidebar-collapse-button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>

      <div className="sidebar-scroll">
        <SidebarUserCard
          name={role === "admin" ? "Olivia Martin" : role === "staff" ? "Jordan Lee" : "Alex Morgan"}
          role={roleLabels[role] ?? roleLabels.customer}
        />
        <div className="sidebar-menu">
          {sections.map((section) => (
            <SidebarSection
              key={section.title}
              {...section}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>

      <SidebarFooter
        onLogout={onLogout}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
      />
=======
import { NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

const links = [
  ["Dashboard", "/dashboard"],
  ["User and staff access", "/admin/team"],
  ["Customers", "/customers"],
  ["Products", "/products"],
  ["Add product", "/products/new"],
  ["Plans", "/plans"],
  ["Add plan", "/plans/new"],
  ["Subscriptions", "/subscriptions"],
  ["New subscription", "/subscriptions/new"],
  ["Quotations", "/quotations"],
  ["New quotation", "/quotations/new"],
  ["Invoices", "/invoices"],
  ["New invoice", "/invoices/new"],
  ["Payments", "/payments"],
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const visibleLinks =
    user?.role === "ADMIN"
      ? links
      : user?.role === "STAFF"
        ? links.filter(([label]) => !["User and staff access", "Add product", "Add plan", "New subscription", "New invoice"].includes(label))
        : [
            ["Dashboard", "/dashboard"],
            ["Browse plans", "/browse-plans"],
            ["Subscriptions", "/subscriptions"],
            ["Invoices", "/invoices"],
            ["Payments", "/payments"],
          ];

  return (
    <aside className="flex w-full shrink-0 flex-col bg-[#5A3E2B] p-5 text-white md:min-h-screen md:w-60">
      <NavLink to="/dashboard" className="mb-8 text-2xl font-bold">
        Bright<span className="text-[#87A96B]">loop</span>
      </NavLink>
      <nav className="flex flex-wrap gap-2 md:flex-col">
        {visibleLinks.map(([label, path]) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm ${isActive ? "bg-white/20 font-semibold" : "hover:bg-white/10"}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6 border-t border-white/20 pt-4 md:mt-auto">
        <p className="truncate text-sm">{user?.name}</p>
        <button
          type="button"
          onClick={() => signOut()}
          className="mt-3 text-sm text-white/75 hover:text-white"
        >
          Sign out
        </button>
      </div>
>>>>>>> 315d366 (done)
    </aside>
  );
}
