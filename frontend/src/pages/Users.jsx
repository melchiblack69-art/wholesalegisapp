import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import TableToolbar from "../components/TableToolbar";
import Avatar from "../components/Avatar";
import { useSidebar } from "../context/SidebarContext";
import { useModal } from "../context/ModalContext";
import { api } from "../api/client";
import { publicId } from "../utils/publicId";

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

//format the role
function formatRole(role){

const roleLabels = {
  warehouse_manager: "Warehouse manager",
  warehouse_user: "Warehouse user",
  user: "Standard user",
  super_admin: "Super Administrator",
};
return roleLabels[role] || role;
};

const getInitials = (name = "") => name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

export default function Users() {
  const { openSidebar } = useSidebar();
  const {showModal } = useModal();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const deleteUser = async () => {
    if (!confirmDelete) return;
    try {
      await api.del(`/api/auth/admins/${publicId(confirmDelete)}`);
      setUsers((current) => current.filter((item) => String(publicId(item)) !== String(publicId(confirmDelete))));
       showModal("Account deleted successfully.", { type: "success", 
        title: "Success", autoClose: true,
         confirmText: false, autoCloseDelay: 2000 });
      setConfirmDelete(null);
    } catch (error) { showModal(error.message || "Could not delete account.", { type: "error", 
        title: "Error", autoClose: true,
         confirmText: false, autoCloseDelay: 2000 }); }
  };

  useEffect(() => {
    api.get("/api/auth/admins")
      .then((admins) => setUsers(Array.isArray(admins) ? admins : []))
      .catch((error) => setMessage(error.message));
  }, []);

  const filtered = useMemo(() => users.filter((user) => {
    const query = q.toLowerCase();
    return !query || user.name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query);
  }), [users, q]);


  return <>
    <Topbar title="Users" subtitle="Manage admin, staff, and warehouse accounts." onMenuClick={openSidebar} />
    <div className="p-3 p-lg-4"><div className="card-surface p-0">
      <TableToolbar search={q} onSearchChange={setQ} searchPlaceholder="Search name or email..." addLabel="Add User" onAdd={() => navigate("/users/new")} />
      {message && <p className="mt-3 mb-0 text-danger">{message}</p>}
      <div className="table-responsive"><table className="table admin-table mb-0"><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Last Login</th><th>Added On</th><th>Actions</th></tr></thead>
        <tbody>{filtered.map((user) => <tr key={publicId(user)}>
          <td className="text-muted-brand">{filtered.indexOf(user) + 1}</td>
          <td className="d-flex align-items-center gap-2 fw-medium"><Avatar name={user.name} photo={user.photo ?? user.avatar ?? user.profile_photo ?? user.image ?? user.image_url ?? user.imageUrl} size={30} />{user.name}</td>
          <td className="text-muted-brand">{user.email}</td><td className="text-muted-brand">{formatRole(user.role)}</td>
          <td className="text-muted-brand">{user.last_login ? dateHelper(user.last_login) : "Never"}</td>
          <td className="text-muted-brand">{user.created_at ? dateHelper2(user.created_at) : "—"}</td>
          <td><div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm border-0 p-1" title="Edit" onClick={() => navigate(`/users/${publicId(user)}/edit`)}><i className="bi bi-pencil-square text-primary-brand" /></button>
            <button className="btn btn-sm border-0 p-1" title="Delete" onClick={() => setConfirmDelete(user)}><i className="bi bi-trash3" style={{ color: "var(--color-danger)" }}/></button>
            </div></td>
        </tr>)}</tbody>
      </table></div>
      <div className="p-3 text-muted-brand" style={{ fontSize: "0.85rem" }}>Showing 1 to {filtered.length} of {filtered.length} entries</div>
    </div></div>
    {confirmDelete && <div className="global-modal-backdrop" onClick={() => setConfirmDelete(null)}><div className="global-modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true"><div className="global-modal-icon text-danger bg-danger-subtle"><i className="bi bi-trash3-fill" /></div><h5 className="fw-semibold mb-2">Delete user?</h5><p className="global-modal-message mb-0">This will permanently remove <strong>{confirmDelete.name}</strong> and cannot be undone.</p><div className="d-flex justify-content-center gap-2 mt-3"><button type="button" className="btn btn-light" onClick={() => setConfirmDelete(null)}>Cancel</button><button type="button" className="btn btn-danger" onClick={deleteUser}>Delete</button></div></div></div>}
  </>;
}
