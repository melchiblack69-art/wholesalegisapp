import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import Spinner from "../components/Spinner";
import { useSidebar } from "../context/SidebarContext";
import { useModal } from "../context/ModalContext";
import { api } from "../api/client";
import Avatar from "../components/Avatar";

const initialForm = {
  name: "",
  username: "",
  phone: "",
  email: "",
  role: "warehouse_user",
  password: "",
  company_id: "",
};
const roleLabels = {
  warehouse_manager: "Warehouse manager",
  warehouse_user: "Warehouse user",
  user: "Standard user",
  super_admin: "Super Administrator",
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "NU";

export default function UserProfile() {
  const { openSidebar } = useSidebar();
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const {showModal} = useModal();
  const [form, setForm] = useState(initialForm);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  useEffect(() => {
    Promise.all([
      api.get("/api/auth/companies"),
      editing ? api.get(`/api/auth/admins/${id}`) : Promise.resolve(null),
    ])
      .then(([companyRows, user]) => {
        setCompanies(Array.isArray(companyRows) ? companyRows : []);
        if (user)
          setForm({
            ...initialForm,
            ...user,
            company_id: user.company_id || "",
            password: "",
          });
      })
      .catch((e) => setError(e.message || "Could not load user profile."))
      .finally(() => setLoading(false));
  }, [editing, id]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) await api.put(`/api/auth/update/${id}`, form);
      else await api.post("/api/auth/admins", form);
      showModal("Account saved successful.", { type: "success", 
        title: "Success", autoClose: true,
         confirmText: false, autoCloseDelay:1000 });
         setTimeout(()=>{
           navigate("/users");
         }, 1200);
    } catch (e) {
       showModal(e.message || "Could not save account .", { type: "error", 
        title: "Error", autoClose: true,
       confirmText: false, autoCloseDelay:2000 });
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = useMemo(
    () => roleLabels[form.role] || form.role,
    [form.role],
  );
  if (loading) return <Spinner dotColor="#333" />;

  return (
    <>
      <Topbar
        title={editing ? "Edit user" : "Add user"}
        subtitle={
          editing
            ? "Update account details and access."
            : "Create a new account for your organization."
        }
        onMenuClick={openSidebar}
      />
      <main className="user-profile-page p-3 p-lg-4">
        <form onSubmit={submit}>
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
              <i className="bi bi-exclamation-circle" />
              {error}
            </div>
          )}
          <div className="row g-4">
            <div className="col-xl-4">
              <div className="card-surface user-profile-summary h-100">
                <div className="user-profile-avatar mx-auto d-flex align-items-center justify-content-center overflow-hidden">
                  <Avatar
                    name={form.name}
                    photo={form.photo ?? form.avatar ?? form.profile_photo ?? form.image ?? form.image_url ?? form.imageUrl}
                    size={96}
                    alt={`${form.name || "User"} profile photo`}
                    className="w-100 h-100"
                    imageStyle={{ borderRadius: "inherit" }}
                  />
                </div>
                <h4 className="fw-bold mt-3 mb-1">{form.name || "New user"}</h4>
                <p className="text-muted-brand mb-3">
                  {form.username ? `@${form.username}` : "Account preview"}
                </p>
                <span className="badge rounded-pill user-role-badge">
                  {roleLabel}
                </span>
                <div className="user-profile-summary-line mt-4">
                  <i className="bi bi-buildings" />
                  <span>
                    {companies.find(
                      (company) =>
                        String(company.id) === String(form.company_id),
                    )?.company_name || "No company assigned"}
                  </span>
                </div>
                <div className="user-profile-tip mt-4">
                  <i className="bi bi-info-circle me-2" />
                  Role permissions determine what this user can access.
                </div>
              </div>
            </div>
            <div className="col-xl-8">
              <div className="card-surface p-4 p-lg-5">
                <div className="profile-section-heading">
                  <span>
                    <i className="bi bi-person-vcard" />
                  </span>
                  <div>
                    <h5>Account details</h5>
                    <p>
                      Use the user’s real contact details for reliable account
                      recovery.
                    </p>
                  </div>
                </div>
                <div className="row g-3">
                  {[
                    ["name", "Full name", "text", "e.g. Ama Owusu"],
                    ["username", "Username", "text", "e.g. ama.owusu"],
                    ["email", "Email address", "email", "amaowusu@gmail.com"],
                    ["phone", "Phone number", "tel", "e.g. +233 20 000 0000"],
                  ].map(([key, label, type, placeholder]) => (
                    <div className="col-md-6" key={key}>
                      <label className="form-label">{label} <i className="bi bi-asterisk text-danger" style={{fontSize: "0.55rem" }}></i></label>
                      <input
                        required
                        type={type}
                        className="form-control"
                        value={form[key]}
                        onChange={update(key)}
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                  <div className="col-md-6">
                    <label className="form-label">Access role <i className="bi bi-asterisk  text-danger" 
                    style={{fontSize: "0.55rem"}}></i>
                    </label>
                    <select
                      className="form-select"
                      value={form.role}
                      onChange={update("role")}
                    >
                      <option value="warehouse_manager">
                        Warehouse manager
                      </option>
                      <option value="warehouse_user">Warehouse user</option>
                      <option value="user">Standard user</option>
                      <option value="super_admin">Super Administrator</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Company assignment</label>
                    <select
                      className="form-select"
                      value={form.company_id}
                      onChange={update("company_id")}
                    >
                      <option value="">No company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.company_name || company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!editing && (
                    <div className="col-12">
                      <label className="form-label">Temporary password</label>
                      <input
                        required
                        type="password"
                        minLength="6"
                        className="form-control"
                        value={form.password}
                        onChange={update("password")}
                        placeholder="At least 6 characters"
                      />
                      <small className="text-muted-brand">
                        The user should change this after their first sign-in.
                      </small>
                    </div>
                  )}
                </div>
                <div className="profile-form-footer">
                  <button
                    type="button"
                    className="btn btn-light px-4"
                    onClick={() => navigate("/users")}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-brand px-4" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2 me-2" />
                        {editing ? "Save changes" : "Create user"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
