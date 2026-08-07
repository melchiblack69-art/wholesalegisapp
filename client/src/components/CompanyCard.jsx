import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useFavorites } from "../context/FavoritesContext";
import { companyImageUrl } from "../utils/image";

export default function CompanyCard({ company, dense = false }) {
  const cat = { name: company.category_name || "Uncategorized", color: company.category_color || "var(--color-primary)" };
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(company.id);
  const [cover, setCover] = useState(company.cover_image || null);
  useEffect(() => {
    if (cover || !company.id) return;
    api.get(`/api/user/company/${company.id}/images`).then((data) => {
      const image = (data?.images || []).find((item) => item.is_cover) || data?.images?.[0];
      if (image?.url) setCover(image.url);
    }).catch(() => {});
  }, [company.id, cover]);
  const imgSize = dense ? 60 : 76;

  return (
    <div className={`card-surface d-flex align-items-center gap-3 hover-lift ${dense ? "p-2" : "p-2"}`}>
      <Link
        to={`/companies/${company.id}`}
        className="flex-shrink-0"
        style={{ width: imgSize, height: imgSize }}
      >
        <img
          src={cover || undefined}
          alt={company.name}
          loading="lazy"
          className="w-100 h-100 rounded-3 object-fit-cover"
        />
      </Link>

      <div className="flex-fill min-w-0">
        <div className="d-flex align-items-center justify-content-between gap-2">
          <Link
            to={`/companies/${company.id}`}
            className="fw-semibold text-dark text-truncate"
            style={{ fontSize: dense ? "0.9rem" : "0.95rem" }}
          >
            {company.name}
          </Link>
          <button
            className="btn btn-sm border-0 p-0 flex-shrink-0"
            onClick={() => toggleFavorite(company.id)}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <i
              className={`bi ${favorited ? "bi-heart-fill" : "bi-heart"}`}
              style={{ color: favorited ? "#e0405a" : "#b7c0b9", fontSize: "1rem" }}
            />
          </button>
        </div>

        {dense ? (
          <div className="d-flex align-items-center gap-1 text-truncate mt-1" style={{ fontSize: "0.76rem" }}>
            <i className="bi bi-star-fill" style={{ color: "#f5a623", fontSize: "0.7rem" }} />
            <span className="fw-semibold">{Number(company.rating || 0).toFixed(1)}</span>
            <span className="text-muted-brand">·</span>
            <span style={{ color: cat.color }} className="fw-medium text-truncate">{cat.name}</span>
            <span className="text-muted-brand">·</span>
            <span className="text-muted-brand text-nowrap">{company.distanceKm || "—"} km</span>
          </div>
        ) : (
          <>
            <span className="fw-medium d-block" style={{ fontSize: "0.8rem", color: cat.color }}>
              {cat.name}
            </span>
            <span className="text-muted-brand" style={{ fontSize: "0.78rem" }}>
              {company.distanceKm} km away
            </span>
          </>
        )}
      </div>
    </div>
  );
}
