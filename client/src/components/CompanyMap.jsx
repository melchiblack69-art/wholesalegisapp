import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import { Link } from "react-router-dom";
import { formatDistance } from "../utils/distance";

const NIA_CENTER = [5.5715, -0.2298];

function pinIcon(color, active = false) {
  const size = active ? 38 : 30;
  const h = active ? 50 : 40;
  const svg = `
    <svg width="${size}" height="${h}" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z" fill="${color}" stroke="${active ? "#ffffff" : "none"}" stroke-width="${active ? 1.5 : 0}"/>
      <circle cx="15" cy="15" r="${active ? 7 : 6}" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, h],
    iconAnchor: [size / 2, h],
    popupAnchor: [0, -h + 4],
  });
}

function companyIcon(color) {
  return L.divIcon({ className: "company-map-icon", html: `<span style="background:${color};--marker-color:${color}"><i class="bi bi-buildings"></i></span>`, iconSize: [34, 43], iconAnchor: [17, 21] });
}

function userIcon() {
  return L.divIcon({ className: "user-map-icon", html: `<span><i class="bi bi-person-fill"></i><b>You</b></span>`, iconSize: [44, 44], iconAnchor: [22, 22] });
}

function RecenterOnChange({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
  return null;
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

export default function CompanyMap({
  companies,
  center = NIA_CENTER,
  height = 400,
  zoom = 15,
  showUserLocation = true,
  linkToDetail = true,
  selectedId = null,
  onSelect = null,
  recenterOnCenterChange = false,
  userPosition = null,
  locationPosition = null,
  locationLabel = "Selected location",
}) {

  return (
    <div style={{ height, width: "100%", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController center={center} zoom={zoom} />

        {recenterOnCenterChange && <RecenterOnChange center={center} />}

        {showUserLocation && <Marker position={userPosition || center} icon={userIcon()}><Tooltip permanent direction="top" offset={[0, -20]}>You</Tooltip></Marker>}

        {locationPosition && <Marker position={locationPosition} icon={pinIcon("#c52323")}><Tooltip permanent direction="top" offset={[0, -30]}>{locationLabel}</Tooltip></Marker>}

        {companies.map((c) => {
          const lat = Number(c.lat ?? c.latitude);
          const lng = Number(c.lng ?? c.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const cat = {
            name: c.category_name || "Uncategorized",
            color: c.category_color || c.color || "var(--color-primary)",
          };
          const active = c.id === selectedId;
          return (
            <Marker
              key={c.id}
              position={[lat, lng]}
              icon={companyIcon(cat.color)}
              eventHandlers={onSelect ? { click: () => onSelect(c.id) } : undefined}
            >
              <Tooltip permanent direction="top" offset={[0, -38]} opacity={0.9}>{c.name}</Tooltip>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <div className="fw-semibold">{c.name}</div>
                  <div style={{ color: cat.color, fontSize: "0.8rem" }}>{cat.name}</div>
                  <div className="text-muted-brand" style={{ fontSize: "0.78rem" }}>
                    {formatDistance(c.distanceKm)} away
                  </div>
                  {linkToDetail && (
                    <Link to={`/companies/${c.public_id || c.id}`} className="fw-semibold text-primary-brand d-inline-block mt-1" style={{ fontSize: "0.82rem" }}>
                      View Details
                    </Link>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export { NIA_CENTER };
