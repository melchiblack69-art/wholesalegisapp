import { NavLink } from "react-router-dom";
import { useSystemSettings } from "../context/SystemSettingsContext";

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
  const systemName = systemCtx.system_name ;
  const systemLogo = systemCtx.system_logo ;
  const otherName = systemCtx.other_name ;
  return (
    <nav
      className="d-none d-lg-flex align-items-center position-fixed top-0 start-0 w-100 bg-white border-bottom px-4"
      style={{ height: "var(--navbar-h-desktop)", zIndex: 1030 }}
    >
      <div className="d-flex align-items-center justify-content-between w-100 mx-auto" style={{ maxWidth: 1320 }}>
        <NavLink to="/" className="d-flex align-items-center gap-2 text-decoration-none">
          <span
            className="icon-circle bg-primary-brand text-white"
            style={{ width: 38, height: 38 }}
          >
           <img  src={systemLogo} alt="North Industrial Area Wholesale Locator"
                         className="sidebar-logo" />
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

        <button className="btn btn-brand rounded-2 px-3 py-2">Login / Register</button>
      </div>
    </nav>
  );
}
