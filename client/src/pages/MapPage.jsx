import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MobileHeader from "../components/MobileHeader";
import CompanyMap, { NIA_CENTER } from "../components/CompanyMap";
import { useCompanyImages, useMapCompanies } from "../api/queries";
import { companyImageUrl } from "../utils/image";
import { useFavorites } from "../context/FavoritesContext";
import { haversineDistance } from "../utils/haversine";
import { formatDistance } from "../utils/distance";

const EMPTY_MAP_ROWS = [];

export default function MapPage() {

  const [selectedId, setSelectedId] = useState(null);
 const { isFavorite, toggleFavorite } = useFavorites();

  const [activeCats, setActiveCats] = useState([]);
  const [categoryRows, setCategoryRows] = useState([]);
  const [locationQuery, setLocationQuery] = useState("");
  const [searchedLocation, setSearchedLocation] = useState(null);
  const { data: mapRows = EMPTY_MAP_ROWS, isLoading: loading, error } = useMapCompanies();
  const [userPosition, setUserPosition] = useState(null);

  // Resolve typed place names so the map can move to a real location instead
  // of only filtering the already-loaded company list.
  useEffect(() => {
    const query = locationQuery.trim();
    if (!query) {
      setSearchedLocation(null);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
          { signal: controller.signal, headers: { Accept: "application/json" } },
        );
        const results = await response.json();
        const match = results?.[0];
        if (match) setSearchedLocation([Number(match.lat), Number(match.lon)]);
      } catch (requestError) {
        if (requestError.name !== "AbortError") setSearchedLocation(null);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [locationQuery]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => setUserPosition(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  
  const companies = useMemo(() => {
        const normalized = Array.isArray(mapRows)
          ? mapRows.map((company) => {
              const categoryId = String(company.category_id || company.cat_id || company.category_name || "uncategorized");
              return {
                id: company.id,
                public_id: company.public_id,
                name: company.name || company.company_name,
                category: categoryId,
                category_name: company.category_name,
                category_color: company.color  || "var(--color-primary)",
                address: company.address,
                cover_image: company.cover_image,
                lat: Number(company.latitude),
                lng: Number(company.longitude),
                status: company.status || "Active",
              };
            })
          : [];
        return normalized;
  }, [mapRows]);

  useEffect(() => {
        const unique = Array.from(new Map(companies.map((c) => [c.category,
          { id: c.category, name: c.category_name || "Uncategorized" ,category_color: c.category_color || "var(--color-primary)", }])).values());
        setCategoryRows((previous) => {
          const unchanged = previous.length === unique.length && previous.every((item, index) => item.id === unique[index]?.id);
          return unchanged ? previous : unique;
        });
        setActiveCats((previous) => {
          const next = unique.map((c) => c.id);
          const unchanged = previous.length === next.length && previous.every((id, index) => id === next[index]);
          return unchanged ? previous : next;
        });
  }, [companies]);

  const filtered = useMemo(
    () => companies.filter((c) => activeCats.includes(c.category) && (!locationQuery || [
      c.name,
      c.category_name,
      c.address,
      ...(Array.isArray(c.products) ? c.products.flatMap((product) => [product, product?.product_name, product?.name]) : []),
    ].some((value) => String(value || "").toLowerCase().includes(locationQuery.trim().toLowerCase())))),
    [activeCats, companies, locationQuery]
  );

  const nearest = useMemo(
    () => [...filtered].map((c) => ({ ...c, distanceKm: userPosition ? haversineDistance(userPosition.lat, userPosition.lng, c.lat, c.lng) : null })),
    [filtered, userPosition]
  );

  const getCategory = (slug) =>
  categoryRows.find((c) => c.id === slug) || categoryRows[0];

  const selected = nearest.find((c) => c.id === selectedId) || null;
  const { data: selectedImages = [] } = useCompanyImages(selected?.public_id || selected?.id);
  const selectedCover = selected?.cover_image || selectedImages.find((image) => image.is_cover)?.url || selectedImages[0]?.url || null;
  const selectedCat = selected ? getCategory(selected.category) : null;
  const favorited = selected ? isFavorite(selected.id) : false;


  // default the sheet to the nearest company; keep selection if user taps a marker
  const locateUser = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => setUserPosition(null), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const toggleCat = (slug) =>
    setActiveCats((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const allChecked = activeCats.length === categoryRows.length;
  const toggleAll = () => setActiveCats(allChecked ? [] : categoryRows.map((c) => c.id));
  const mapCenter = searchedLocation || (userPosition ? [userPosition.lat, userPosition.lng] : (nearest[0] ? [nearest[0].lat, nearest[0].lng] : NIA_CENTER));

  return (
    <>
      <MobileHeader variant="plain" title="Map" />

      {/* ---------- MOBILE ---------- */}
      <div className="d-lg-none position-relative" style={{ height: "calc(100vh - var(--header-h-mobile) - var(--bottomnav-h))", overflow: "hidden" }}>
        <div className="position-absolute w-100 px-3 d-flex gap-2" style={{ top: 12, zIndex: 500 }}>
          <div className="search-shell d-flex align-items-center flex-fill rounded-3 px-3 py-2 shadow-sm">
            <i className="bi bi-search text-muted-brand me-2" />
            <input
              className="border-0 flex-fill bg-transparent"
              style={{ outline: "none", fontSize: "0.9rem" }}
              placeholder="Search in this area"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
          </div>
          <button className="btn bg-white rounded-3 shadow-sm px-3 border-0" aria-label="Filters">
            <i className="bi bi-sliders" />
          </button>
          <button onClick={locateUser} className="btn bg-white rounded-3 shadow-sm px-3 border-0" aria-label="My location">
            <i className="bi bi-person-fill text-primary-brand" />
          </button>
        </div>

        <CompanyMap
          companies={nearest}
          center={mapCenter}
          userPosition={userPosition ? [userPosition.lat, userPosition.lng] : null}
          showUserLocation={Boolean(userPosition)}
          height="100%"
          selectedId={selected?.id}
          onSelect={(id) => setSelectedId(id)}
        />

        {selected && (
          <div
            className="position-absolute bottom-0 start-0 w-100 bg-white p-3"
            style={{
              zIndex: 500,
              borderTopLeftRadius: "var(--radius-lg)",
              borderTopRightRadius: "var(--radius-lg)",
              boxShadow: "0 -8px 24px rgba(14,46,28,0.16)",
            }}
          >
            <div className="mx-auto mb-2" style={{ width: 40, height: 4, borderRadius: 999, background: "var(--color-border-strong)" }} />
            <div className="d-flex align-items-center gap-3">
              <img
                src={selectedCover || companyImageUrl(selected) || null}
                loading="lazy"
                alt={selected.name}
                className="rounded-3"
                style={{ width: 56, height: 56, objectFit: "cover" }}
              />
              <div className="flex-fill min-w-0">
                <div className="fw-semibold text-truncate">{selected.name}</div>
                <div className="d-flex align-items-center gap-1" style={{ fontSize: "0.78rem" }}>
                  <span style={{ color: selectedCat.color }} className="fw-medium">{selectedCat.name}</span>
                  <span className="text-muted-brand">· {formatDistance(selected.distanceKm)} away</span>
                </div>
              </div>
              <button
                className="btn btn-sm border-0 p-0"
                onClick={() => toggleFavorite(selected.id)}
                aria-label="Favorite"
              >
                <i
                  className={`bi ${favorited ? "bi-heart-fill" : "bi-heart"} fs-5`}
                  style={{ color: favorited ? "#e0405a" : "#b7c0b9" }}
                />
              </button>
            </div>
            <Link to={`/companies/${selected.public_id || selected.id}`} className="btn btn-brand w-100 mt-3 rounded-3">
              View Details
            </Link>
          </div>
        )}
      </div>

      {/* ---------- DESKTOP ---------- */}
      <div className="d-none d-lg-flex container-fluid py-4 px-4 gap-4" style={{ maxWidth: 1320, margin: "0 auto" }}>
        <aside style={{ width: 280, flexShrink: 0 }}>
          <h1 className="fw-bold mb-3 font-display" style={{ fontSize: "1.3rem" }}>
            Interactive Map
          </h1>
          <div className="search-shell d-flex align-items-center rounded-3 px-3 py-2 mb-4">
            <i className="bi bi-search text-muted-brand me-2" />
            <input
              className="border-0 flex-fill bg-transparent"
              style={{ outline: "none", fontSize: "0.9rem" }}
              placeholder="Search location..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
          </div>

          <p className="fw-semibold mb-2" style={{ fontSize: "0.9rem" }}>
            Categories
          </p>
          <div className="form-check mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="all-cats"
              checked={allChecked}
              onChange={toggleAll}
            />
            <label className="form-check-label" htmlFor="all-cats">
              All Categories
            </label>
          </div>
          {categoryRows.map((c) => (
            <div className="form-check mb-2" key={c.id}>
              <input
                className="form-check-input"
                type="checkbox"
                id={c.id}
                checked={activeCats.includes(c.id)}
                onChange={() => toggleCat(c.id)}
              />
              <label className="form-check-label" htmlFor={c.slug}>
                {c.name}
              </label>
            </div>
          ))}

          <p className="fw-semibold mt-4 mb-2" style={{ fontSize: "0.9rem" }}>
            Legend
          </p>
          {categoryRows.map((c) => (
            <div className="d-flex align-items-center gap-2 mb-2" key={c.id}>
              <span
                style={{ width: 12, height: 12, borderRadius: "50%", background: c.category_color, display: "inline-block" }}
              />
              <span style={{ fontSize: "0.85rem" }}>{c.name}</span>
            </div>
          ))}

          <button onClick={locateUser} className="btn btn-brand-outline w-100 mt-3 rounded-3">
            <i className="bi bi-crosshair me-2" /> My Location
          </button>
        </aside>

        <div className="flex-fill">
          <CompanyMap companies={nearest} center={mapCenter} userPosition={userPosition ? [userPosition.lat, userPosition.lng] : null} showUserLocation={Boolean(userPosition)} height={640} zoom={14} selectedId={selected?.id} onSelect={setSelectedId} />
        </div>
      </div>
    </>
  );
}
