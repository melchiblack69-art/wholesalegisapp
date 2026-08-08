import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MobileHeader from "../components/MobileHeader";
import SearchBar from "../components/SearchBar";
import CategoryCard from "../components/CategoryCard";
import CompanyCard from "../components/CompanyCard";
import MobileMenuDrawer from "../components/MobileMenuDrawer";
import { useCategories, useCompanies, useStats } from "../api/queries";
import { haversineDistance } from "../utils/haversine";


export default function Home() {
  const { data: categories = [] } = useCategories();
  const { data: companyRows = [] } = useCompanies();
  const { data: statsData } = useStats();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => setPosition(null), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);
  const companies = companyRows;
  const stats = [
    { icon: "bi-geo-alt-fill", value: `${statsData?.total_companies || 0}`, label: "Wholesale Companies" },
    { icon: "bi-grid-fill", value: `${statsData?.total_categories || 0}`, label: "Categories" },
    { icon: "bi-box-seam-fill", value: `${statsData?.total_products || 0}`, label: "Products" },
  ];
  
  const [menuOpen, setMenuOpen] = useState(false);
  const nearest = [...companies]
    .map((company) => ({
      ...company,
      distanceKm: position ? haversineDistance(position.lat, position.lng, company.latitude, company.longitude) : null,
    }))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));

  return (
    <>
      <MobileHeader variant="home" onMenuClick={() => setMenuOpen(true)} />
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* ---------- MOBILE HERO ---------- */}
      <section
        className="d-lg-none px-3 pt-4 pb-4 text-white position-relative"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(14,46,28,0.82), rgba(28,107,65,0.72)), url(https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=900&q=60)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <h1 className="fw-bold mb-2" style={{ fontSize: "1.6rem" }}>
          Find Wholesale Companies Near You
        </h1>
        <p className="mb-3" style={{ fontSize: "0.88rem", opacity: 0.9 }}>
          Search, locate and get directions to wholesale companies in the North
          Industrial Area.
        </p>
        <SearchBar placeholder="Search company, product..." onFilterClick={() => {}} />
      </section>

      {/* ---------- DESKTOP HERO ---------- */}
      <section
        className="d-none d-lg-block position-relative"
        style={{
          minHeight: 440,
          backgroundImage:
            "linear-gradient(rgba(14,46,28,0.55), rgba(14,46,28,0.75)), url(https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=1600&q=70)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container h-100 d-flex flex-column justify-content-center py-5" style={{ maxWidth: 1320 }}>
          <h1 className="fw-bold text-white mb-3" style={{ fontSize: "2.6rem", maxWidth: 620 }}>
            Find Wholesale Companies Easily
          </h1>
          <p className="text-white mb-4" style={{ fontSize: "1.05rem", maxWidth: 560, opacity: 0.92 }}>
            Search, locate and get directions to wholesale companies in North
            Industrial Area.
          </p>
          <div style={{ maxWidth: 640 }}>
            <SearchBar placeholder="Search company name, product or category..." size="lg" />
          </div>
        </div>
      </section>

      <div className="container py-4" style={{ maxWidth: 1320 }}>
        {/* Popular categories */}
        <div className="d-flex align-items-center justify-content-between mb-3 px-2 px-lg-0">
          <h2 className="fw-bold mb-0" style={{ fontSize: "1.1rem" }}>
            Popular Categories
          </h2>
          <Link to="/categories" className="text-primary-brand fw-semibold" style={{ fontSize: "0.85rem" }}>
            View all
          </Link>
        </div>
        <div className="row g-2 g-lg-3 px-2 px-lg-0 mb-4">
          {categories.map((c) => (
            <div className="col-4 col-lg-2" key={c.id}>
              <CategoryCard category={c} variant="compact" />
            </div>
          ))}
        </div>

        {/* Desktop stats bar */}
        <div className="d-none d-lg-flex card-surface justify-content-between p-4 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="d-flex align-items-center gap-3">
              <span
                className="icon-circle bg-primary-brand text-white"
                style={{ width: 46, height: 46 }}
              >
                <i className={`bi ${s.icon} fs-5`} />
              </span>
              <div className="d-flex flex-column lh-1">
                <span className="fw-bold fs-5">{s.value}</span>
                <span className="text-muted-brand" style={{ fontSize: "0.8rem" }}>
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Nearest companies (mobile) */}
        <div className="d-lg-none">
          <div className="d-flex align-items-center justify-content-between mb-3 px-2">
            <h2 className="fw-bold mb-0" style={{ fontSize: "1.1rem" }}>
              Nearest Companies
            </h2>
            <Link to="/companies" className="text-primary-brand fw-semibold" style={{ fontSize: "0.85rem" }}>
              View all
            </Link>
          </div>
          <div className="d-flex flex-column gap-2 px-2">
            {nearest.slice(0, 4).map((c) => (
              <CompanyCard key={c.id} company={c} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
