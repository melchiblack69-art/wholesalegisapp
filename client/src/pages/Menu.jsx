import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ShareApp from "../utils/ShareApp";
const items = [
  { icon: "bi-heart", label: "My Favorites", to: "/favorites" },
  { icon: "bi-clock-history", label: "Recent Searches", to: "/companies" },
  { icon: "bi-geo", label: "Nearby Companies", to: "/map" },
  { icon: "bi-share", label: "Share App", action: "share" },
  { icon: "bi-info-circle", label: "About Us", to: "/about" },
  { icon: "bi-question-circle", label: "Help & Support", to: "/contact" },
  { icon: "bi-gear", label: "Settings", to: "/profile" },
];

export default function Menu() {
  const { user, openAuthModal, logout } = useAuth();
const handleShareApp = () => {
  ShareApp();
}
  return (
    <div className="d-lg-none">
      <div
        className="text-white p-4"
        style={{ background: "linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))" }}
      >
        <div className="d-flex align-items-center gap-3 mb-3">
          <span
            className="icon-circle bg-white"
            style={{ width: 56, height: 56, color: "var(--color-primary)" }}
          >
            {user?.photo ? <img src={user.photo} alt="User" className="profile-nav-photo" /> : <i className="bi bi-person fs-3" />}
          </span>
          <div>
            <p className="fw-bold mb-0 fs-5">
              {user ? `Hello, ${user.name || user.email}` : "Hello, Guest"}
            </p>
            <p className="mb-0" style={{ fontSize: "0.85rem", opacity: 0.9 }}>
              Explore wholesale companies around you.
            </p>
          </div>
        </div>
        {user ? (
          <button
            className="btn btn-light fw-semibold w-100 rounded-3"
            style={{ color: "var(--color-primary)" }}
            onClick={logout}
          >
            <i className="bi bi-box-arrow-right me-1"></i>Sign Out
          </button>
        ) : (
          <button
            className="btn btn-light fw-semibold w-100 rounded-3"
            style={{ color: "var(--color-primary)" }}
            onClick={openAuthModal}
          >
            Login / Register
          </button>
        )}
      </div>

      <div className="d-flex flex-column">
  {items.map((it) => {
    // Settings disabled for guests
    if (!user && it.label === "Settings") {
      return (
        <button
          key={it.label}
          type="button"
          disabled
          className="d-flex align-items-center justify-content-between text-muted-brand px-4 py-3 border-bottom bg-transparent border-0 w-100 text-start"
        >
          <span className="d-flex align-items-center gap-3">
            <i className={`bi ${it.icon} fs-5`} />
            <span style={{ fontSize: "0.95rem" }}>
              {it.label}
            </span>
          </span>

          <i className="bi bi-lock" />
        </button>
      );
    }

    // Share App
    if (it.action === "share") {
      return (
        <button
          key={it.label}
          type="button"
          onClick={handleShareApp}
          className="d-flex align-items-center justify-content-between text-decoration-none text-dark px-4 py-3 border-bottom bg-transparent border-0 w-100 text-start"
        >
          <span className="d-flex align-items-center gap-3">
            <i className={`bi ${it.icon} fs-5 text-muted-brand`} />

            <span style={{ fontSize: "0.95rem" }}>
              {it.label}
            </span>
          </span>

          <i className="bi bi-chevron-right text-muted-brand" />
        </button>
      );
    }

    // Normal navigation items
    return (
      <Link
        key={it.label}
        to={it.to}
        className="d-flex align-items-center justify-content-between text-decoration-none text-dark px-4 py-3 border-bottom"
      >
        <span className="d-flex align-items-center gap-3">
          <i className={`bi ${it.icon} fs-5 text-muted-brand`} />

          <span style={{ fontSize: "0.95rem" }}>
            {it.label}
          </span>
        </span>

        <i className="bi bi-chevron-right text-muted-brand" />
      </Link>
    );
  })}
</div>
    </div>
  );
}
