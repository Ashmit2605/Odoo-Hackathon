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
    </aside>
  );
}
