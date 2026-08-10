import { useEffect, useRef, useState } from "react";
import MobileHeader from "../components/MobileHeader";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const publicId = (entity) => entity?.public_id || entity?.id;
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
  });
}
/**
 * Profile display + editor for the user-facing app.
 * - "Edit Profile" toggles inputs in place (Save / Cancel).
 * - Camera icon on the avatar opens a file picker; the image is previewed
 *   immediately ("auto upload") — wire onAvatarChange to your real upload call.
 * - Trash icon removes the current photo.
 * - "Change Password" is a separate tab with its own validation.
 *
 * All network/save logic is left to you via the callback props —
 * this component only manages its own UI state.
 */
export default function ProfileDisplay({
  user: providedUser = null,
  onSaveProfile = null,
  onAvatarChange = null,
  onDeletePhoto = null,
  onChangePassword = null,
  onLogout: providedLogout = null,
  onDeleteAccount = null,
}) {
  const { user: authUser, updateCurrentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { data: dbFavorites = [] } = useQuery({
    queryKey: ["user-favorites", authUser?.id],
    queryFn: () => api.get("/api/user/favorites"),
    enabled: Boolean(authUser?.id),
    staleTime: 60 * 1000,
  });
  const user = providedUser || authUser || {
    name: "Kwame Mensah",
    email: "kwame.mensah@example.com",
    phone: "055 123 4567",
    location: "Accra, Ghana",
    memberSince: "May 2025",
    avatarUrl: "",
    stats: { favorites: 12, searches: 34, reviews: 3 },
  };
  const onLogout = providedLogout || logout;
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!providedUser && !authUser) {
      navigate("/", { replace: true });
    }
  }, [authUser, providedUser, navigate]);

  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "password"

  // ---- Profile edit state ----
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
  });
  useEffect(() => {
    setForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
  }, [user.id, user.name, user.email, user.phone]);

  // ---- Avatar state ----
  const [avatarUrl, setAvatarUrl] = useState(user.photo || user.avatarUrl || "");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setAvatarUrl(user.photo || user.avatarUrl || "");
    setImgError(false);
  }, [user.photo, user.avatarUrl]);
  const [feedback, setFeedback] = useState({
    type: "",
    text: "",
  });
  // ---- Password tab state ----
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initials = (user.name || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ---------- Profile edit handlers ----------
  const startEdit = () => {
    setForm({ name: user.name, email: user.email, phone: user.phone });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setForm({ name: user.name, email: user.email, phone: user.phone });
    setEditMode(false);
  };

  useEffect(() => {
    if (!feedback.text && !pwError && !pwSuccess) return;
    
    const timer = setTimeout(() => {
      setFeedback({ type: "", text: "" });
      setPwError("");
      setPwSuccess("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [feedback, pwError, pwSuccess]);

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editMode) return;
    if(!/^\+?[0-9]{9,15}$/.test(form.phone)){
      return setFeedback({
        type: "error", 
        text: "Enter a valid phone number."});
    }
    setSaving(true);
    try {
      const result = onSaveProfile
        ? await onSaveProfile(form)
        : await api.put(`/api/user/update/${publicId(user)}`, form);
      if (result?.user) updateCurrentUser(result.user);
      setEditMode(false);
      return setFeedback({
        type: "success", 
        text: "Profile updated."});
    } finally {
      setSaving(false);
    }
  };

  // ---------- Avatar handlers ----------
  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgError(false);
    const localPreview = URL.createObjectURL(file); // instant preview
    setAvatarUrl(localPreview);
    setAvatarBusy(true);
    try {
      const data = new FormData();
      data.append("photo", file);
      const result = onAvatarChange
        ? await onAvatarChange(file)
        : await api.put(`/api/user/${publicId(user)}/photo`, data, { isForm: true });
      if (result?.user) { updateCurrentUser(result.user); setAvatarUrl(result.user.photo || localPreview); }
    } finally {
      setAvatarBusy(false);
      e.target.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    setAvatarBusy(true);
    try {
    const result = onDeletePhoto ? await onDeletePhoto() : await api.del(`/api/user/${publicId(user)}/photo`);
      if (result?.user) updateCurrentUser(result.user);
      setAvatarUrl("");
    } finally {
      setAvatarBusy(false);
    }
  };

  // ---------- Password handlers ----------
  const togglePwVisibility = (field) => setShowPw((s) => ({ ...s, [field]: !s[field] }));

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError("Please fill in all password fields.");
      return;
    }
    if (pwForm.next.length < 4) {
      setPwError("New password must be at least 4 characters.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New password and confirmation don't match.");
      return;
    }

    setPwSaving(true);
    try {
      await onChangePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwSuccess("Password updated successfully.");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwError(err?.message || "Couldn't update password. Please try again.");
    } finally {
      setPwSaving(false);
    }
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      if (onDeleteAccount) await onDeleteAccount();
      else await api.del(`/api/user/delete-account/${publicId(user)}`);
      setDeleteOpen(false);
      logout();
     setTimeout(()=>{ navigate("/")}, 900);
    }
    finally { setDeleting(false); }
  };

  return (
    <>
      <MobileHeader variant="back" title="Profile" />
      <div className="profile-card">
      {/* Green cover banner */}
      <div className="profile-cover" />

      {/* Avatar overlapping the cover, with camera + delete controls */}
      <div className="profile-avatar-wrap">
        <div className="profile-avatar-slot">
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={user.name}
              className="profile-avatar-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="profile-avatar-fallback">{initials}</div>
          )}

          {avatarBusy && (
            <div className="profile-avatar-busy">
              <span className="profile-spinner" />
            </div>
          )}

          {/* Camera icon — opens file picker, auto-uploads on selection */}
          <button
            type="button"
            className="profile-avatar-btn profile-avatar-btn-camera"
            onClick={openFilePicker}
            disabled={avatarBusy}
            aria-label="Change profile photo"
            title="Change photo"
          >
            <i className="bi bi-camera-fill" />
          </button>

          {/* Delete icon — only shown when there's a photo to remove */}
          {avatarUrl && (
            <button
              type="button"
              className="profile-avatar-btn profile-avatar-btn-delete"
              onClick={handleDeletePhoto}
              disabled={avatarBusy}
              aria-label="Remove profile photo"
              title="Remove photo"
            >
              <i className="bi bi-trash-fill" />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg"
            className="profile-hidden-input"
            onChange={handleFileSelected}
          />
        </div>
      </div>

      <div className="profile-body">
        <div className="profile-heading">
          <div><h2 className="profile-name">{user.name}</h2><p className="profile-since">Member since: {dateHelper(user.memberSince) || "—"}</p></div>
          <span className="profile-status"><i className="bi bi-shield-check me-1" />Active account</span>
        </div>

        {/* Stats row */}
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{dbFavorites.length}</span>
            <span className="profile-stat-label">Favorites</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{user.stats?.searches ?? 0}</span>
            <span className="profile-stat-label">Searches</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{user.stats?.reviews ?? 0}</span>
            <span className="profile-stat-label">Reviews</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile Information
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            Change Password
          </button>
        </div>
        {/* Feedback */}
        {feedback.text && (
          <div
            className={`d-flex align-items-center gap-2 px-2 py-2 rounded-3 shadow-sm border mb-4 ${
              feedback.type === "success"
                ? "bg-success-subtle border-success text-success"
                : "bg-danger-subtle border-danger text-danger"
            }`}
          >
            <i
              className={`bi ${
                feedback.type === "success"
                  ? "bi-check-circle-fill"
                  : "bi-exclamation-circle-fill"
              } fs-5`}
            />

            <div className="fw-medium">{feedback.text}</div>
          </div>
        )}
        {/* ---------------- Profile Information tab ---------------- */}
        {activeTab === "profile" && (
          <form onSubmit={saveEdit}>
            <div className="profile-info-list">
              <ProfileField
                icon="bi-person"
                label="Full name"
                editMode={editMode}
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              />
              <ProfileField
                icon="bi-envelope"
                label="Email"
                type="email"
                editMode={editMode}
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
              <ProfileField
                icon="bi-telephone"
                label="Phone"
                editMode={editMode}
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              />
              
            </div>

            {/* Actions: Edit vs Save/Cancel */}
            {!editMode ? (
              <div className="profile-actions">
                <button
                  type="button"
                  className="profile-btn profile-btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startEdit();
                  }}
                >
                  <i className="bi bi-pencil-fill me-2" />
                  Edit Profile
                </button>
                <button type="button" className="profile-btn profile-btn-outline" onClick={onLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="profile-actions">
                <button type="submit" className="profile-btn profile-btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" className="profile-btn profile-btn-outline" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </button>
              </div>
            )}
          </form>
        )}

        {/* ---------------- Change Password tab ---------------- */}
        {activeTab === "password" && (
          <form onSubmit={submitPasswordChange}>
            {pwError && (
              <div className="profile-alert profile-alert-error">
                <i className="bi bi-exclamation-circle" /> {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="profile-alert profile-alert-success">
                <i className="bi bi-check-circle" /> {pwSuccess}
              </div>
            )}

            <PasswordField
              label="Current password"
              value={pwForm.current}
              visible={showPw.current}
              onToggleVisible={() => togglePwVisibility("current")}
              onChange={(v) => setPwForm((f) => ({ ...f, current: v }))}
            />
            <PasswordField
              label="New password"
              value={pwForm.next}
              visible={showPw.next}
              onToggleVisible={() => togglePwVisibility("next")}
              onChange={(v) => setPwForm((f) => ({ ...f, next: v }))}
            />
            <PasswordField
              label="Confirm new password"
              value={pwForm.confirm}
              visible={showPw.confirm}
              onToggleVisible={() => togglePwVisibility("confirm")}
              onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))}
            />

            <div className="profile-actions">
              <button type="submit" className="profile-btn profile-btn-primary" disabled={pwSaving}>
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>
        )}

        <section className="profile-danger-zone" aria-labelledby="delete-account-title">
          <div><h3 id="delete-account-title"><i className="bi bi-exclamation-triangle me-2" />Delete account</h3><p>This permanently removes your account and saved data. This action cannot be undone.</p></div>
          {!deleteOpen ? <button type="button" className="profile-btn profile-btn-danger" onClick={() => setDeleteOpen(true)}>Delete account</button> :
            <div className="profile-delete-confirm"><span>Are you sure?</span><button type="button" className="profile-btn profile-btn-danger" onClick={confirmDeleteAccount} disabled={deleting}>{deleting ? "Deleting…" : "Yes, delete"}</button><button type="button" className="profile-btn profile-btn-outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</button></div>}
        </section>
      </div>
      </div>
    </>
  );
}

/* ---------- small helper subcomponents (kept in this file for a single-file drop-in) ---------- */

function ProfileField({ icon, label, value, editMode, onChange, type = "text" }) {
  return (
    <div className="profile-info-row">
      <i className={`bi ${icon}`} />
      {editMode ? (
        <input
          type={type}
          className="profile-input"
          value={value ?? ""}
          placeholder={label}
          aria-label={label}
          autoFocus={false}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <span>{value || "—"}</span>
      )}
    </div>
  );
}

function PasswordField({ label, value, visible, onToggleVisible, onChange }) {
  return (
    <div className="profile-pw-field">
      <label className="profile-pw-label">{label}</label>
      <div className="profile-pw-input-wrap">
        <input
          type={visible ? "text" : "password"}
          className="profile-input profile-pw-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
        />
        <button
          type="button"
          className="profile-pw-toggle"
          onClick={onToggleVisible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} />
        </button>
      </div>
    </div>
  );
}
