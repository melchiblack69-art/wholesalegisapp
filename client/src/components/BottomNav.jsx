import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Home", icon: "bi-house-fill", end: true },
  { to: "/companies", label: "Search", icon: "bi-search", end: false },
  { to: "/map", label: "Map", icon: "bi-map-fill", end: false },
  { to: "/favorites", label: "Favorites", icon: "bi-heart-fill", end: false },
  { to: "/menu", label: "Menu", icon: "bi-list", end: false },
];

export default function BottomNav() {
  return (
    <nav
      className="d-lg-none position-fixed bottom-0 start-0 w-100 bg-white border-top d-flex"
      style={{ height: "calc(var(--bottomnav-h) + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)", zIndex: 1030 }}
    >
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            "flex-fill d-flex flex-column align-items-center justify-content-center text-decoration-none " +
            (isActive ? "text-primary-brand" : "text-secondary")
          }
        >
          <i className={`bi ${t.icon} fs-5`} />
          <span style={{ fontSize: "0.68rem" }} className="fw-medium mt-1">
            {t.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
