import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSystemSettings } from "../context/SystemSettingsContext";
import logo from "../assets/logo.png";
import { useState } from "react";

const superAdminLinks = [
  { to: "/", label: "Dashboard", icon: "bi-speedometer2", end: true },
  { to: "/companies", label: "Companies", icon: "bi-buildings", end: false },
  {
    to: "/categories",
    label: "Categories",
    icon: "bi-grid-3x3-gap-fill",
    end: false,
  },
  { to: "/map", label: "Map", icon: "bi-map-fill", end: false },
  { to: "/reports", label: "Reports", icon: "bi-bar-chart-fill", end: false },
  { to: "/users", label: "Users", icon: "bi-people-fill", end: false },
  { to: "/contact", label: "Messages", icon: "bi-chat-left-text-fill", end: false },
  { to: "/settings", label: "Settings", icon: "bi-gear-fill", end: false },
];

// A "company" (warehouse) account only manages its own profile — no access to
// the full companies list, categories, other users, or system-wide reports.
const companyLinks = [
  { to: "/", label: "Dashboard", icon: "bi-speedometer2", end: true },
  { to: "/my-company", label: "My Warehouse", icon: "bi-buildings", end: false },
  {
    to: "/company/products/:id",
    label: "Products",
    icon: "bi-box-seam",
    end: false,
  },
  {
    to: "/company/:id/users",
    label: "Users",
    icon: "bi-people-fill",
    end: false,
  },
  {
    to: "/company/:id/settings",
    label: "Settings",
    icon: "bi-gear-fill",
    end: false,
  },
];

export default function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapsed,
}) {
  const { user, logout } = useAuth();
  const systemSettings = useSystemSettings();
  const navigate = useNavigate();
  const systemDetail = systemSettings;

  const isCompanyUser =
    user?.role === "warehouse_manager" || user?.role === "warehouse_user";
  const links = isCompanyUser
    ? companyLinks.map((link) => ({
        ...link,
        to: link.to.replace(":id", user.companyPublicId || user.companyId),
      }))
    : superAdminLinks;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {open && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 1039 }}
          onClick={onClose}
        />
      )}
      <aside
        className={`admin-sidebar ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}
      >
        <div className="d-flex align-items-center gap-2 px-3 py-4 sidebar-brand-row">
          <span className="sidebar-logo-wrap flex-shrink-0">
            <img
              src={systemDetail?.system_logo || logo}
              alt="North Industrial Area Wholesale Locator"
              className="sidebar-logo"
            />
          </span>
          <div className="d-flex flex-column lh-1 sidebar-label">
            <span
              className="fw-bold text-white"
              style={{ fontSize: "0.85rem" }}
            >
              {systemDetail?.system_name || "NORTH INDUSTRIAL AREA"}
            </span>
            <span style={{ fontSize: "0.68rem", color: "var(--sidebar-text)" }}>
              {user?.role === "warehouse_manager" ||
              user?.role === "warehouse_user"
                ? `${systemDetail?.other_name || "Wholesale Locator"} · Warehouse`
                : `${systemDetail?.other_name || "Wholesale Locator"} · Administrator`}
            </span>
          </div>
        </div>

        <nav className="flex-fill overflow-auto py-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={onClose}
              title={collapsed ? l.label : undefined}
              className={({ isActive }) =>
                "sidebar-link" + (isActive ? " active" : "")
              }
            >
              <i className={`bi ${l.icon}`} />
              <span className="sidebar-label">{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          className="sidebar-collapse-toggle  d-lg-flex"
          onClick={onToggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label="Toggle sidebar"
        >
          <i
            className={`bi ${collapsed ? "bi-chevron-double-right" : "bi-chevron-double-left"}`}
          />
          <span className="sidebar-label">Collapse</span>
        </button>

        <div
          className="p-2 border-top"
          style={{ borderColor: "rgba(199, 17, 17, 0.08)" }}
        >
          <button
            className="sidebar-link w-100 border-0 bg-transparent text-start"
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
          >
            <i className="bi bi-box-arrow-right" />
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
