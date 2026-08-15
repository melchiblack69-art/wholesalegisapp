import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import TableToolbar from "../components/TableToolbar";
import Avatar from "../components/Avatar";
import { useSidebar } from "../context/SidebarContext";
import { api } from "../api/client";
import { publicId } from "../utils/publicId";
import { useModal } from "../context/ModalContext";
import { useAuth } from "../context/AuthContext";

function dateHelper(value) {
  if (!value) return "";

  // MySQL returns timestamps as `YYYY-MM-DD HH:mm:ss`, which is not
  // consistently parsed by all browsers. Convert it to an ISO-like value
  // before creating the Date object.
  const normalized = typeof value === "string"
    ? value.trim().replace(/^([0-9]{4}-[0-9]{2}-[0-9]{2})\s+/, "$1T")
    : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric"
  });
}
function dateHelper2(value) {
  if (!value) return "";

  // MySQL returns timestamps as `YYYY-MM-DD HH:mm:ss`, which is not
  // consistently parsed by all browsers. Convert it to an ISO-like value
  // before creating the Date object.
  const normalized = typeof value === "string"
    ? value.trim().replace(/^([0-9]{4}-[0-9]{2}-[0-9]{2})\s+/, "$1T")
    : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function formatRole(role) {
  const roleLabels = {
   warehouse_manager: "Warehouse manager",
  warehouse_user: "Warehouse user",
  user: "Standard user",
  super_admin: "Super Administrator",
  };
  return roleLabels[role] || role;
}

export default function CompanyUsers() {
  const { openSidebar } = useSidebar();
  const navigate = useNavigate();
  const { id: companyId } = useParams();
  const { user } = useAuth();
  const effectiveCompanyId = user?.companyPublicId || companyId;
  const [users, setUsers] = useState([]); // Replace with actual data fetching logic
  const [q, setQ] = useState("");
  const {showModal} = useModal();
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const deleteUser = async () => {
    if (!confirmDelete) return;
    try {
      await api.del(`/api/auth/admins/${publicId(confirmDelete)}`);
      setUsers((current) => current.filter((item) => String(publicId(item)) !== String(publicId(confirmDelete))));
      showModal("User deleted successfully.", { type: "success", title: "User deleted", autoClose: true, confirmText: false });
    } catch (error) {
      showModal(error.message || "Could not delete user.", { type: "error", title: "Delete failed", autoClose: true, confirmText: false });
    } finally { setConfirmDelete(null); }
  };

  const fetchAdmins = async () => {
    try {
     const admins = await api.get(`/api/auth/company-admins/${effectiveCompanyId}`);
      setUsers(Array.isArray(admins) ? admins : []);
    } catch (error) {
       setMessage(error.message || "Could not load users.");
    }
  };

  useEffect(() => {
    fetchAdmins();
    if (user?.companyPublicId && String(companyId) !== String(user.companyPublicId)) {
      navigate(`/company/${user.companyPublicId}/users`, { replace: true });
    }
  }, [effectiveCompanyId, user?.companyPublicId]);

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          !q ||
          u.name?.toLowerCase().includes(q.toLowerCase()) ||
          u.email?.toLowerCase().includes(q.toLowerCase()),
      ),
    [users, q],
  );

  return (
    <>
      <Topbar
        title="Users"
        subtitle="Manage user accounts."
        onMenuClick={openSidebar}
      />

      <div className="p-3 p-lg-4">
        <div className="card-surface p-0">
          <TableToolbar
            search={q}
            onSearchChange={setQ}
            searchPlaceholder="Search name or email..."
            addLabel="Add User"
            onAdd={() => navigate(`/company/${effectiveCompanyId}/users/new`)}
          />
          {message && <p
            className={`mt-3 mb-0 ${
              message.toLowerCase().includes("success")
                ? "text-success"
                : "text-danger"
            }`}
          >
            {message}
          </p>}
          <div className="table-responsive">
            <table className="table admin-table mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th>Added On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={publicId(u)}>
                    <td className="text-muted-brand">{i + 1}</td>
                    <td className="d-flex align-items-center gap-2 fw-medium">
                      <Avatar name={u.name} photo={u.photo ?? u.avatar ?? u.profile_photo ?? u.image ?? u.image_url ?? u.imageUrl} size={30} />
                      {u.name}
                    </td>
                    <td className="text-muted-brand">{u.email}</td>
                    <td className="text-muted-brand">{formatRole(u.role)}</td>
                    <td className="text-muted-brand">{ u.last_login? dateHelper(u.last_login) : "Never"}</td>

                    <td className="text-muted-brand">
                      {u.created_at ? dateHelper2(u.created_at) : "—"}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="btn btn-sm border-0 p-1"
                          title="Edit"
                          onClick={() => navigate(`/company/${effectiveCompanyId}/users/${publicId(u)}/edit`)}
                        >
                          <i className="bi bi-pencil-square text-primary-brand" />
                        </button>
                        <button
                          className="btn btn-sm border-0 p-1"
                          title="Delete"
                          onClick={() => setConfirmDelete(u)}
                        >
                          <i
                            className="bi bi-trash3"
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
            Showing 1 to {filtered.length} of {filtered.length} entries
          </div>
        </div>
      </div>
      {confirmDelete && <div className="global-modal-backdrop" onClick={() => setConfirmDelete(null)}><div className="global-modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true"><div className="global-modal-icon text-danger bg-danger-subtle"><i className="bi bi-trash3-fill" /></div><h5 className="fw-semibold mb-2">Delete user?</h5><p className="global-modal-message mb-0">This will permanently remove <strong>{confirmDelete.name}</strong> and cannot be undone.</p><div className="d-flex justify-content-center gap-2 mt-3"><button type="button" className="btn btn-light" onClick={() => setConfirmDelete(null)}>Cancel</button><button type="button" className="btn btn-danger" onClick={deleteUser}>Delete</button></div></div></div>}
    </>
  );
}
