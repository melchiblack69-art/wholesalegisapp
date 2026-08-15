import { useSystemSettings } from "../context/SystemSettingsContext";

export default function MaintenancePage() {
  const system = useSystemSettings();
  return (
    <div className="sysmaint-page">
      <header className="sysmaint-header">
        <div className="sysmaint-brand-mark">
          {system?.system_logo ? (
            <img src={system.system_logo} alt="" />
          ) : (
            <i className="bi bi-buildings" />
          )}
        </div>
        <div>
          <strong>{system?.system_name || "North Industrial Area"}</strong>
          <span>{system?.other_name || "Wholesale Locator"}</span>
        </div>
      </header>
      <main className="sysmaint-main">
        <div className="sysmaint-orb">
          <span />
          <i className="bi bi-tools" />
        </div>
        <span className="sysmaint-eyebrow">
          <i className="bi bi-shield-check" /> Temporary service pause
        </span>
        <h1 className="sysmaint-title">We’ll be back shortly</h1>
        <p className="sysmaint-subtext">
          We’re making a few improvements behind the scenes. Your account and
          data are safe, and the service will be available again soon.
        </p>
        <div className="sysmaint-actions">
          <button
            type="button"
            className="btn btn-brand"
            onClick={() => window.location.reload()}
          >
            <i className="bi bi-arrow-clockwise me-2" />
            Try again
          </button>
        </div>
      </main>
      <footer className="sysmaint-footer">
        <i className="bi bi-heart-fill" />
        <span>Thank you for your patience.</span>
        <span className="sysmaint-footer-dot" />{" "}
        <span>{new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
