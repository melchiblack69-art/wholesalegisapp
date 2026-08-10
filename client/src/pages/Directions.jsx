import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import L from "leaflet";
import MobileHeader from "../components/MobileHeader";
import { useCompany, useGraphHopperRoute } from "../api/queries";
import LoadingSpinner from "../components/LoadingSpinner";
import { haversineDistance } from "../utils/haversine";
import { createKalmanPosition } from "../utils/kalmanPosition";
import { NIA_CENTER } from "../components/CompanyMap";
import NavigationMap from "../components/NavigationMap";

const modes = [
  { key: "driving", label: "Driving", icon: "bi-car-front-fill" },
  { key: "cycling", label: "Cycling", icon: "bi-bicycle" },
  { key: "walking", label: "Walking", icon: "bi-person-walking" },
];
const validPoint = (point) =>
  Array.isArray(point) &&
  point.length === 2 &&
  point.every((value) => Number.isFinite(Number(value)));

function distanceToRouteMeters(point, routePoints) {
  if (!validPoint(point) || !Array.isArray(routePoints) || routePoints.length === 0) return Infinity;
  return Math.min(...routePoints.map((routePoint) =>
    haversineDistance(point[0], point[1], routePoint[0], routePoint[1]) * 1000,
  ));
}

// Destination pin — unchanged, still used for the company location
function marker(color = "#e0405a") {
  return L.divIcon({
    className: "directions-marker",
    html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;"><i class="bi bi-building" style="color:white;font-size:13px;transform:rotate(45deg)"></i></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}

function userMarker(mode, heading) {
  const iconClass =
    modes.find((m) => m.key === mode)?.icon || "bi-geo-alt-fill";
  const color = "#1c6b41";
  const wedge = Number.isFinite(heading)
    ? `<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%) rotate(${heading}deg);transform-origin:50% 29px;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:12px solid ${color};opacity:1"></div>`
    : "";
  return L.divIcon({
    className: "directions-marker",
    html: `
      <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
        ${wedge}
        <i class="bi ${iconClass}" style="color:${color};font-size:25px;text-shadow:0 1px 2px rgba(0,0,0,0.28);"></i>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function formatDuration(ms) {
  const minutes = Math.max(1, Math.round(ms / 60000));
  return minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)}h ${minutes % 60} min`;
}

export default function Directions() {
  const { id } = useParams();
  const { data: company, isLoading, isError } = useCompany(id);
  const [mode, setMode] = useState("driving");
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [heading, setHeading] = useState(null);
  const [locationWarning, setLocationWarning] = useState("");
  const [started, setStarted] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState(NIA_CENTER);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 991.98px)").matches);
  const lastRouteOrigin = useRef(NIA_CENTER);
  const lastDisplayedPos = useRef(null);
  const initialLocationCaptured = useRef(false);
  const kalman = useRef(createKalmanPosition());
  const routePointsRef = useRef([]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 991.98px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  const destination = company
    ? [
        Number(company.latitude ?? company.lat),
        Number(company.longitude ?? company.lng ?? company.lon),
      ]
    : null;
  const validDestination = Boolean(
    destination &&
    destination.length === 2 &&
    destination.every(Number.isFinite),
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationWarning(
        "Location is unavailable. Showing North Industrial Area.",
      );
      return undefined;
    }
    const watch = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const rawPoint = [Number(coords.latitude), Number(coords.longitude)];
        if (!validPoint(rawPoint)) return;

        // Before navigation starts, capture only one location for the preview.
        // The active watch continues only after the user presses Start Navigation.
        if (!started && initialLocationCaptured.current) return;
        if (!started) initialLocationCaptured.current = true;

        const next = kalman.current.update(rawPoint[0], rawPoint[1], Number(coords.accuracy) || 25);

        // Check jitter FIRST — before touching position state at all
        if (
          lastDisplayedPos.current &&
          haversineDistance(
            lastDisplayedPos.current[0],
            lastDisplayedPos.current[1],
            next.lat,
            next.lng,
          ) < 0.01
        ) {
          // moved less than ~8m — likely GPS noise, keep heading fresh, skip everything else
          if (Number.isFinite(coords.heading)) setHeading(coords.heading);
          return;
        }
        lastDisplayedPos.current = [next.lat, next.lng];

        setPosition((previous) => {
          if (!previous) {
            lastRouteOrigin.current = [next.lat, next.lng];
            setRouteOrigin([next.lat, next.lng]);
          }
          return next;
        });
        if (Number.isFinite(coords.accuracy)) setAccuracy(coords.accuracy);
        setLocationWarning("");
        if (Number.isFinite(coords.heading)) setHeading(coords.heading);

        const offRoute = distanceToRouteMeters([next.lat, next.lng], routePointsRef.current) > 50;
        if (
          started &&
          haversineDistance(
            lastRouteOrigin.current[0],
            lastRouteOrigin.current[1],
            next.lat,
            next.lng,
          ) >= 0.01 || offRoute
        ) {
          lastRouteOrigin.current = [next.lat, next.lng];
          setRouteOrigin([next.lat, next.lng]);
        }
      },
      () => {
        setPosition(null);
        setLocationWarning(
          "Location access was denied. Showing North Industrial Area.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [started]);

  const origin =
    position && validPoint([position.lat, position.lng])
      ? [position.lat, position.lng]
      : NIA_CENTER;

  const {
    data: route,
    isFetching: routeLoading,
    error: routeError,
  } = useGraphHopperRoute({
    origin: routeOrigin,
    destination,
    mode,
    enabled: validDestination && Boolean(routeOrigin),
  });
  const routeCenter = validPoint(origin) ? origin : NIA_CENTER;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin[0]},${origin[1]}&destination=${destination?.[0]},${destination?.[1]}&travelmode=${mode === "cycling" ? "bicycling" : mode === "walking" ? "walking" : "driving"}`;
  const appleUrl = `https://maps.apple.com/?saddr=${origin[0]},${origin[1]}&daddr=${destination?.[0]},${destination?.[1]}&dirflg=${mode === "walking" ? "w" : mode === "cycling" ? "b" : "d"}`;
  const safeRoutePoints =
    route?.points
      ?.filter((point) => validPoint(point))
      .map((point) => point.map(Number)) || [];
  const displayedRoutePoints = position && safeRoutePoints.length > 0
    ? [[position.lat, position.lng], ...safeRoutePoints]
    : safeRoutePoints;
  routePointsRef.current = safeRoutePoints;
  const summary = route
    ? `${(route.distance / 1000).toFixed(1)} km · ${formatDuration(route.time)}`
    : "Route unavailable";

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (isError || !company || !validDestination)
    return (
      <div className="container py-5 text-center">
        <p className="fw-semibold">This company has no valid map location.</p>
        <Link to="/companies" className="text-primary-brand">
          Back to results
        </Link>
      </div>
    );

  const ModeSelector = () => (
    <div className="d-flex gap-2 mb-3">
      {modes.map((item) => (
        <button
          key={item.key}
          onClick={() => setMode(item.key)}
          className="btn flex-fill rounded-3 d-flex flex-column align-items-center py-2"
          style={
            mode === item.key
              ? {
                  background: "var(--color-primary-light)",
                  border: "1.5px solid var(--color-primary)",
                }
              : {
                  background: "#fff",
                  border: "1.5px solid var(--color-border)",
                }
          }
        >
          <i className={`bi ${item.icon} mb-1`} />
          <span className="fw-semibold" style={{ fontSize: "0.8rem" }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
  const navigationMap = (
    <NavigationMap
      height="100%"
      initialCenter={destination}
      origin={routeCenter}
      destination={destination}
      routePoints={displayedRoutePoints}
      userIcon={userMarker}
      destinationIcon={marker}
      destinationColor={company.category_color || company.color || "#e0405a"}
      mode={mode}
      heading={heading}
      position={position}
      accuracy={accuracy}
      animateToOrigin={Boolean(position)}
    />
  );
  const Controls = () => (
    <div className="position-relative" style={{ minHeight: 190 }}>
      <ModeSelector />
      {locationWarning && (
        <div className="alert alert-warning py-2 small">{locationWarning}</div>
      )}
      <div className="small text-muted-brand mb-2">
        <i className="bi bi-crosshair2 me-1" />
        {accuracy == null
          ? "Locating you…"
          : `GPS accuracy ±${Math.round(accuracy)} m${started ? " · Live navigation active" : " · Preview route"}`}
      </div>

      {routeError && (
        <div className="text-danger small mb-2">
          Unable to load the route. Try an external map.
        </div>
      )}

      <p className="fw-bold mb-0">
        {started && route ? summary : "Select Start Navigation to load route"}
      </p>

      <p className="text-muted-brand small mb-3">
        {started
          ? "Live route updates are enabled."
          : "The route is ready to load when you start navigation."}
      </p>
      <button
        className="btn btn-brand w-100 rounded-3 py-2 mb-2"
        onClick={() => setStarted(true)}
        disabled={started}
      >
        {started ? "Navigation Started" : "Start Navigation"}
      </button>
      {started && (
        <button
          className="btn btn-outline-danger w-100 rounded-3 py-2 mb-2"
          onClick={() => setStarted(false)}
        >
          Cancel Navigation
        </button>
      )}
      {routeError && (
        <div className="d-flex gap-2">
          <a
            className="btn btn-outline-secondary flex-fill"
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            <i className="bi bi-google me-1" /> Google Maps
          </a>
          <a
            className="btn btn-outline-secondary flex-fill"
            href={appleUrl}
            target="_blank"
            rel="noreferrer"
          >
            <i className="bi bi-apple me-1" /> Apple Maps
          </a>
        </div>
      )}
      {routeLoading && <LoadingSpinner overlay />}
    </div>
  );
  return (
    <>
      <MobileHeader variant="back" title="Directions" />
      {isMobile && <div
        className="d-lg-none d-flex flex-column"
        style={{
          height: "calc(100vh - var(--header-h-mobile) - var(--bottomnav-h))",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div className="px-3 pt-3">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span
              className="rounded-circle"
              style={{ width: 10, height: 10, background: "#2f6fed" }}
            />
            <span className="text-muted-brand small">My Location</span>
          </div>
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-geo-alt-fill text-danger" />
            <span className="fw-medium small">{company.name}</span>
          </div>
        </div>
        <div className="flex-fill" style={{ minHeight: 0, overflow: "hidden" }}>
          {navigationMap}
        </div>
        <div className="p-3 bg-white border-top">
          <Controls />
        </div>
      </div>}
      {!isMobile && <div
        className="d-none d-lg-flex container-fluid py-4 px-4 gap-4"
        style={{ maxWidth: 1320, margin: "0 auto" }}
      >
        <aside style={{ width: 340, flexShrink: 0 }}>
          <Link
            to={`/companies/${company.public_id || company.id}`}
            className="d-inline-flex align-items-center gap-2 text-dark text-decoration-none mb-3"
          >
            <i className="bi bi-arrow-left" /> Back to {company.name}
          </Link>
          <h1
            className="fw-bold mb-3 font-display"
            style={{ fontSize: "1.3rem" }}
          >
            Directions
          </h1>
          <div className="card-surface p-3">
            <Controls />
          </div>
        </aside>
        <div className="flex-fill">
          <div style={{ height: 640 }}>{navigationMap}</div>
        </div>
      </div>}
    </>
  );
}
