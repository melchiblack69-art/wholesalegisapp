import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import MobileHeader from "../components/MobileHeader";
import { api } from "../api/client";
import { NIA_CENTER } from "../components/CompanyMap";

const modes = [
  { key: "driving", label: "6 min", sub: "2.1 km", icon: "bi-car-front-fill" },
  { key: "cycling", label: "8 min", sub: "2.5 km", icon: "bi-bicycle" },
  { key: "walking", label: "25 min", sub: "2.1 km", icon: "bi-person-walking" },
];

function dot(color) {
  return L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 0 2px ${color}"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function Directions() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  useEffect(() => { api.get(`/api/user/companies/${id}`).then(setCompany).catch(() => setCompany(null)); }, [id]);
  const [mode, setMode] = useState("driving");

  if (!company) {
    return (
      <div className="container py-5 text-center">
        <p className="fw-semibold">Company not found.</p>
        <Link to="/companies" className="text-primary-brand">Back to results</Link>
      </div>
    );
  }

  const origin = NIA_CENTER;
  const destination = [Number(company.latitude), Number(company.longitude)];
  // mock route waypoints — swap for a real GraphHopper polyline once the backend is wired up
  const route = [
    origin,
    [origin[0] + 0.001, origin[1] + 0.0015],
    [origin[0] + 0.0025, origin[1] + 0.0005],
    [destination[0] - 0.0008, destination[1] - 0.0008],
    destination,
  ];
  const active = modes.find((m) => m.key === mode);

  const RouteMap = ({ height }) => (
    <div style={{ height, width: "100%" }}>
      <MapContainer center={origin} zoom={15} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={origin} icon={dot("#2f6fed")} />
        <Marker position={destination} icon={dot("#e0405a")} />
        <Polyline positions={route} pathOptions={{ color: "#2f6fed", weight: 5 }} />
      </MapContainer>
    </div>
  );

  const ModeSelector = () => (
    <div className="d-flex gap-2 mb-3">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => setMode(m.key)}
          className="btn flex-fill rounded-3 d-flex flex-column align-items-center py-2"
          style={
            mode === m.key
              ? { background: "var(--color-primary-light)", border: "1.5px solid var(--color-primary)" }
              : { background: "#fff", border: "1.5px solid var(--color-border)" }
          }
        >
          <i className={`bi ${m.icon} mb-1`} />
          <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>{m.label}</span>
          <span className="text-muted-brand" style={{ fontSize: "0.72rem" }}>{m.sub}</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <MobileHeader variant="back" title="Directions" />

      {/* ---------- MOBILE ---------- */}
      <div className="d-lg-none d-flex flex-column" style={{ height: "calc(100vh - var(--header-h-mobile) - var(--bottomnav-h))" }}>
        <div className="px-3 pt-3">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="rounded-circle" style={{ width: 10, height: 10, background: "#2f6fed" }} />
            <span className="text-muted-brand" style={{ fontSize: "0.88rem" }}>My Location</span>
          </div>
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-geo-alt-fill text-danger" />
            <span className="fw-medium" style={{ fontSize: "0.9rem" }}>{company.name}</span>
          </div>
          <ModeSelector />
        </div>

        <div className="flex-fill" style={{ minHeight: 240 }}>
          <RouteMap height="100%" />
        </div>

        <div className="p-3 bg-white border-top">
          <p className="fw-bold mb-0" style={{ fontSize: "1.1rem" }}>
            {active.label} ({active.sub})
          </p>
          <p className="text-muted-brand mb-3" style={{ fontSize: "0.82rem" }}>
            Fastest route now due to traffic conditions
          </p>
          <button className="btn btn-brand w-100 rounded-3 py-2">Start Navigation</button>
        </div>
      </div>

      {/* ---------- DESKTOP ---------- */}
      <div className="d-none d-lg-flex container-fluid py-4 px-4 gap-4" style={{ maxWidth: 1320, margin: "0 auto" }}>
        <aside style={{ width: 340, flexShrink: 0 }}>
          <Link to={`/companies/${company.id}`} className="d-inline-flex align-items-center gap-2 text-dark text-decoration-none mb-3">
            <i className="bi bi-arrow-left" /> Back to {company.name}
          </Link>
          <h1 className="fw-bold mb-3 font-display" style={{ fontSize: "1.3rem" }}>Directions</h1>

          <div className="card-surface p-3 mb-3">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="rounded-circle" style={{ width: 10, height: 10, background: "#2f6fed" }} />
              <span className="text-muted-brand" style={{ fontSize: "0.88rem" }}>My Location</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-geo-alt-fill text-danger" />
              <span className="fw-medium" style={{ fontSize: "0.9rem" }}>{company.name}</span>
            </div>
          </div>

          <ModeSelector />

          <div className="card-surface p-3">
            <p className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>
              {active.label} ({active.sub})
            </p>
            <p className="text-muted-brand mb-3" style={{ fontSize: "0.85rem" }}>
              Fastest route now due to traffic conditions
            </p>
            <button className="btn btn-brand w-100 rounded-3 py-2">Start Navigation</button>
          </div>
        </aside>

        <div className="flex-fill">
          <RouteMap height={640} />
        </div>
      </div>
    </>
  );
}
