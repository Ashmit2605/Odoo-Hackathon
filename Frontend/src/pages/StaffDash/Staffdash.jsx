import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, Repeat, Receipt, CreditCard, Package, CalendarClock, BarChart3, AlertTriangle,
  Eye, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserRound, X, ChevronDown,
} from "lucide-react";

const BASE = "/staff";

const T = {
  root: "bg-[#FCFAF7] border-[#EAE5DA]",
  text: "text-stone-600",
  muted: "text-stone-500",
  heading: "text-stone-400",
  hover: "hover:bg-[#F1EEE6]",
  active: "bg-[#87A96B] text-[#14200F] font-semibold",
  divider: "border-[#EAE5DA]",
  card: "bg-[#F4F1E9]",
  danger: "text-red-500 hover:bg-red-50",
};

const MENU = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Sales",
    items: [
      { label: "Customers", to: "/customers", icon: Users },
      { label: "Quotations", to: "/quotations", icon: FileText },
      { label: "Subscriptions", to: "/subscriptions", icon: Repeat },
    ],
  },
  {
    title: "Billing",
    items: [
      { label: "Invoices", to: "/invoices", icon: Receipt, badge: { key: "drafts", tone: "amber" } },
      { label: "Payments", to: "/payments", icon: CreditCard },
      { label: "Overdue", to: "/overdue", icon: AlertTriangle, badge: { key: "overdue", tone: "red" } },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", to: "/products", icon: Package, readOnly: true },
      { label: "Plans", to: "/plans", icon: CalendarClock, readOnly: true },
    ],
  },
  {
    title: "Insights",
    items: [{ label: "Reports (limited)", to: "/reports", icon: BarChart3 }],
  },
];

const SidebarContext = createContext({});
const useSidebar = () => useContext(SidebarContext);

const SidebarBadge = ({ count, tone = "red", className = "" }) => {
  if (!count || count < 1) return null;
  const tones = { red: "bg-red-500 text-white", amber: "bg-amber-400 text-amber-950" };
  return (
    <span className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-5 ${tones[tone] ?? tones.red} ${className}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
};

const SidebarItem = ({ to, icon: Icon, label, badge = null, readOnly = false }) => {
  const { collapsed, onNavigate } = useSidebar();
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? "justify-center" : ""} ${isActive ? T.active : `${T.text} ${T.hover}`}`
      }
    >
      {Icon && <Icon size={18} className="shrink-0" />}
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && readOnly && <Eye size={13} className="ml-auto shrink-0 opacity-50" />}
      {!collapsed && badge && <SidebarBadge count={badge.count} tone={badge.tone} className="ml-auto" />}
      {collapsed && badge && <SidebarBadge count={badge.count} tone={badge.tone} className="absolute -right-0.5 -top-0.5 !min-w-[1rem] !px-1 !text-[10px] !leading-4" />}
    </NavLink>
  );
};

const SidebarSection = ({ title, items = [] }) => {
  const { collapsed } = useSidebar();
  const [open, setOpen] = useState(true);
  if (!items.length) return null;

  // Icon-only sidebar: always show the items under a divider.
  if (collapsed) {
    return (
      <div className="mb-3">
        <div className={`mx-3 mb-2 border-t ${T.divider}`} />
        {items.map((item) => <SidebarItem key={item.to} {...item} to={`${BASE}${item.to}`} />)}
      </div>
    );
  }

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87A96B] ${T.heading} ${T.hover}`}
      >
        <span>{title}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          {items.map((item) => <SidebarItem key={item.to} {...item} to={`${BASE}${item.to}`} />)}
        </div>
      </div>
    </div>
  );
};

const footerBtn = "mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";

