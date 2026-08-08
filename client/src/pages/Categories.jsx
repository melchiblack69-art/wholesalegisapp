import MobileHeader from "../components/MobileHeader";
import CategoryCard from "../components/CategoryCard";
import { useCategories } from "../api/queries";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Categories() {
  const { data: categories = [], isLoading, isError } = useCategories();

  return (
    <>
      <MobileHeader variant="back" title="Categories" />
      <div className="container py-4 px-3" style={{ maxWidth: 1320 }}>
        <h1 className="fw-bold d-none d-lg-block mb-1" style={{ fontSize: "1.6rem" }}>
          Categories
        </h1>
        <p className="text-muted-brand d-none d-lg-block mb-4">Browse companies by category</p>

        {isError && <p className="text-danger">Unable to load categories. Please try again.</p>}
        {isLoading ? <LoadingSpinner /> : <div className="row g-3">
          {categories.map((c) => (
            <div className="col-6 col-lg-4" key={c.id}>
              <CategoryCard category={c} variant="full" />
            </div>
          ))}
        </div>}
      </div>
    </>
  );
}
