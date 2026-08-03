export default function LoadingSpinner({ fullScreen = false, size = 76, label = "" }) {
  const spinner = (
    <div className="brand-spinner" style={{ width: size, height: size }}>
      <span className="brand-spinner-ring" />
      <span className="brand-spinner-logo" style={{ fontSize: size * 0.34 }}>
        <i className="bi bi-geo-alt-fill" />
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