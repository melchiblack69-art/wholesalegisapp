import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function AuthScreen({ isModal = false, onClose }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode,    setMode]    = useState("login");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  const [showLoginPw,    setShowLoginPw]    = useState(false);
  const [showRegisterPw, setShowRegisterPw] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "", email: "", phone: "", password: ""
  });

  useEffect(() => {
    if (!isModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isModal]);

  const switchMode = (m) => {
    setMode(m); setErr("");
    setLoginForm({ email: "", password: "" });
    setRegisterForm({ name: "", email: "", phone: "", password: "" });
  };

  useEffect(() => {
    if (!err) return;
    const t = setTimeout(() => setErr(""), 4000);
    return () => clearTimeout(t);
  }, [err]);

  /* ── LOGIN ── */
  const submitLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!loginForm.email || !loginForm.password)
      return setErr("Email or number and password required.");
    setLoading(true); setErr("");
    try {
      await login(loginForm);
      onClose?.();
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── REGISTER ── */
  const submitRegister = async (e) => {
    e.preventDefault();
    if (loading) return;
    const { name, email, phone, password } = registerForm;
    if (!name || !phone || !password)
      return setErr("All fields are required.");

    if (!/^\+?[0-9]{9,15}$/.test(phone))
      return setErr("Enter a valid phone number.");

    setLoading(true); setErr("");
    try {
      await register({ name, email, phone, password });
      onClose?.();
    } catch (e) {
      setErr(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // TEMP: lost-password page doesn't exist in this project yet.
  // Guard the click so we don't navigate to a dead route and leave the
  // modal visually stuck over an empty page. Swap this for the real
  // navigate("/lost-password") once that page is built.
  const handleLostPassword = () => {
    // onClose?.();
    // navigate("/lost-password");
    alert("Lost password page coming soon.");
  };

  /* ── TOGGLE (Sign In / Register pill switcher) ── */
  const toggle = (
    <div
      style={{
        display: "flex",
        background: "var(--color-primary-light)",
        borderRadius: 10,
        padding: 4,
        marginBottom: 16,
      }}
    >
      <button
        type="button"
        onClick={() => switchMode("login")}
        style={{
          flex: 1,
          border: "none",
          borderRadius: 8,
          padding: "10px 0",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          background: mode === "login" ? "var(--color-primary)" : "transparent",
          color: mode === "login" ? "#fff" : "var(--color-text-muted)",
          transition: "background .15s, color .15s",
        }}
      >
        <i className="bi bi-box-arrow-in-right me-1"></i>Sign In
      </button>
      <button
        type="button"
        onClick={() => switchMode("register")}
        style={{
          flex: 1,
          border: "none",
          borderRadius: 8,
          padding: "10px 0",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          background: mode === "register" ? "var(--color-primary)" : "transparent",
          color: mode === "register" ? "#fff" : "var(--color-text-muted)",
          transition: "background .15s, color .15s",
        }}
      >
        <i className="bi bi-person-plus-fill me-1"></i>Register
      </button>
    </div>
  );

  /* ── CONTENT ── */
  const content = (
    <div className={`auth-screen ${isModal ? "" : "tf-auth-overlay"}`}>
      <div className="w-100" style={{ maxWidth: 420, margin: "0 auto" }}>
        <div className={`card border-0 rounded-4 p-4 ${isModal ? "" : "shadow-lg"}`}>

          {isModal && (
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bolder" style={{ fontSize: 16 }}>
                <i className="bi bi-person-circle me-2 text-primary-brand"></i>
                {mode === "login" ? "Sign In" : "Create Account"}
              </div>
              {onClose && (
                <button onClick={onClose} style={{
                  border: "none", background: "none", fontSize: 18,
                  cursor: "pointer", color: "#6c757d", lineHeight: 1,
                }}>✕</button>
              )}
            </div>
          )}

          {toggle}

          {err && (
            <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
              {err}
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={submitLogin}>
              <div className="d-flex flex-column gap-2">
                <input className="form-control" type="text" placeholder="Email or Mobile number"
                  autoComplete="" value={loginForm.email}
                  onChange={e => { setErr(""); setLoginForm(p => ({ ...p, email: e.target.value })) }}
                />
                <div className="input-group">
                  <input className="form-control"
                    type={showLoginPw ? "text" : "password"}
                    placeholder="Password" autoComplete="current-password"
                    value={loginForm.password}
                    onChange={e => { setErr(""); setLoginForm(p => ({ ...p, password: e.target.value })) }}
                  />
                  <span className="input-group-text" style={{ cursor: "pointer" }}
                    onClick={() => setShowLoginPw(p => !p)}>
                    <i className={`bi ${showLoginPw ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </span>
                </div>
              </div>
              <div className="d-flex justify-content-end mt-2">
                <button type="button" className="btn btn-link btn-sm p-0 text-primary-brand"
                  onClick={handleLostPassword}
                  style={{ textDecoration: "underline", fontSize: 13 }}>
                  Lost password?
                </button>
              </div>
              <button type="submit" className="btn btn-brand w-100 fw-bold mt-3 py-2"
                disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />Signing in…</>
                  : "Sign In →"
                }
              </button>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={submitRegister}>
              <div className="d-flex flex-column gap-2">
                <input className="form-control" placeholder="Full Name"
                  autoComplete="name" value={registerForm.name}
                  onChange={e => { setErr(""); setRegisterForm(p => ({ ...p, name: e.target.value })) }}
                />
                <input className="form-control" type="email" placeholder="Email Address"
                  autoComplete="email" value={registerForm.email}
                  onChange={e => { setErr(""); setRegisterForm(p => ({ ...p, email: e.target.value })) }}
                />
                <input className="form-control" placeholder="Phone Number"
                  autoComplete="tel" value={registerForm.phone}
                  onChange={e => { setErr(""); setRegisterForm(p => ({ ...p, phone: e.target.value })) }}
                />
                <div className="input-group">
                  <input className="form-control"
                    type={showRegisterPw ? "text" : "password"}
                    placeholder="Password" autoComplete="new-password"
                    value={registerForm.password}
                    onChange={e => { setErr(""); setRegisterForm(p => ({ ...p, password: e.target.value })) }}
                  />
                  <span className="input-group-text" style={{ cursor: "pointer" }}
                    onClick={() => setShowRegisterPw(p => !p)}>
                    <i className={`bi ${showRegisterPw ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </span>
                </div>
              </div>
              <button type="submit" className="btn btn-brand w-100 fw-bold mt-3 py-2"
                disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />Registering…</>
                  : "Create Account →"
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return createPortal(
      <div
        onClick={e => { if (e.target === e.currentTarget) onClose?.() }}
        className="tf-modal-overlay"
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(14,46,28,.42)", backdropFilter: "blur(1px)",
          WebkitBackdropFilter: "blur(1px)", display: "flex",
          alignItems: "center", justifyContent: "center", padding: 20,
        }}
      >
        <div className="tf-modal-sheet" onClick={e => e.stopPropagation()}>
          {content}
        </div>
      </div>,
      document.body
    );
  }

  return content;
}
