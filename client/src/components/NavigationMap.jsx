import { memo, useEffect, useRef } from "react";
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

function validPoint(point) {
  return Array.isArray(point) && point.length === 2 && point.every((value) => Number.isFinite(Number(value)));
}

function MapCameraController({ initialCenter, origin, animateToOrigin }) {
  const map = useMap();
  const initialized = useRef(false);
  const animated = useRef(false);

  useEffect(() => {
    if (initialized.current || !validPoint(initialCenter)) return;
    map.setView(initialCenter, map.getZoom(), { animate: false });
    initialized.current = true;
  }, [initialCenter, map]);

  useEffect(() => {
    if (!animateToOrigin || animated.current || !validPoint(origin) || !validPoint(initialCenter)) return;
    if (Number(origin[0]) === Number(initialCenter[0]) && Number(origin[1]) === Number(initialCenter[1])) return;
    const timer = window.setTimeout(() => {
      map.flyTo(origin, map.getZoom(), { animate: true, duration: 1.2 });
      animated.current = true;
    }, 250);
    return () => window.clearTimeout(timer);
  }, [animateToOrigin, initialCenter, map, origin]);

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

function RecenterButton({ target }) {
  const map = useMap();

  if (!validPoint(target)) return null;

  return (
    <button
      type="button"
      onClick={() => map.flyTo(target, map.getZoom(), { animate: true, duration: 0.6 })}
      className="btn btn-light shadow-sm rounded-circle d-flex align-items-center justify-content-center"
      style={{ position: "absolute", bottom: 16, right: 16, width: 42, height: 42, zIndex: 1000 }}
      aria-label="Recenter on my location"
    >
      <i className="bi bi-crosshair2" />
    </button>
  );
}

const RouteLayers = memo(function RouteLayers({ points }) {
  if (points.length <= 1) return null;
  return <>
    <Polyline positions={points} pathOptions={{ color: "#0b4fca", weight: 10, opacity: 0.28, lineCap: "round", lineJoin: "round" }} />
    <Polyline positions={points} pathOptions={{ color: "#4285f4", weight: 6, opacity: 0.96, lineCap: "round", lineJoin: "round" }} />
    <Polyline positions={points} pathOptions={{ color: "#d9e8ff", weight: 3, opacity: 0.9, dashArray: "1 18", lineCap: "round", className: "navigation-route-flow" }} />
  </>;
});

function NavigationMap({ height, initialCenter, origin, destination, routePoints, userIcon, destinationIcon, destinationColor, mode, heading, position, accuracy, animateToOrigin }) {
  const safeOrigin = validPoint(origin) ? origin : initialCenter;
  const safeDestination = validPoint(destination) ? destination : null;
  const safeRoutePoints = Array.isArray(routePoints) ? routePoints.filter(validPoint) : [];

  return (
    <div style={{ height, width: "100%", minHeight: 0, position: "relative", overflow: "hidden" }}>
      <MapContainer center={safeOrigin} zoom={15} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapCameraController initialCenter={initialCenter} origin={safeOrigin} animateToOrigin={animateToOrigin} />

        <Marker position={safeOrigin} icon={userIcon(mode, heading)}>
          <Popup>{position ? "Your live location" : "North Industrial Area (fallback)"}</Popup>
        </Marker>
        {position && Number.isFinite(Number(accuracy)) && <Circle className="navigation-accuracy-circle" center={safeOrigin} radius={Number(accuracy)} pathOptions={{ color: "#4285f4", fillColor: "#4285f4", fillOpacity: 0.12, weight: 2 }} />}
        {safeDestination && <Marker position={safeDestination} icon={destinationIcon(destinationColor)} />}
        <RouteLayers points={safeRoutePoints} />
        {position && <RecenterButton target={safeOrigin} />}
      </MapContainer>
    </div>
  );
}

export default memo(NavigationMap);
