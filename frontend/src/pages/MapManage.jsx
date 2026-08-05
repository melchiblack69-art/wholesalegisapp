import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import AdminMap from "../components/AdminMap";
import { useSidebar } from "../context/SidebarContext";
import { api } from "../api/client";
import { useModal } from "../context/ModalContext";

export default function MapManage() {
  const { openSidebar } = useSidebar();
  const [activeCats, setActiveCats] = useState([]);
  const [categoryRows, setCategoryRows] = useState([]);
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { openModal } = useModal();

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const rows = await api.get("/api/map/companies");
        const normalized = Array.isArray(rows)
          ? rows.map((company) => {
              const categoryId = String(company.category_id || company.cat_id || company.category_name || "uncategorized");
              return {
                id: company.id,
                name: company.name || company.company_name,
                category: categoryId,
                category_name: company.category_name,
                category_color: company.color  || "var(--color-primary)",
                lat: Number(company.latitude || 0),
                lng: Number(company.longitude || 0),
                status: company.status || "Active",
              };
            })
          : [];
        setCompanies(normalized);
        const unique = Array.from(new Map(normalized.map((c) => [c.category, 
          { id: c.category, name: c.category_name || "Uncategorized" ,category_color: c.category_color || "var(--color-primary)", }])).values());
        setCategoryRows(unique);
        setActiveCats(unique.map((c) => c.id));
      } catch (error) {
      showModal(error.message || "Could not load map companies.", 
          { type: "error", title: "Error", autoClose: true, autoCloseDelay: 2000, confirmText: false });
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const filtered = useMemo(
    () => companies.filter((c) => activeCats.includes(c.category) && (!query || (c.name || "").toLowerCase().includes(query.toLowerCase()))),
    [activeCats, companies, query]
  );

  const toggleCat = (slug) =>
    setActiveCats((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const allChecked = activeCats.length === categoryRows.length;
  const toggleAll = () => setActiveCats(allChecked ? [] : categoryRows.map((c) => c.id));

  return (
    <>
      <Topbar title="Manage Company Locations" subtitle="View and manage all company locations on the map." onMenuClick={openSidebar} />

      <div className="p-3 p-lg-4">
        <div className="row g-3">
          <div className="col-lg-3">
            <div className="card-surface p-3">
              <div className="d-flex align-items-center border rounded-3 px-3 py-2 mb-3">
                <i className="bi bi-search text-muted-brand me-2" />
                <input
                  className="border-0 flex-fill"
                  style={{ outline: "none", fontSize: "0.88rem" }}
                  placeholder="Search location..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <p className="fw-semibold mb-2" style={{ fontSize: "0.9rem" }}>Map Layers</p>
              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="all-layers" checked={allChecked} onChange={toggleAll} />
                <label className="form-check-label" htmlFor="all-layers">All Companies</label>
              </div>
              {categoryRows.map((c) => (
                <div className="form-check mb-2" key={c.id}>
                  <input className="form-check-input" type="checkbox" id={`layer-${c.id}`} checked={activeCats.includes(c.id)} onChange={() => toggleCat(c.id)} />
                  <label className="form-check-label" htmlFor={`layer-${c.id}`}>{c.name}</label>
                </div>
              ))}

              <p className="fw-semibold mt-4 mb-2" style={{ fontSize: "0.9rem" }}>Legend</p>
              {categoryRows.map((c, index) => (
                <div className="d-flex align-items-center gap-2 mb-2" key={c.id}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: c.category_color, display: "inline-block" }} />
                  <span style={{ fontSize: "0.85rem" }}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-9">
            {message && <div className="alert-brand-danger mb-3" style={{ fontSize: "0.82rem" }}>{message}</div>}
            {loading ? <div className="text-muted-brand">Loading map locations...</div> : <AdminMap companies={filtered} height={640} zoom={13} />}
          </div>
        </div>
      </div>
    </>
  );
}
