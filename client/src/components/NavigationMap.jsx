import { useEffect, useRef } from "react";
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

export default function NavigationMap({ height, initialCenter, origin, destination, routePoints, userIcon, destinationIcon, destinationColor, mode, heading, position, accuracy, animateToOrigin }) {
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
        {position && Number.isFinite(Number(accuracy)) && <Circle center={safeOrigin} radius={Number(accuracy)} pathOptions={{ color: "#1c6b41", fillColor: "#1c6b41", fillOpacity: 0.08, weight: 1 }} />}
        {safeDestination && <Marker position={safeDestination} icon={destinationIcon(destinationColor)} />}
        {safeRoutePoints.length > 1 && <Polyline positions={safeRoutePoints} pathOptions={{ color: "#2f6fed", weight: 5 }} />}
        {position && <RecenterButton target={safeOrigin} />}
      </MapContainer>
    </div>
  );
}
