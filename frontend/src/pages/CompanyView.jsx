import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import StatusBadge from "../components/StatusBadge";
import AdminMap from "../components/AdminMap";
import { useSidebar } from "../context/SidebarContext";
import { api } from "../api/client";

function formatTimeToAmPm(value) {
  if (!value) return "--";

  const [hoursValue, minutesValue] = value.split(":");
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue) || 0;
  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${String(minutes).padStart(2, "0")}${suffix}`;
}

export default function CompanyView() {
  const { openSidebar } = useSidebar();
  const navigate = useNavigate();
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [images, setImages] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    Promise.all([
      api.get(`/api/auth/mycompany/${id}`),
      api.get(`/api/company/${id}/images`),
      api.get("/api/auth/companies"),
    ])
      .then(([companyData, imageResponse, categoryRows]) => {
        if (ignore) return;
        setCompany(companyData || null);
        const categoryId = companyData?.cat_id || companyData?.category_id;
        setCategory((Array.isArray(categoryRows) ? categoryRows : []).find((row) =>
          String(row.category_id || row.cat_id) === String(categoryId) ||
          row.category_name === companyData?.category_name
        ) || null);
        setImages(Array.isArray(imageResponse?.images) ? imageResponse.images : []);
        setActiveImage(0);
      })
      .catch((error) => {
        if (!ignore) setMessage(error.message || "Could not load company details.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <>
        <Topbar title="Loading company" onMenuClick={openSidebar} />
        <div className="p-4 text-center text-muted-brand">
          <i className="bi bi-arrow-repeat me-2" />Loading company details...
        </div>
      </>
    );
  }

  if (!company) {
    return (
      <>
        <Topbar title="Company Not Found" onMenuClick={openSidebar} />
        <div className="p-4 text-center">
          <p className="text-muted-brand">This company doesn't exist or was removed.</p>
          <Link to="/companies" className="text-primary-brand fw-semibold">Back to companies</Link>
        </div>
      </>
    );
  }

  const categoryName = category?.category_name || company.category_name || company.category || "Uncategorized";
  const categoryColor = category?.color || "var(--color-primary)";
  const categoryBg = category?.bg || "var(--color-bg)";

  return (
    <>
      <Topbar
        title={company.company_name || company.name}
        subtitle="Company details"
        onMenuClick={openSidebar}
        actions={
          <button className="btn btn-brand rounded-3 px-3" onClick={() => navigate(`/company/${company.id}/edit`)}>
            <i className="bi bi-pencil me-2" /> Edit
          </button>
        }
      />

      <div className="p-3 p-lg-4">
        <div className="row g-3">
          <div className="col-lg-7">
            <div className="card-surface p-0 overflow-hidden mb-3">
              {images.length > 0 ? (
                <>
                  <img src={images[activeImage]?.url || images[activeImage]?.previewUrl} alt={company.company_name || company.name} className="w-100" style={{ height: 260, objectFit: "cover" }} />
                  {images.length > 1 && (
                    <div className="d-flex gap-2 p-2" style={{ background: "var(--color-bg)", overflowX: "auto" }}>
                      {images.map((image, i) => (
                        <button key={image.id || `${image.url}-${i}`} type="button" className={`border-0 p-0 rounded-2 overflow-hidden ${i === activeImage ? "ring" : ""}`} style={{ width: 82, height: 58, flexShrink: 0 }} onClick={() => setActiveImage(i)}>
                          <img src={image.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center text-muted-brand" style={{ height: 180, background: "var(--color-bg)" }}>
                  <i className="bi bi-image mb-2" style={{ fontSize: "1.8rem" }} />
                  <span style={{ fontSize: "0.85rem" }}>No images uploaded yet</span>
                </div>
              )}
              <div className="p-3 p-lg-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <h2 className="fw-bold mb-0 font-display" style={{ fontSize: "1.3rem" }}>{company.company_name || company.name}</h2>
                  <StatusBadge status={company.status} />
                </div>
                <span className="fw-medium" style={{ color: categoryColor, fontSize: "0.88rem" }}>{categoryName}</span>

                <div className="d-flex flex-column gap-2 mt-3">
                  <div className="d-flex align-items-start gap-2 text-muted-brand">
                    <i className="bi bi-telephone" />
                    <span>{company.phone}</span>
                  </div>
                  <div className="d-flex align-items-start gap-2 text-muted-brand">
                    <i className="bi bi-envelope" />
                    <span>{company.email}</span>
                  </div>
                  <div className="d-flex align-items-start gap-2 text-muted-brand">
                    <i className="bi bi-geo-alt" />
                    <span>{company.address}</span>
                  </div>
                  <div className="d-flex align-items-start gap-2 text-muted-brand">
                    <i className="bi bi-clock" />
                    <div className="d-flex flex-wrap gap-2 ">
                      {Array.isArray(company.working_hours) && company.working_hours.some((row) => row.days || row.openTime || row.closeTime) ? (
                        company.working_hours.map((row, index) => {
                          const timeRange = [row.openTime, row.closeTime].filter(Boolean).map((value) => formatTimeToAmPm(value)).join("-");
                          const previewText = row.days ? `${row.days}${timeRange ? ` ${timeRange}` : ""}` : timeRange || "Untitled";

                          return (
                            <span
                              key={`preview-${index}`}
                            >
                              {previewText}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-muted-brand" style={{ fontSize: "0.85rem" }}>No working hours saved yet.</span>
                      )}
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-2 text-muted-brand">
                    <i className="bi bi-calendar3" />
                    <span>Added {company.created_at ? new Date(company.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}</span>
                  </div>
                </div>

                <p className="fw-semibold mt-4 mb-2">Description</p>
                <p className="text-muted-brand" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{company.description}</p>

                <p className="fw-semibold mb-2">Products / Services</p>
                <div className="d-flex flex-wrap gap-2">
                  {Array.isArray(company.products) && company.products.length > 0 ? (
                    company.products.map((p) => (
                      <span key={p.product_name || p.name || p} className="badge rounded-pill" style={{ background: categoryBg, color: categoryColor, fontWeight: 500 }}>{p.product_name || p.name || p}</span>
                    ))
                  ) : (
                    <span className="text-muted-brand">No products listed yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card-surface p-3">
              <p className="fw-semibold mb-2">Location</p>
              <AdminMap companies={[{ ...company, lat: company.latitude, lng: company.longitude, name: company.company_name || company.name, category: company.category || company.category_name, status: company.status }]} center={[Number(company.latitude), Number(company.longitude)]} zoom={15} height={280} />
              <p className="text-muted-brand mt-2 mb-0" style={{ fontSize: "0.82rem" }}>
                Lat {Number(company.latitude).toFixed(4)}, Lng {Number(company.longitude).toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