const SidebarFooter = ({ onLogout }) => {
  const { collapsed, onNavigate } = useSidebar();
  const align = collapsed ? "justify-center" : "";
  return (
    <div className={`border-t p-3 ${T.divider}`}>
      <NavLink
        to={`${BASE}/profile`}
        onClick={onNavigate}
        title={collapsed ? "Profile" : undefined}
        className={({ isActive }) => `${footerBtn} ${align} ${isActive ? T.active : `${T.text} ${T.hover}`}`}
      >
        <UserRound size={18} className="shrink-0" />
        {!collapsed && <span>Profile</span>}
      </NavLink>
      <button type="button" onClick={onLogout} title={collapsed ? "Logout" : undefined} className={`${footerBtn} ${align} ${T.danger}`}>
        <LogOut size={18} className="shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>
    </div>
  );
};

const Sidebar = ({ collapsed = false, counts = {}, onLogout, onNavigate }) => {
  const sections = MENU.map((s) => ({
    ...s,
    items: s.items.map(({ badge, ...rest }) => ({
      ...rest,
      badge: badge ? { count: counts[badge.key] ?? 0, tone: badge.tone } : null,
    })),
  }));
  return (
    <SidebarContext.Provider value={{ collapsed, onNavigate }}>
      <div className={`flex h-full flex-col border-r transition-[width] duration-200 ${collapsed ? "w-[68px]" : "w-60"} ${T.root}`}>
        <div className={`flex h-14 shrink-0 items-center border-b px-4 ${T.divider} ${collapsed ? "justify-center" : ""}`}>
          {collapsed
            ? <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#87A96B] text-sm font-bold text-[#14200F]">T</div>
            : <span className="text-sm font-bold tracking-widest text-stone-800">BRIGHTLOOP</span>
          }
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {sections.map((s) => <SidebarSection key={s.title} title={s.title} items={s.items} />)}
        </nav>
        <SidebarFooter onLogout={onLogout} />
      </div>
    </SidebarContext.Provider>
  );
};

const MobileDrawer = ({ open, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? "visible" : "invisible"}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
      <div className={`absolute inset-y-0 left-0 w-60 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {children}
        <button onClick={onClose} className="absolute right-3 top-3 rounded-lg p-1 text-stone-400 hover:bg-[#F1EEE6]">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

const StaffDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [counts] = useState({ drafts: 3, overdue: 5 });
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const confirmLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  const sidebarProps = { counts, onLogout: () => setShowLogout(true) };

  return (
    <div className="flex h-screen bg-[#FCFAF7] text-stone-800" style={{ fontFamily: "'Urbanist', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&display=swap');`}</style>

      <aside className="hidden lg:block shrink-0">
        <Sidebar {...sidebarProps} collapsed={collapsed} />
      </aside>

      <MobileDrawer open={drawerOpen} onClose={closeDrawer}>
        <Sidebar {...sidebarProps} collapsed={false} onNavigate={closeDrawer} />
      </MobileDrawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[#EAE5DA] bg-[#FCFAF7] px-4">
          <button onClick={() => setDrawerOpen(true)} className="rounded-lg p-2 text-stone-500 hover:bg-[#F1EEE6] lg:hidden">
            <Menu size={20} />
          </button>
          <button onClick={() => setCollapsed((c) => !c)} className="hidden rounded-lg p-2 text-stone-400 hover:bg-[#F1EEE6] lg:block">
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <span className="text-sm font-bold tracking-widest text-[#87A96B] lg:hidden">BRIGHTLOOP</span>
        </header>
        <main className="flex-1 overflow-auto bg-[#FCFAF7]">
          <Outlet />
        </main>
      </div>

      {showLogout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EAE5DA] px-5 py-4">
              <h3 className="text-sm font-semibold text-stone-800">Confirm logout</h3>
              <button onClick={() => setShowLogout(false)} className="rounded-lg p-1 text-stone-400 hover:bg-[#F1EEE6]"><X size={16} /></button>
            </div>
            <p className="px-5 py-4 text-sm text-stone-500">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-2 border-t border-[#EAE5DA] px-5 py-4">
              <button onClick={() => setShowLogout(false)} className="rounded-lg border border-[#DDD6C6] px-4 py-2 text-sm text-stone-600 hover:bg-[#F1EEE6]">Cancel</button>
              <button onClick={confirmLogout} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;