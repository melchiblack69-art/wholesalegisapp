import MobileHeader from "../components/MobileHeader";
import CategoryCard from "../components/CategoryCard";
import { useState, useEffect } from "react";
import { api } from "../api/client";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    api.get("/api/user/categories").then((rows) => setCategories(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, []);

  return (
    <>
      <MobileHeader variant="back" title="Categories" />
      <div className="container py-4 px-3" style={{ maxWidth: 1320 }}>
        <h1 className="fw-bold d-none d-lg-block mb-1" style={{ fontSize: "1.6rem" }}>
          Categories
        </h1>
        <p className="text-muted-brand d-none d-lg-block mb-4">Browse companies by category</p>

        <div className="row g-3">
          {categories.map((c) => (
            <div className="col-6 col-lg-4" key={c.id}>
              <CategoryCard category={c} variant="full" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
