import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useModal } from "../context/ModalContext";
import { useSystemSettings } from "../context/SystemSettingsContext";
const tabs = ["Profile", "Change Password"];
// Renders a date string as "July 31, 2026". Falls back to "—" if the
// value is missing or isn't a parseable date.
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};
const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() || "")
    .join("");

function InitialAvatar({ name, size = 100 }) {
  const initials = getInitials(name);

  const colors = [
    "#0d6efd",
    "#198754",
    "#dc3545",
    "#0dcaf0",
    "#6f42c1",
    "#fd7e14",
  ];

  const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 900,
        fontSize: size * 0.36,
        fontFamily: "'Barlow Condensed', sans-serif",
        boxShadow: `0 6px 24px ${color}55`,
      }}
    >
      {initials || "?"}
    </div>
  );
}

function EditableProfileField({ field, label, value, editingField, onChange, setEditingField }) {
  const isEditing = editingField === field;

  return (
    <div className="col-sm-6">
      <label className="form-label" htmlFor={field}>{label}</label>
      <div className="input-group">
        <input
          id={field}
          className="form-control"
          value={value}
          disabled={!isEditing}
          onChange={(event) => onChange(field, event.target.value)}
        />
        <button
          type="button"
          className="btn btn-brand-outline"
          onClick={() => setEditingField(isEditing ? null : field)}
          aria-label={isEditing ? `Lock ${label}` : `Edit ${label}`}
          title={isEditing ? "Lock field" : "Edit field"}
        >
          <i className={`bi ${isEditing ? "bi-lock-fill" : "bi-pencil-fill"}`} style={{ fontSize: "0.75rem" }} />
        </button>
      </div>
    </div>
  );
}

