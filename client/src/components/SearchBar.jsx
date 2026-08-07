import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar({
  defaultValue = "",
  placeholder = "Search company name, product or category...",
  onFilterClick,
  size = "md",
  autoNavigate = true,
  onValueChange,
}) {
  const [value, setValue] = useState(defaultValue);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (autoNavigate) {
      navigate(`/companies?q=${encodeURIComponent(value)}`);
    }
  };

  const padding = size === "lg" ? "py-3" : "py-2";

  return (
    <form onSubmit={submit} className="d-flex align-items-center gap-2 w-100">
      <div className={`search-shell d-flex align-items-center flex-fill rounded-3 px-3 ${padding}`}>
        <i className="bi bi-search text-muted-brand me-2" />
        <input
          type="text"
          className="border-0 flex-fill focus-ring bg-transparent"
          style={{ outline: "none", fontSize: "0.95rem" }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => { setValue(e.target.value); onValueChange?.(e.target.value); }}
        />
        {value && (
          <button
            type="button"
            className="btn btn-sm border-0 p-0 text-muted-brand"
            onClick={() => setValue("")}
            aria-label="Clear search"
          >
            <i className="bi bi-x-circle-fill" />
          </button>
        )}
      </div>
      {onFilterClick ? (
        <button
          type="button"
          onClick={onFilterClick}
          className={`btn btn-brand-outline rounded-3 ${padding} px-3`}
          aria-label="Filters"
        >
          <i className="bi bi-sliders" />
        </button>
      ) : (
        <button
          type="submit"
          className={`btn btn-brand rounded-3 ${padding} px-4 d-none d-lg-inline-flex align-items-center gap-2`}
        >
          <i className="bi bi-search" /> Search
        </button>
      )}
    </form>
  );
}
