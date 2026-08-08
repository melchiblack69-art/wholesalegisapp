import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

export const NIA_CENTER = [5.6037, -0.1870];

function pinIcon(color, active = false) {
  const size = active ? 34 : 28;
  const h = active ? 46 : 38;
  const svg = `
    <svg width="${size}" height="${h}" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [size, h], iconAnchor: [size / 2, h] });
}

function companyIcon(color) {
  return L.divIcon({ className: "admin-company-map-icon", html: `<span style="background:${color};--marker-color:${color}"><i class="bi bi-buildings"></i></span>`, iconSize: [34, 43], iconAnchor: [17, 21] });
}

function MapViewController({ center, zoom, pinPosition }) {
  const map = useMap();

  useEffect(() => {
    const target = pinPosition || center;
    if (Array.isArray(target) && target.length === 2) {
      const lat = Number(target[0]);
      const lng = Number(target[1]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        map.setView([lat, lng], zoom, { animate: true, duration: 0.4 });
      }
    }
  }, [map, center, pinPosition, zoom]);

  return null;
}

// Display-only map. It either shows a single pin (pinPosition — used to
// preview a location set via "Use current location") or a list of company
// markers. It no longer supports click-to-place: locations that don't render
// clearly on the tile layer made click-picking error-prone, so location
// capture now happens through the geolocation button in CompanyForm instead.
export default function AdminMap({
  companies = [],
  height = 400,
  zoom = 13,
  center = NIA_CENTER,
  pinPosition = null,
}) {
  return (
    <div style={{ height, width: "100%", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
      <MapContainer key={`${pinPosition?.[0] ?? "n"}-${pinPosition?.[1] ?? "n"}-${center?.[0] ?? "n"}-${center?.[1] ?? "n"}`} center={pinPosition || center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapViewController center={center} zoom={zoom} pinPosition={pinPosition} />

        {pinPosition && <Marker position={pinPosition} icon={companyIcon("#1c6b41")} />}

        {!pinPosition &&
          companies.map((c) => {
            const categoryName = c.category_name || c.category || "Uncategorized";
            const categoryColor = c.category_color || c.color || "var(--color-primary)";
            const lat = Number(c.lat ?? c.latitude ?? c.lng);
            const lng = Number(c.lng ?? c.longitude ?? c.lat);
            if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
            return (
              <Marker key={c.id} position={[lat, lng]} icon={companyIcon(categoryColor)}>
                <Popup>
                  <div style={{ minWidth: 150 }}>
                    <div className="fw-semibold">{c.name || c.company_name}</div>
                    <div style={{ color: categoryColor, fontSize: "0.8rem" }}>{categoryName}</div>
                    <div className="text-muted-brand" style={{ fontSize: "0.78rem" }}>{c.status}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