export default function CompanySettings() {
  const { openSidebar } = useSidebar();
  const { user, updateCurrentUser } = useAuth();
  const photoInputRef = useRef(null);
  const {showModal} = useModal();
  const [tab, setTab] = useState("Profile");
  const [editingField, setEditingField] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [profile, setProfile] = useState({ name: "", username: "", email: "", phone: "" });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const [dbSize, setDbSize] = useState([]);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const[saving, setSaving] = useState(false);
  const [system, setSystem] = useState(); 
  const [showPwd, setShowPwd] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const systemCtx = useSystemSettings();
  

const handle = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));
  const handlePwd = (f) => (e) =>
    setPwd((p) => ({ ...p, [f]: e.target.value }));
  const toggleShow = (f) => () => setShowPwd((p) => ({ ...p, [f]: !p[f] }));
  
  
  //── Change password ─────────────────────────────────────────────────────
  const changePassword = async () => {
  
    if (!pwd.current) {
       showModal("Enter your current password.", { type: "warning", title: "Warning", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
      return;
    }
    if (pwd.next.length < 6) {
       showModal("New password must be at least 6 characters.", { type: "warning", title: "Warning", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
      return;
    }
    if (pwd.next !== pwd.confirm) {
       showModal("New passwords do not match.", { type: "warning", title: "Warning", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
      return;
    }
    try {
      setSaving(true);

      await api.put(`/api/auth/change-password/${user.id}`, {
        currentPassword: pwd.current,
        newPassword: pwd.next,
      });

      setSaving(false);
      setPwd({ current: "", next: "", confirm: "" });
       showModal("Password changed successfully.", { type: "success", title: "Success", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    } catch (e) {
       showModal(e.message ?? "Failed to change password.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    } finally {
      setSaving(false);
    }
  };


  useEffect(() => {
    if (!user?.id) return;

    api
      .get("/api/auth/company-admins")
      .then((admins) => {
        const currentAdmin = Array.isArray(admins)
          ? admins.find((admin) => String(admin.id) === String(user.id))
          : null;
        if (currentAdmin) setProfileUser(currentAdmin);
        else showModal("Your profile could not be found.", { type: "warning", title: "Warning", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });;
      })
      .catch((error) => showModal(error.message || "Something went wrong.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false }));
  }, [user?.id]);

  useEffect(() => {
    setProfile({
      name: profileUser?.name ?? "",
      username: profileUser?.username ?? "",
      email: profileUser?.email ?? "",
      phone: profileUser?.phone ?? "",
    });
  }, [profileUser]);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const updateProfileField = (field, value) => {
    setProfile((currentProfile) => ({ ...currentProfile, [field]: value }));
  };

  const handlePhotoSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));

  };

  const clearSelectedPhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("username", profile.username);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);
      if (selectedPhoto) formData.append("photo", selectedPhoto);

      const data = await api.put(`/api/auth/update/${user.id}`, formData, { isForm: true });
      updateCurrentUser(data.admin);
      setProfileUser(data.admin);
      clearSelectedPhoto();
      setEditingField(null);
       showModal("Profile updated successfully.", { type: "success", title: "Success", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    } catch (error) {
       showModal("Something went wrong.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExistingPhoto = async () => {
    if (!user?.id || !user.photo) return;

    setIsRemovingPhoto(true);
    try {
      const data = await api.del(`/api/auth/admins/${user.id}/photo`);
      updateCurrentUser(data.admin);
      setProfileUser(data.admin);
       showModal("Profile photo removed.", { type: "success", title: "Success", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    } catch (error) {
       showModal("Something went wrong.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    } finally {
      setIsRemovingPhoto(false);
    }
  };

const getDbSize = async() =>{
try{
const size = await api.get("/api/system/database-size");
setDbSize(size.size_mb);
}catch(e){
console.error(e)
}
};

    useEffect(() => {
       getDbSize ();
     if (!systemCtx?.loaded) return;
     setSystem({
       id: systemCtx.id,
       system_name: systemCtx.system_name,
       other_name: systemCtx.other_name,
       system_logo: systemCtx.system_logo,
       system_email: systemCtx.system_email,
       maintenance_mode: systemCtx.maintenance_mode,
       description: systemCtx.description,
       updated_at: systemCtx.updated_at,
     });
     
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [systemCtx?.loaded,systemCtx?.updated_at]);
  
  const displayedPhoto = photoPreview || profileUser?.photo;

 const systemInfoRows = [
  ["System Name", systemCtx.system_name || "—"],
  ["Other Name", systemCtx.other_name || "—"],
  ["Support Email", systemCtx.system_email || "—"],
  ["Last Updated", formatDate(systemCtx.updated_at)],
  ["Database Size", `${dbSize} MB`],
  ["Maintenance Mode", systemCtx.maintenance_mode ? "On" : "Off"],
];

  return (
    <>
      <Topbar title="Profile Settings" subtitle="Manage your account settings." onMenuClick={openSidebar} />

      <div className="p-2 p-lg-4">
        <div className="d-flex gap-2 mb-3 flex-wrap">
          {tabs.map((currentTab) => (
            <button
              key={currentTab}
              onClick={() => setTab(currentTab)}
              className="btn btn-sm rounded-3 px-3"
              style={
                tab === currentTab
                  ? { background: "var(--color-primary)", color: "#fff", border: "1px solid var(--color-primary)" }
                  : { background: "#fff", border: "1px solid var(--color-border)", color: "var(--color-text)" }
              }
            >
              {currentTab}
            </button>
          ))}
        </div>

        {tab === "Profile" && (
          <div className="row g-3">
            <div className="col-6">
              <div className="card-surface p-4">
                <p className="fw-semibold mb-3">Profile Information</p>
                <div className="d-flex flex-column align-items-center mb-4">
                  <div className="position-relative mb-2" style={{ width: 100, height: 100 }}>
                    <span className="icon-circle bg-primary-brand text-white" style={{ width: "100%", height: "100%", fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {displayedPhoto ? (
                        <img src={displayedPhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : <InitialAvatar name={profile.name} size={100} />}
                    </span>
                    {selectedPhoto && (
                      <button type="button" className="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0" onClick={clearSelectedPhoto} aria-label="Remove selected photo preview" title="Remove selected preview">
                        <i className="bi bi-x-lg" />
                      </button>
                    )}
                    {!selectedPhoto && profileUser?.photo && (
                      <button type="button"  className="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0" onClick={handleDeleteExistingPhoto} disabled={isRemovingPhoto} aria-label="Remove profile photo" title="Remove profile photo">
                        <i className="bi bi-trash3-fill"  />
                      </button>
                    )}
                  </div>
                  <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="d-none" onChange={handlePhotoSelection} />
                  <button type="button" className="btn btn-sm btn-brand-outline rounded-circle" onClick={() => photoInputRef.current?.click()} aria-label="Choose profile photo" title="Choose profile photo">
                    <i className="bi bi-camera-fill" />
                  </button>
                </div>

                <div className="row g-3">
                  <div className="col-sm-6"><label className="form-label">ID</label><input className="form-control" value={profileUser?.id ?? ""} disabled /></div>
                  <EditableProfileField field="name" label="Full Name" value={profile.name} editingField={editingField} onChange={updateProfileField} setEditingField={setEditingField} />
                  <EditableProfileField field="username" label="Username" value={profile.username} editingField={editingField} onChange={updateProfileField} setEditingField={setEditingField} />
                  <EditableProfileField field="email" label="Email" value={profile.email} editingField={editingField} onChange={updateProfileField} setEditingField={setEditingField} />
                  <EditableProfileField field="phone" label="Phone" value={profile.phone} editingField={editingField} onChange={updateProfileField} setEditingField={setEditingField} />
                  <div className="col-sm-6"><label className="form-label">Role</label><input className="form-control" value={profileUser?.role ?? ""} disabled /></div>
                 
                </div>

                <button type="button" className="btn btn-brand rounded-3 mt-4 px-4" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </div>
             <div className="col-lg-6">
              <div className="card-surface p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  {systemCtx.system_logo && (
                    <img
                      src={systemCtx.system_logo}
                      alt=""
                      className="rounded border"
                      style={{ width: 36, height: 36, objectFit: "cover" }}
                    />
                  )}
                  <p className="fw-semibold mb-0">System Information</p>
                </div>
                {systemInfoRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="d-flex justify-content-between py-2 border-bottom"
                    style={{ fontSize: "0.88rem" }}
                  >
                    <span className="text-muted-brand">{label}</span>
                    <span className="fw-medium">{value}</span>
                  </div>
                ))}
                <p
                  className="text-muted-brand mt-2 mb-0"
                  style={{ fontSize: "0.78rem" }}
                >
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === "Change Password" && (
          <div className="card-surface p-4" style={{ maxWidth: 480 }}>
            <p className="fw-semibold mb-3">Change Password</p>

            <div className="d-flex flex-column gap-3">
              {[
                {
                  key: "current",
                  label: "Current Password",
                  placeholder: "Enter current password",
                },
                {
                  key: "next",
                  label: "New Password",
                  placeholder: "At least 6 characters",
                },
                {
                  key: "confirm",
                  label: "Confirm New Password",
                  placeholder: "Repeat new password",
                },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="form-label">{label}</label>

                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-lock-fill text-primary-brand"></i>
                    </span>

                    <input
                      className="form-control border-start-0 border-end-0"
                      type={showPwd[key] ? "text" : "password"}
                      value={pwd[key]}
                      onChange={handlePwd(key)}
                      placeholder={placeholder}
                    />

                    <button
                      type="button"
                      className="input-group-text bg-light"
                      onClick={toggleShow(key)}
                      style={{ cursor: "pointer" }}
                    >
                      <i
                        className={`bi ${
                          showPwd[key] ? "bi-eye-slash" : "bi-eye"
                        } text-muted`}
                      ></i>
                    </button>
                  </div>
                </div>
              ))}

              {pwd.next.length > 0 && (
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">Password strength</small>

                    <small
                      className="fw-semibold"
                      style={{
                        color:
                          pwd.next.length < 6
                            ? "#dc3545"
                            : pwd.next.length < 10
                              ? "#fd7e14"
                              : "#198754",
                      }}
                    >
                      {pwd.next.length < 6
                        ? "Weak"
                        : pwd.next.length < 10
                          ? "Fair"
                          : "Strong"}
                    </small>
                  </div>

                  <div className="progress" style={{ height: 5 }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: `${Math.min(100, (pwd.next.length / 12) * 100)}%`,
                        background:
                          pwd.next.length < 6
                            ? "#dc3545"
                            : pwd.next.length < 10
                              ? "#fd7e14"
                              : "#198754",
                        transition: "width .3s ease",
                      }}
                    />
                  </div>
                </div>
              )}


              <button
                className="btn btn-brand rounded-3 px-4"
                onClick={changePassword}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-lock me-2"></i>
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
