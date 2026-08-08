import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MobileHeader from "../components/MobileHeader";
import CompanyCard from "../components/CompanyCard";
import { useCompanies } from "../api/queries";
import { useFavorites } from "../context/FavoritesContext";
import { companyImageUrl } from "../utils/image";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDistance } from "../utils/distance";
import { haversineDistance } from "../utils/haversine";

export default function Favorites() {
  const { favorites, toggleFavorite } = useFavorites();
  const { data: companies = [], isLoading } = useCompanies();
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return undefined;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => setUserPosition(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    return undefined;
  }, []);

  const favCompanies = useMemo(() => companies
    .filter((c) => favorites.includes(c.id) || (c.public_id && favorites.includes(c.public_id)))
    .map((c) => ({
      ...c,
      distanceKm: userPosition ? haversineDistance(userPosition.lat, userPosition.lng, c.latitude, c.longitude) : null,
    })), [companies, favorites, userPosition]);

  return (
    <>
      <MobileHeader variant="back" title="My Favorites" />

      <div className="container py-4 px-3" style={{ maxWidth: 1320 }}>
        <div className="d-none d-lg-block mb-4">
          <h1 className="fw-bold mb-1" style={{ fontSize: "1.4rem" }}>My Favorites</h1>
          <p className="text-muted-brand mb-0">Your saved wholesale companies</p>
        </div>

        {isLoading ? <LoadingSpinner /> : favCompanies.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-heart text-secondary" style={{ fontSize: "2.5rem" }} />
            <p className="text-muted-brand mt-3 mb-0">No favorites yet.</p>
            <Link to="/companies" className="text-primary-brand fw-semibold">Browse companies</Link>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="d-lg-none d-flex flex-column gap-2">
              {favCompanies.map((c) => (
                <CompanyCard key={c.id} company={c} />
              ))}
            </div>

            {/* Desktop table */}
            <div className="d-none d-lg-block card-surface p-2">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted-brand" style={{ fontSize: "0.82rem" }}>
                    <th className="fw-semibold border-0">Company</th>
                    <th className="fw-semibold border-0">Category</th>
                    <th className="fw-semibold border-0">Location</th>
                    <th className="fw-semibold border-0">Distance</th>
                    <th className="fw-semibold border-0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {favCompanies.map((c) => {
                    const cat = { name: c.category_name || "Uncategorized", color: c.category_color || "var(--color-primary)" };
                    return (
                      <tr key={c.id}>
                        <td>
                          <Link to={`/companies/${c.public_id || c.id}`} className="d-flex align-items-center gap-2 text-decoration-none text-dark">
                            <img
                              src={companyImageUrl(c, 100, 100)}
                              loading="lazy"
                              alt={c.name}
                              className="rounded-2"
                              style={{ width: 42, height: 42, objectFit: "cover" }}
                            />
                            <span className="fw-medium">{c.name}</span>
                          </Link>
                        </td>
                        <td style={{ color: cat.color, fontSize: "0.88rem" }}>{cat.name}</td>
                        <td className="text-muted-brand" style={{ fontSize: "0.88rem" }}>{c.address}</td>
                        <td className="text-muted-brand" style={{ fontSize: "0.88rem" }}>{formatDistance(c.distanceKm)}</td>
                        <td>
                          <button
                            className="btn btn-sm border-0 text-danger"
                            onClick={() => toggleFavorite(c.id)}
                            aria-label="Remove from favorites"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
