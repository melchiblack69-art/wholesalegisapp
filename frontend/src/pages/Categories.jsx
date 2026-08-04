import { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import StatusBadge from "../components/StatusBadge";
import TableToolbar from "../components/TableToolbar";
import { useSidebar } from "../context/SidebarContext";
import { api } from "../api/client";
import { useModal } from "../context/ModalContext";
//import { iconOptions } from "../data/icons";
const iconOptions = ["bi-house-door-fill", "bi-lightning-charge-fill",
   "bi-bag-fill", "bi-gear-fill",
    "bi-box-seam-fill", "bi-grid-fill", 
    "bi-cup-hot-fill", "bi-truck"]; 

function normalizeCategory(item) {
  return {
    id: item.id,
    name: item.category_name || item.name || "",
    icon: item.icon || iconOptions[0],
    slug: (item.category_name || item.name || "").toLowerCase().replace(/\s+/g, "-"),
    color: item.color || "#1c6b41",
    bg: item.bg || "#e8f5ec",
    companies: item.company_count || 0,
    status: item.status || "Active",
  };
}

export default function Categories() {
  const { openSidebar } = useSidebar();
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", icon: iconOptions[0], color: "#1c6b41" });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [q, setQ] = useState("");
  const {showModal} = useModal();
  const [loading, setLoading] = useState(true);
  const filtered = categories.filter(
    (c) => !q || c.name.toLowerCase().includes(q.toLowerCase()),
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const rows = await api.get("/api/company/categories");
        setCategories(Array.isArray(rows) ? rows.map(normalizeCategory) : []);
      } catch (error) {
         showModal(error.message || "Could not load categories.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", icon: iconOptions[0], color: "#1c6b41" });
    setModalOpen(true);
  };
  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon, color: cat.color });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        const updated = await api.put(`/api/company/categories/${editing.id}`, {
          category_name: form.name,
          category_icon: form.icon,
          category_color: form.color,
        });
        const payload = updated?.category || { id: editing.id, category_name: form.name, icon: form.icon, color: form.color };
        setCategories((prev) => prev.map((c) => (c.id === editing.id ? normalizeCategory(payload) : c)));
      } else {
        const created = await api.post("/api/company/categories", {
          category_name: form.name,
          category_icon: form.icon,
          category_color: form.color,
        });
        const payload = created?.category || { id: created?.id, category_name: form.name, icon: form.icon, color: form.color };
        setCategories((prev) => [normalizeCategory(payload), ...prev]);
      }
      setModalOpen(false);
    } catch (error) {
       showModal(error.message || "Could not save category.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    }
  };

  const remove = async (id) => {
    try {
      await api.del(`/api/company/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
    } catch (error) {
       showModal(error.message || "Could not delete  category.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    }
  };

  return (
    <>
      <Topbar
        title="Categories"
        subtitle="Manage product/service categories."
        onMenuClick={openSidebar}
      />

      <div className="p-3 p-lg-4">
        <div className="card-surface p-0">
          <TableToolbar
            search={q}
            onSearchChange={setQ}
            searchPlaceholder="Search categories..."
            addLabel="Add Category"
            onAdd={openAdd}
          />
          <div className="table-responsive">
            <table className="table admin-table mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Category Name</th>
                  <th>Icon</th>
                  <th>Companies</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-brand py-4">Loading categories...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-brand py-4">No categories yet.</td>
                  </tr>
                ) : filtered.map((c, i) => (
                  <tr key={c.id}>
                    <td className="text-muted-brand">{i + 1}</td>
                    <td className="fw-medium">{c.name}</td>
                    <td>
                      <span
                        className="icon-circle"
                        style={{
                          width: 34,
                          height: 34,
                          background: c.bg,
                          color: c.color,
                        }}
                      >
                        <i className={`bi ${c.icon}`} />
                      </span>
                    </td>
                    <td className="text-muted-brand">{c.companies}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="btn btn-sm border-0 p-1"
                          onClick={() => openEdit(c)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil text-primary-brand" />
                        </button>
                        <button
                          className="btn btn-sm border-0 p-1"
                          onClick={() => setConfirmDeleteId(c.id)}
                          title="Delete"
                        >
                          <i
                            className="bi bi-trash"
                            style={{ color: "var(--color-danger)" }}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 text-muted-brand" style={{ fontSize: "0.85rem" }}>
            Showing {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: "rgba(14,46,28,0.4)", zIndex: 2000 }}
        >
          <form
            onSubmit={save}
            className="card-surface p-4 w-100"
            style={{ maxWidth: 420 }}
          >
            <p className="fw-semibold mb-3">
              {editing ? "Edit Category" : "Add Category"}
            </p>
            <div className="mb-3">
              <label className="form-label">Category Name *</label>
              <input
                required
                className="form-control"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Textiles"
              />
            </div>
            <div className="mb-4">
              <label className="form-label">Category color</label>
              <input type="color" className="form-control form-control-color d-block mb-3" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} title="Choose category color" />
              <label className="form-label">Icon</label>
              <div className="d-flex flex-wrap gap-2">
                {iconOptions.map((icon) => (
                  <button
                    type="button"
                    key={icon}
                    onClick={() => setForm((f) => ({ ...f, icon }))}
                    className="icon-circle border-0"
                    style={{
                      width: 44,
                      height: 44,
                        background: form.icon === icon ? form.color : "#fff",
                        color: form.icon === icon ? "#fff" : form.color,
                      border:
                        form.icon === icon
                          ? "2px solid var(--color-primary)"
                          : "1px solid #dee2e6",
                      transform:
                        form.icon === icon ? "scale(1.08)" : "scale(1)",
                      transition: "all .2s ease",
                    }}
                  >
                    <i className={`bi ${icon}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-brand-outline rounded-3 px-3"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-brand rounded-3 px-3">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: "rgba(14,46,28,0.4)", zIndex: 2000 }}
        >
          <div className="card-surface p-4 w-100" style={{ maxWidth: 380 }}>
            <p className="fw-semibold mb-2">Delete this category?</p>
            <p
              className="text-muted-brand mb-3"
              style={{ fontSize: "0.88rem" }}
            >
              Companies in this category will need to be reassigned.
            </p>
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-brand-outline rounded-3"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="btn rounded-3 text-white"
                style={{ background: "var(--color-danger)" }}
                onClick={() => remove(confirmDeleteId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
