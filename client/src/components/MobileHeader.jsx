import { useNavigate } from "react-router-dom";
import { useSystemSettings } from "../context/SystemSettingsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
/**
 * variant="home"  -> hamburger + brand + notification bell
 * variant="back"  -> back arrow + title + optional right icons
 * variant="plain" -> title only, no back arrow (e.g. Map, Categories root)
 */
export default function MobileHeader({
  variant = "back",
  title = "",
  onMenuClick,
  rightIcons = null,
}) {
  const navigate = useNavigate();
  const user = useAuth()?.user;
  const systemCtx = useSystemSettings();
  const systemName = systemCtx?.system_name ;
  const systemLogo = systemCtx?.system_logo ;  
  const otherName = systemCtx?.other_name ;

  return (
    <header
      className="d-lg-none position-fixed top-0 start-0 w-100 bg-white border-bottom d-flex align-items-center justify-content-between px-3"
      style={{ height: "var(--header-h-mobile)", zIndex: 1030 }}
    >
      <div className="d-flex align-items-center gap-2">
        {variant === "back" ? (
          <button
            className="btn btn-sm p-0 border-0 d-flex align-items-center justify-content-center"
            style={{ width: 32, height: 32 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <i className="bi bi-arrow-left fs-4" />
          </button>
        ) : variant === "home" ? (
          <button
            className="btn btn-sm p-0 border-0 d-flex align-items-center justify-content-center"
            style={{ width: 32, height: 32 }}
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <i className="bi bi-list fs-3" />
          </button>
        ) : null}

        {variant === "home" ? (
          <div className="d-flex align-items-center gap-1">
            <span
              className="icon-circle bg-primary-brand text-white d-flex align-items-center justify-content-center"
              style={{ width: 32, height: 32 }}
            >
              {systemLogo ? <img src={systemLogo} alt="North Industrial Area Wholesale Locator" className="sidebar-logo" /> : <i className="bi bi-buildings" />}
            </span>
            <div className="d-flex flex-column lh-1">
              <span className="fw-bold" style={{ fontSize: "0.85rem" }}>
                {systemName}
              </span>
              <span className="text-muted-brand" style={{ fontSize: "0.68rem" }}>
                {otherName}
              </span>
            </div>
          </div>
        ) : (
          <span className="fw-semibold fs-6">{title}</span>
        )}
      </div>

      <div className="d-flex align-items-center gap-3">
        {variant === "home" && (
          <button className="btn btn-sm p-0 border-0" aria-label="Notifications">
            <i className="bi bi-bell fs-5" />
          </button>
        )}
        {rightIcons}
      </div>
    </header>
  );
}
