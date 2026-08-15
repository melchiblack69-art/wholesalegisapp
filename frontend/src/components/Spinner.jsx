import React from "react";

export default function Spinner({ label = "LOADING", size = 30, fullscreen = false, background = "rgba(12, 12, 12, 0.53)", dotColor = "#e3eee1" }) {
  const dots = Array.from({ length: 12 });
  const spinner = (
    <div className="spinner-wrap">
      <div className="spinner-ring" style={{ width: size, height: size }} role="status" aria-label={label}>
        {dots.map((_, index) => <div key={index} className="spinner-dot" style={{ backgroundColor: dotColor, transform: `rotate(${index * 30}deg) translate(0, -${size / 2.4}px)`, animationDelay: `${index * 0.1125}s` }} />)}
      </div>
      {label && <div className="spinner-label" style={{ color: dotColor }}>{label}</div>}
    </div>
  );
  if (!fullscreen) return spinner;
  return <div className="spinner-fullscreen" style={{ backgroundColor: background }}>{spinner}</div>;
}
