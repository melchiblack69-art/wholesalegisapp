import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import TableToolbar from "../components/TableToolbar";
import { useSidebar } from "../context/SidebarContext";
import { api } from "../api/client";
import { publicId } from "../utils/publicId";
import {useModal} from "../context/ModalContext";

const PAGE_SIZE = 8;

export default function Companies() {
  const { openSidebar } = useSidebar();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [localCompanies, setLocalCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const {showModal} = useModal();

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const rows = await api.get("/api/auth/companies");
        const normalized = Array.isArray(rows)
          ? rows.map((company) => {
              return {
                id: company.id,
                public_id: company.public_id,
                name: company.company_name || company.name,
                category: String(company.category_id || company.cat_id || ""),
                category_name: company.category_name || "Uncategorized",
                category_color: company.category_color || company.color || "#1c6b41",
                phone: company.phone || "",
                lat: Number(company.latitude || 0),
                lng: Number(company.longitude || 0),
                address: company.address || "",
                status: company.status || "Active",
                addedOn: company.created_at || company.addedOn,
                description: company.description || "",
                email: company.email || "",
                total_products: company.total_products || ""
              };
            })
          : [];
        const categoryMap = new Map();
        (Array.isArray(rows) ? rows : []).forEach((company) => {
          const id = company.category_id || company.cat_id;
          const name = company.category_name;
          if (id && name && !categoryMap.has(String(id))) categoryMap.set(String(id), { id, category_name: name, color: company.category_color || company.color });
        });
        setCategories(Array.from(categoryMap.values()));
        setLocalCompanies(normalized);
      } catch (error) {
       showModal(error.message || "Could not fetch data.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const filtered = useMemo(() => {
    return localCompanies.filter((c) => {
      const matchesQ = q ? c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q) : true;
      const matchesCat = category === "all" ? true : c.category === category;
      const matchesStatus = status === "all" ? true : c.status === status;
      return matchesQ && matchesCat && matchesStatus;
    });
  }, [localCompanies, q, category, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

 const handleDelete = async (id) => {
  try {
    await api.del(`/api/company/del-company/${id}`);

    setLocalCompanies((prev) => prev.filter((c) => String(publicId(c)) !== String(id)));

    if (page > 1 && pageRows.length === 1) {
      setPage((current) => current - 1);
    }


    // Close the confirmation dialog
    setConfirmDeleteId(null);
showModal(
       "Company deleted.",
      {
        type: "success",
        title: "Success",
        autoClose: true,
        autoCloseDelay: 2000,
        confirmText: false,
      }
    );
  } catch (e) {
    showModal(
      e.message || "Could not delete this data.",
      {
        type: "error",
        title: "Error",
        autoClose: true,
        autoCloseDelay: 2000,
        confirmText: false,
      }
    );
  }
};

  return (
    <>
      <Topbar
        title="Companies"
        subtitle="Manage all wholesale companies in the system."
        onMenuClick={openSidebar}
      />

      <div className="p-3 p-lg-4">
        <div className="card-surface p-0">
          <TableToolbar
            search={q}
            onSearchChange={(v) => { setQ(v); setPage(1); }}
            searchPlaceholder="Search company name, phone or category..."
            addLabel="Add Company"
            onAdd={() => navigate("/companies/new")}
            filters={
              <>
                <select className="form-select" style={{ width: 160 }} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.category_name || c.name}</option>
                  ))}
                </select>
                <select className="form-select" style={{ width: 140 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {(q || category !== "all" || status !== "all") && (
                  <button className="btn btn-brand-outline rounded-3" onClick={() => { setQ(""); setCategory("all"); setStatus("all"); }}>
                    <i className="bi bi-x-lg me-1" /> Reset
                  </button>
                )}
              </>
            }
          />
          <div className="table-responsive">
            <table className="table admin-table mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Company Name</th>
                  <th>Category</th>
                  <th>Phone</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted-brand py-4">Loading companies...</td>
                  </tr>
                ) : pageRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted-brand py-4">No companies match your filters.</td>
                  </tr>
                )}
                {pageRows.map((c, i) => {
                  const cat = categories.find((cc) => String(cc.id) === String(c.category));
                  return (
                    <tr key={publicId(c)}>
                      <td className="text-muted-brand">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="fw-medium">{c.name}</td>
                      <td style={{ color: c.category_color || cat?.color }}>{c.category_name || cat?.category_name || cat?.name || "Uncategorized"}</td>
                      <td className="text-muted-brand">{c.phone}</td>
                      <td className="text-muted-brand">{c.total_products}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <button className="btn btn-sm border-0 p-1" title="Edit" onClick={() => navigate(`/company/${publicId(c)}/edit`)}>
                            <i className="bi bi-pencil-square text-primary-brand" />
                          </button>
                          <Link className="btn btn-sm border-0 p-1" to={`/companies/${publicId(c)}`} title="View">
                            <i className="bi bi-eye text-muted-brand" />
                          </Link>
                          <button className="btn btn-sm border-0 p-1" title="Delete" onClick={() => setConfirmDeleteId(publicId(c))}>
                            <i className="bi bi-trash" style={{ color: "var(--color-danger)" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between p-3 flex-wrap gap-2">
            <span className="text-muted-brand" style={{ fontSize: "0.85rem" }}>
              {loading ? "Loading companies..." : filtered.length
                ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length} entries`
                : "No companies to show"}
            </span>
            <Pagination page={currentPage} totalPages={totalPages} onChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))} />
          </div>
        </div>
      </div>

      {confirmDeleteId !== null && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: "rgba(14,46,28,0.4)", zIndex: 2000 }}>
          <div className="card-surface p-4" style={{ maxWidth: 380 }}>
            <p className="fw-semibold mb-2">Delete this company?</p>
            <p className="text-muted-brand mb-3" style={{ fontSize: "0.88rem" }}>
              This action cannot be undone. The company will be permanently removed from the system.
            </p>
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-brand-outline rounded-3" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="btn rounded-3 text-white" style={{ background: "var(--color-danger)" }} onClick={() => handleDelete(confirmDeleteId)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
