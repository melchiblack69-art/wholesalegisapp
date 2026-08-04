import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    category: "",
    phone: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get("/api/auth/categories").then((rows) => setCategories(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const { confirmPassword: _c, ...payload } = form;
      const data = await register(payload);
      setSuccess(true);
      if (data?.token) {
        setTimeout(() => navigate("/"), 1200);
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="auth-shell">
        <div className="auth-card text-center">
          <span className="icon-circle bg-primary-brand text-white mx-auto mb-3" style={{ width: 56, height: 56 }}>
            <i className="bi bi-check-lg fs-3" />
          </span>
          <h1 className="font-display fw-bold mb-2" style={{ fontSize: "1.2rem" }}>Registration submitted</h1>
          <p className="text-muted-brand mb-4" style={{ fontSize: "0.88rem" }}>
            Your company account has been created. You'll be able to manage your own warehouse profile once it's approved.
          </p>
          <Link to="/login" className="btn btn-brand rounded-3 px-4">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <h1 className="font-display fw-bold mb-1" style={{ fontSize: "1.35rem" }}>Register your company</h1>
        <p className="text-muted-brand mb-4" style={{ fontSize: "0.88rem" }}>
          Creates one account that manages only your own wholesale company profile.
        </p>

        {error && (
          <div className="alert-brand-danger mb-3">
            <i className="bi bi-exclamation-circle-fill me-2" />
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Company Name *</label>
              <input required className="form-control" value={form.companyName} onChange={update("companyName")} placeholder="e.g. Dzata Cement Ltd." />
            </div>
            <div className="col-sm-6">
              <label className="form-label">Category *</label>
              <select required className="form-select" value={form.category} onChange={update("category")}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.category_name || c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-sm-6">
              <label className="form-label">Phone *</label>
              <input required className="form-control" value={form.phone} onChange={update("phone")} placeholder="055 123 4567" />
            </div>
            <div className="col-12">
              <label className="form-label">Work Email *</label>
              <input required type="email" className="form-control" value={form.email} onChange={update("email")} placeholder="you@company.com" autoComplete="username" />
            </div>
            <div className="col-12">
              <label className="form-label">Address *</label>
              <input required className="form-control" value={form.address} onChange={update("address")} placeholder="North Industrial Area, Accra" />
            </div>
            <div className="col-sm-6">
              <label className="form-label">Password *</label>
              <input required type="password" className="form-control" value={form.password} onChange={update("password")} autoComplete="new-password" />
            </div>
            <div className="col-sm-6">
              <label className="form-label">Confirm Password *</label>
              <input required type="password" className="form-control" value={form.confirmPassword} onChange={update("confirmPassword")} autoComplete="new-password" />
            </div>
          </div>

          <button type="submit" className="btn btn-brand w-100 rounded-3 py-2 fw-semibold mt-4" disabled={submitting}>
            {submitting ? (
              <><span className="spinner-border spinner-border-sm me-2" />Creating account...</>
            ) : (
              "Create Company Account"
            )}
          </button>
        </form>

        <p className="text-center text-muted-brand mt-4 mb-0" style={{ fontSize: "0.85rem" }}>
          Already registered? <Link to="/login" className="text-primary-brand fw-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
