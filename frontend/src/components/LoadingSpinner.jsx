//import logo from '../assets/logo';
import { useSystemSettings } from "../context/SystemSettingsContext";
export default function LoadingSpinner({ fullScreen = false, size = 56, label = "" }) {
  const systemCtx = useSystemSettings() || {};
  const spinner = (
    <div className="brand-spinner" style={{ width: size, height: size }}>
      <span className="brand-spinner-ring" />
      <span className="brand-spinner-logo" style={{ fontSize: size * 0.25 }}>
        { systemCtx?.system_logo ? (
        <img  src={systemCtx?.system_logo} alt="Loading" />
        ): (
          <i className="bi bi-geo-alt-fill" style={{fontSize: size * 0.34}} ></i>
        )}
      </span>
    </div>
  );

  if (!fullScreen) return spinner;

  return (
    <div className="brand-spinner-overlay">
      {spinner}
      {label && <p className="brand-spinner-label">{label}</p>}
    </div>
  );
}
