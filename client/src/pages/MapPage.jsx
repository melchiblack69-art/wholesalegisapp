import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import debounce from "lodash.debounce";
import { RingLoader } from "react-spinners";
import { Link } from "react-router-dom";
import MobileHeader from "../components/MobileHeader";
import CompanyMap, { NIA_CENTER } from "../components/CompanyMap";
import { useAccraLocationSuggestions, useCompanyImages, useMapCompanies } from "../api/queries";
import { companyImageUrl } from "../utils/image";
import { useFavorites } from "../context/FavoritesContext";
import { haversineDistance } from "../utils/haversine";
import { formatDistance } from "../utils/distance";

const EMPTY_MAP_ROWS = [];
const MAX_SEARCH_RESULTS = 4;
const NEARBY_RADIUS_KM = 5;

export default function MapPage() {

  const [selectedId, setSelectedId] = useState(null);
 const { isFavorite, toggleFavorite } = useFavorites();

  const [activeCats, setActiveCats] = useState([]);
  const [categoryRows, setCategoryRows] = useState([]);
  const [locationQuery, setLocationQuery] = useState("");
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [searchedCompanyId, setSearchedCompanyId] = useState(null);
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState("");
  const { data: mapRows = EMPTY_MAP_ROWS, isLoading: loading, error } = useMapCompanies();
  const [userPosition, setUserPosition] = useState(null);

  /* location requests are debounced and cached by TanStack Query */
  const updateDebouncedQuery = useMemo(() => debounce((value) => setDebouncedLocationQuery(value), 350), []);
  useEffect(() => { updateDebouncedQuery(locationQuery); return () => updateDebouncedQuery.cancel(); }, [locationQuery, updateDebouncedQuery]);
  const { data: locationSuggestions = [], isFetching: locationLoading } = useAccraLocationSuggestions(debouncedLocationQuery);

  const companies = useMemo(() => (Array.isArray(mapRows) ? mapRows.map((company) => ({
    id: company.id,
    public_id: company.public_id,
    name: company.name || company.company_name,
    category: String(company.category_id || company.cat_id || company.category_name || "uncategorized"),
    category_name: company.category_name,
    category_color: company.color || "var(--color-primary)",
    address: company.address,
    cover_image: company.cover_image,
    lat: Number(company.latitude),
    lng: Number(company.longitude),
    status: company.status || "Active",
    products: company.products,
  })) : []), [mapRows]);

  const selectLocation = (result) => {
    setSearchedLocation([Number(result.lat), Number(result.lon)]);
    setSearchedCompanyId(null);
    setSelectedId(null);
    setLocationQuery(result.display_name.split(",").slice(0, 2).join(", "));
  };

  const localSuggestions = useMemo(() => {
    const query = locationQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    const searchable = companies.map((company) => ({ ...company, productsText: Array.isArray(company.products) ? company.products.map((product) => product?.product_name || product?.name || product).join(" ") : "" }));
    return new Fuse(searchable, { keys: ["name", "category_name", "address", "productsText"], threshold: 0.35 }).search(query).slice(0, MAX_SEARCH_RESULTS).map(({ item }) => item);
  }, [companies, locationQuery]);

  const visibleLocationSuggestions = locationSuggestions.slice(0, MAX_SEARCH_RESULTS);
  const locationSuggestionsPanel = (localSuggestions.length > 0 || visibleLocationSuggestions.length > 0 || (locationQuery.trim().length >= 2 && !locationLoading)) ? (
    <div className="position-absolute start-0 end-0 mt-1 bg-white rounded-3 shadow border overflow-hidden" style={{ zIndex: 1000, top: "100%" }}>
      {localSuggestions.length > 0 && <div className="px-3 pt-2 pb-1 text-uppercase text-muted-brand" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>Companies</div>}
      {localSuggestions.map((company) => (
        <button type="button" key={`company-${company.id}`} className="w-100 text-start border-0 bg-white px-3 py-2 small" onClick={() => { setLocationQuery(company.name); setSearchedLocation([company.lat, company.lng]); setSearchedCompanyId(company.id); setSelectedId(company.id); }}>
          <i className="bi bi-buildings text-primary-brand me-2" />
          <strong>{company.name}</strong><span className="text-muted-brand"> · {company.category_name || "Company"}</span>
        </button>
      ))}
      {visibleLocationSuggestions.length > 0 && <div className="px-3 pt-2 pb-1 text-uppercase text-muted-brand" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>Streets &amp; places in Ghana</div>}
      {visibleLocationSuggestions.map((result) => (
        <button type="button" key={result.place_id} className="w-100 text-start border-0 bg-white px-3 py-2 small" onClick={() => selectLocation(result)}>
          <i className="bi bi-geo-alt text-primary-brand me-2" />
          {result.display_name}
        </button>
      ))}
      {localSuggestions.length === 0 && visibleLocationSuggestions.length === 0 && !locationLoading && <div className="px-3 py-3 small text-muted-brand">No companies or Ghana locations found.</div>}
    </div>
  ) : null;

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => setUserPosition(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  
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

  const nearbyCompanies = useMemo(() => {
    if (!searchedLocation) return [];
    return companies
      .filter((company) => activeCats.includes(company.category))
      .map((company) => ({ ...company, distanceKm: haversineDistance(searchedLocation[0], searchedLocation[1], company.lat, company.lng) }))
      .filter((company) => Number.isFinite(company.distanceKm) && company.distanceKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 8);
  }, [activeCats, companies, searchedLocation]);

  const filtered = useMemo(() => companies.filter((c) => {
    if (!activeCats.includes(c.category)) return false;
    if (searchedCompanyId) return c.id === searchedCompanyId;
    if (searchedLocation) return nearbyCompanies.some((company) => company.id === c.id);
    if (!locationQuery) return true;
    const values = [c.name, c.category_name, ...(Array.isArray(c.products) ? c.products.flatMap((product) => [product, product?.product_name, product?.name]) : [])];
    return values.some((value) => String(value || "").toLowerCase().includes(locationQuery.trim().toLowerCase()));
  }), [activeCats, companies, locationQuery, searchedLocation, searchedCompanyId, nearbyCompanies]);

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
  const clearSearch = () => {
    setLocationQuery("");
    setSearchedLocation(null);
    setSearchedCompanyId(null);
    setSelectedId(null);
  };

  const locateUser = () => {
    clearSearch();
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
          <div className="search-shell d-flex align-items-center flex-fill rounded-3 px-3 py-2 shadow-sm position-relative">
            <i className="bi bi-search text-muted-brand me-2" />
            <input
              className="border-0 flex-fill bg-transparent"
              style={{ outline: "none", fontSize: "0.9rem" }}
              placeholder="Search in this area"
              value={locationQuery}
              onChange={(e) => { const value = e.target.value; setLocationQuery(value); if (!value.trim()) { setSearchedLocation(null); setSearchedCompanyId(null); } }}
            />
            {locationQuery && <button type="button" className="btn btn-sm border-0 p-0 text-muted-brand" onClick={clearSearch} aria-label="Clear search"><i className="bi bi-x-circle-fill" /></button>}
            {locationLoading && <RingLoader size={16} color="#1c6b41" aria-label="Searching locations" />}
            {locationSuggestionsPanel}
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
          locationPosition={searchedLocation}
          locationLabel="Selected location"
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
          <div className="search-shell d-flex align-items-center rounded-3 px-3 py-2 mb-4 position-relative">
            <i className="bi bi-search text-muted-brand me-2" />
            <input
              className="border-0 flex-fill bg-transparent"
              style={{ outline: "none", fontSize: "0.9rem" }}
              placeholder="Search location..."
              value={locationQuery}
              onChange={(e) => { const value = e.target.value; setLocationQuery(value); if (!value.trim()) { setSearchedLocation(null); setSearchedCompanyId(null); } }}
            />
            {locationQuery && <button type="button" className="btn btn-sm border-0 p-0 text-muted-brand" onClick={clearSearch} aria-label="Clear search"><i className="bi bi-x-circle-fill" /></button>}
            {locationLoading && <RingLoader size={16} color="#1c6b41" aria-label="Searching locations" />}
            {locationSuggestionsPanel}
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
          <CompanyMap companies={nearest} center={mapCenter} userPosition={userPosition ? [userPosition.lat, userPosition.lng] : null} locationPosition={searchedLocation} locationLabel="Selected location" showUserLocation={Boolean(userPosition)} height={640} zoom={14} selectedId={selected?.id} onSelect={setSelectedId} />
        </div>
      </div>
    </>
  );
}
