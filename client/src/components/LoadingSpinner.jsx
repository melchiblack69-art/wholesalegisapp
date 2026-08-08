export default function LoadingSpinner({ fullScreen = false, overlay = false, className = "" }) {
  return (
    <div className={`${fullScreen ? "loading-spinner-screen" : overlay ? "loading-spinner-overlay" : "loading-spinner-box"} ${className}`} role="status" aria-label="Loading">
      <span className="loading-spinner" />
    </div>
  );
}
