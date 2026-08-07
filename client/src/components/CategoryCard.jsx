import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function CategoryCard({ category, variant = "compact" }) {
  if (variant === "full") {
    return (
      <div className="card-surface p-4 h-100 d-flex flex-column">
        <span
          className="icon-circle mb-3"
          style={{ width: 52, height: 52, background: category.bg, color: category.color }}
        >
          <i className={`bi ${category.icon} fs-4`} />
        </span>
        <span className="fw-semibold fs-6 text-dark">{category.category_name}</span>
        <span className="text-muted-brand mb-3" style={{ fontSize: "0.85rem" }}>
          {category.company_count} Companies
        </span>
        <Link
          to={`/companies?category=${category.category_name.toLowerCase().trim().replace(/\s+/g, "-")}`}
          className="fw-semibold text-primary-brand mt-auto"
          style={{ fontSize: "0.88rem" }}
        >
          View Companies <i className="bi bi-arrow-right ms-1" />
        </Link>
      </div>
    );
  }

  return (
    <Link
      to={`/companies?category=${category.category_name.toLowerCase().trim().replace(/\s+/g, "-")}`}
      className="card-surface d-flex flex-column align-items-center justify-content-center text-center py-3 px-2 hover-lift"
      style={{ minHeight: 92 }}
    >
      <span
        className="icon-circle mb-2"
        style={{ width: 38, height: 38, background: category.bg, color: category.color }}
      >
        <i className={`bi ${category.icon}`} />
      </span>
      <span className="fw-medium text-dark" style={{ fontSize: "0.72rem" }}>
        {category.category_name}
      </span>
      <span className="text-muted-brand" style={{ fontSize: "0.7rem" }}>
        {category.company_count}
      </span>
    </Link>
  );
}
