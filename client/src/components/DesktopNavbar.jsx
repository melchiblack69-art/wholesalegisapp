import { NavLink } from "react-router-dom";
import { useSystemSettings } from "../context/SystemSettingsContext";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/companies", label: "Companies" },
  { to: "/categories", label: "Categories" },
  { to: "/map", label: "Map" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
];

export default function DesktopNavbar() {
  const systemCtx = useSystemSettings();
  const systemName = systemCtx.system_name;
  const systemLogo = systemCtx.system_logo;
  const otherName = systemCtx.other_name;
  const { user, openAuthModal, logout } = useAuth();

  return (
    <nav
      className="d-none d-lg-flex align-items-center position-fixed top-0 start-0 w-100 bg-white border-bottom px-4"
      style={{ height: "var(--navbar-h-desktop)", zIndex: 1030 }}
    >
      <div className="d-flex align-items-center justify-content-between w-100 mx-auto" style={{ maxWidth: 1320 }}>
        <NavLink to="/" className="d-flex align-items-center gap-2 text-decoration-none">
          <span className="icon-circle bg-primary-brand text-white" style={{ width: 38, height: 38 }}>
            {systemLogo ? <img src={systemLogo} alt="North Industrial Area Wholesale Locator" className="sidebar-logo" /> : <i className="bi bi-buildings" />}
          </span>
          <span className="d-flex flex-column lh-1">
            <span className="fw-bold text-dark" style={{ fontSize: "1.05rem" }}>
              {systemName}
            </span>
            <span className="text-muted-brand" style={{ fontSize: "0.72rem" }}>
              {otherName}
            </span>
          </span>
        </NavLink>

        <div className="d-flex align-items-center gap-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                "fw-medium text-decoration-none " +
                (isActive ? "text-primary-brand" : "text-dark")
              }
              style={{ fontSize: "0.95rem" }}
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        {user ? (
          <div className="d-flex align-items-center gap-2">
            <NavLink to="/profile" className="d-flex align-items-center gap-2 text-decoration-none text-dark">
              <span className="icon-circle bg-primary-light text-primary-brand" style={{ width: 34, height: 34, overflow: "hidden" }}>
                {user.photo ? <img src={user.photo} alt={user.name || "Profile"} className="profile-nav-photo" /> : <i className="bi bi-person-fill" />}
              </span>
              <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>{user.name || "Profile"}</span>
            </NavLink>
            <button className="btn btn-brand-outline rounded-2 px-2 py-2" onClick={logout}><i className="bi bi-box-arrow-right" /></button>
          </div>
        ) : (
          <button className="btn btn-brand rounded-2 px-2 py-2" onClick={openAuthModal}>
            Login / Register
          </button>
        )}
      </div>
    </nav>
  );
}
