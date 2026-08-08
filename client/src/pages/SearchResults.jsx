import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MobileHeader from "../components/MobileHeader";
import SearchBar from "../components/SearchBar";
import CompanyCard from "../components/CompanyCard";
import CompanyMap from "../components/CompanyMap";
import { api } from "../api/client";
import { loggedQuery, useCategories, useCompanies, useLoggedQuery } from "../api/queries";
import { haversineDistance } from "../utils/haversine";
import LoadingSpinner from "../components/LoadingSpinner";

const PAGE_SIZE = 5;

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").toLowerCase();
  const [search, setSearch] = useState(q);
  const categorySlug = params.get("category") || "";
  const [visible, setVisible] = useState(PAGE_SIZE);
  const { data: allCompanies = [], isLoading: companiesLoading } = useCompanies();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const category = categories.find((item) => item.category_name?.toLowerCase().trim().replace(/\s+/g, "-") === categorySlug);
  const categoryIdentifier = category?.public_id;
  const categoryQueryKey = ["companies-by-category", categoryIdentifier];
  const { data: categoryCompanies = [], isLoading: categoryCompaniesLoading } = useLoggedQuery("companies-by-category", { queryKey: categoryQueryKey, queryFn: loggedQuery("companies-by-category", categoryQueryKey, () => api.get(`/api/user/category/${categoryIdentifier}`)), enabled: Boolean(categoryIdentifier), staleTime: 2 * 60 * 1000, select: (rows) => Array.isArray(rows) ? rows.map((c) => ({ ...c, name: c.company_name })) : [] });
  const [position, setPosition] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationLoading(false); return; }
    const timeout = window.setTimeout(() => setLocationLoading(false), 12000);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setPosition({ lat: coords.latitude, lng: coords.longitude }); setLocationLoading(false); },
      () => { setPosition(null); setLocationLoading(false); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => window.clearTimeout(timeout);
  }, []);

  const companies = category ? categoryCompanies : allCompanies;

  const filtered = useMemo(() => {
    return companies
      .filter((c) => (categorySlug ? c.category_name?.toLowerCase().replace(/\s+/g, "-") === categorySlug : true))
      .filter((c) => {
        if (!search) return true;
        const cat = c.category_name || "";
        return (
          (c.name || "").toLowerCase().includes(search) ||
          cat.toLowerCase().includes(search) ||
          (c.address || "").toLowerCase().includes(search) ||
          (Array.isArray(c.products) && c.products.some((p) => (p.product_name || p).toLowerCase().includes(search)))
        );
      })
      .map((c) => ({ ...c, distanceKm: position ? haversineDistance(position.lat, position.lng, c.latitude, c.longitude) : null }))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [search, categorySlug, position, companies]);

  const results = filtered.slice(0, visible);

  return (
    <>
      <MobileHeader variant="back" title="Search Results" />

      <div className="container-fluid py-3 py-lg-4 px-3 px-lg-4" style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div className="mb-3">
          <SearchBar defaultValue={q} autoNavigate={false} onValueChange={(value) => setSearch(value.toLowerCase())} onFilterClick={() => {}} />
        </div>

        <div className="row g-3 g-lg-4">
          <div className="col-lg-4">
            <p className="fw-semibold text-muted-brand mb-2" style={{ fontSize: "0.82rem" }}>
              {filtered.length} {filtered.length === 1 ? "Company" : "Companies"} Found
            </p>

            <div className="position-relative d-flex flex-column gap-2" style={{ minHeight: 180, maxHeight: "72vh", overflowY: "auto" }}>
              {categoriesLoading || companiesLoading || categoryCompaniesLoading || locationLoading ? (
                <LoadingSpinner overlay />
              ) : results.length === 0 && (
                <div className="text-center text-muted-brand py-5">
                  No companies match your search. Try a different keyword.
                </div>
              )}
              {results.map((c) => (
                <CompanyCard key={c.id} company={c} dense />
              ))}
            </div>

            {visible < filtered.length && (
              <button
                className="btn btn-brand-outline w-100 mt-3 rounded-3"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Load More <i className="bi bi-chevron-down ms-1" />
              </button>
            )}
          </div>

          <div className="col-lg-8 d-none d-lg-block">
            <div className="position-sticky" style={{ top: "calc(var(--navbar-h-desktop) + 16px)" }}>
              <CompanyMap companies={filtered} center={filtered[0] ? [Number(filtered[0].latitude), Number(filtered[0].longitude)] : undefined} userPosition={position ? [position.lat, position.lng] : null} showUserLocation={Boolean(position)} height={720} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
