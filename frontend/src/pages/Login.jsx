import { useState,useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import { api } from "../api/client";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
    const [systemDetail, setSystemDetail] = useState({});
     useEffect(() => {
     const getSystemDetail = async () => {
       try {
         const detail = await api.get("/api/system/sys-details");
         setSystemDetail(detail);
       } catch (e) {
         console.error(e);
       }
     };
     getSystemDetail();
     const interval = setInterval(getSystemDetail, 15000); // refresh every 15s
     return () => clearInterval(interval);
   }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
      const dest = location.state?.from?.pathname || "/";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="d-flex align-items-center gap-2 mb-4">
          <span className="icon-circle bg-primary-brand text-white" style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",borderRadius: "50%" }}>
            <img src={ systemDetail?.system_logo|| logo} alt="North Industrial Area Wholesale Locator" className="sidebar-logo" />
          </span>
          <div className="d-flex flex-column lh-1">
            <span className="fw-bold" style={{ fontSize: "0.95rem" }}>{systemDetail?.system_name || "NORTH INDUSTRIAL AREA"}</span>
            <span className="text-muted-brand" style={{ fontSize: "0.72rem" }}>{systemDetail?.other_name || "Wholesale Locator"} . Admin Panel</span>
          </div>
        </div>

        
        <p className="text-muted-brand mb-4" style={{ fontSize: "0.88rem" }}>
          Sign in to your dashboard.
        </p>

        {error && (
          <div className="alert-brand-danger mb-3">
            <i className="bi bi-exclamation-circle-fill me-2" />
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label">Email or Username or Phone</label>
            <input
              required
              type="text"
              className="form-control"
              placeholder="Enter your email, username, or phone"
              value={form.email}
              onChange={update("email")}
              autoComplete="username"
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Password</label>
            <div className="position-relative">
              <input
                required
                type={showPw ? "text" : "password"}
                className="form-control pe-5"
                placeholder="••••••••"
                value={form.password}
                onChange={update("password")}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn border-0 position-absolute top-50 end-0 translate-middle-y me-1 p-1"
                onClick={() => setShowPw((s) => !s)}
                tabIndex={-1}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <i className={`bi ${showPw ? "bi-eye-slash" : "bi-eye"} text-muted-brand`} />
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-end mb-4">
            <a href="#" className="text-primary-brand fw-semibold" style={{ fontSize: "0.82rem" }}>Forgot password?</a>
          </div>

          <button type="submit" className="btn btn-brand w-100 rounded-3 py-2 fw-semibold" disabled={submitting}>
            {submitting ? (
              <><span className="spinner-border spinner-border-sm me-2" />Signing in...</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
