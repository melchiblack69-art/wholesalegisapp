import { NavLink } from "react-router-dom";
import { useSystemSettings } from "../context/SystemSettingsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

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
  const systemName = systemCtx?.system_name;
  const systemLogo = systemCtx?.system_logo;
  const otherName = systemCtx?.other_name;
  const { user, openAuthModal, logout } = useAuth();

  const handleLoginClick = () => {
    onClose();
    openAuthModal();
  };

  const handleSignOutClick = () => {
    onClose();
    logout();
  };

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
              {user?.photo ? <img src={user.photo} alt="User" className="profile-nav-photo" /> : <i className="bi bi-person" />}
            </span>
            <span className="fw-bold" style={{ fontSize: "0.8rem" }}>
              {user ? user.name || user.email : "Guest"}
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
          {user ? (
            <button className="btn btn-brand-outline w-100 rounded-3 fw-semibold" onClick={handleSignOutClick}>
              <i className="bi bi-box-arrow-right me-1"></i>Sign Out
            </button>
          ) : (
            <button className="btn btn-brand w-100 rounded-3" onClick={handleLoginClick}>
              Login / Register
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
