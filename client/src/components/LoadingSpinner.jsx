export default function LoadingSpinner({ fullScreen = false, overlay = false, className = "", label = "LOADING", size = 25 }) {
  const dots = Array.from({ length: 12 });
  const spinner = (
    <div className={`client-spinner-wrap ${className}`} role="status" aria-label={label}>
      <div className="client-spinner-ring" style={{ width: size, height: size }}>
        {dots.map((_, index) => <span key={index} className="client-spinner-dot" style={{ transform: `rotate(${index * 30}deg) translate(0, -${size / 2.4}px)`, animationDelay: `${index / 12}s` }} />)}
      </div>
      {label && <span className="client-spinner-label">{label}</span>}
    </div>
  );
  if (fullScreen) return <div className="client-spinner-screen">{spinner}</div>;
  if (overlay) return <div className="client-spinner-overlay">{spinner}</div>;
  return <div className="client-spinner-box">{spinner}</div>;
}
