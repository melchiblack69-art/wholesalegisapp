import { NavLink } from "react-router-dom";
import { useSystemSettings } from "../context/SystemSettingsContext.jsx";
const links = [
  { to: "/", label: "Home", icon: "bi-house", end: true },
  { to: "/companies", label: "Companies", icon: "bi-shop", end: false },
  { to: "/categories", label: "Categories", icon: "bi-grid", end: false },
  { to: "/map", label: "Map", icon: "bi-map", end: false },
  { to: "/about", label: "About Us", icon: "bi-info-circle", end: false },
  { to: "/contact", label: "Contact", icon: "bi-envelope", end: false },
];

export default function MobileMenuDrawer({ open, onClose }) {

    const systemCtx = useSystemSettings();
    const systemName = systemCtx?.system_name ;
    const systemLogo = systemCtx?.system_logo ;  
    const otherName = systemCtx?.other_name ;
  

  return (
    <>
      <div
        className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
        style={{
          background: "rgba(14,46,28,0.4)",
          zIndex: 1049,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.2s ease",
        }}
        onClick={onClose}
      />
      <aside
        className="d-lg-none position-fixed top-0 start-0 h-100 bg-white"
        style={{
          width: 270,
          zIndex: 1050,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          boxShadow: "2px 0 20px rgba(0,0,0,0.15)",
        }}
      >
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="icon-circle bg-primary-brand text-white" style={{ width: 34, height: 34 }}>
              <img  src={systemLogo} alt="North Industrial Area Wholesale Locator"
                         className="sidebar-logo" />
            </span>
            <span className="fw-bold" style={{ fontSize: "0.9rem" }}>
              USER: 00210
            </span>
          </div>
          <button className="btn btn-sm border-0" onClick={onClose} aria-label="Close menu">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <nav className="d-flex flex-column p-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={onClose}
              className={({ isActive }) =>
                "d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none fw-medium " +
                (isActive ? "bg-primary-brand text-white" : "text-dark")
              }
            >
              <i className={`bi ${l.icon}`} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 mt-auto">
          <button className="btn btn-brand w-100 rounded-3">Login / Register</button>
        </div>
      </aside>
    </>
  );
}
