import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import AdminMap from "../components/AdminMap";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function AdminDashboard() {
  const { openSidebar } = useSidebar();
  const {user} = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({ total_companies: 0, total_categories: 0, total_products: 0, total_users: 0 });
  const [companyRows, setCompanyRows] = useState([]);
  const [categoryRows, setCategoryRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const recent = [...companyRows].sort((a, b) => new Date(b.created_at || b.addedOn || 0) - new Date(a.created_at || a.addedOn || 0)).slice(0, 3);
  const activeCount = companyRows.filter((c) => String(c.status).toLowerCase() === "active").length;
  const activePct = companyRows.length ? ((activeCount / companyRows.length) * 100).toFixed(1) : "0.0";
  const chartData = categoryRows.map((category) => ({ name: category.category_name, value: category.company_count, color: category.color || "#1c6b41", icon: category.icon || "bi-building" }));
  const totalCatCompanies = chartData.reduce((s, d) => s + d.value, 0);

  const isAdmin = user?.role === "super_admin";

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [statsRes, companiesRes] = await Promise.all([
          api.get("/api/auth/dashboard"),
          api.get("/api/auth/companies")
        ]);
        setStats(statsRes || {});
        const rows = Array.isArray(companiesRes) ? companiesRes : []; 
        setCompanyRows(rows);
        const grouped = new Map();
        rows.forEach((company) => {
          const id = company.category_id || company.cat_id || company.category_name;
          const name = company.category_name || "Uncategorized";
          const icon = company.icon || "bi-building";
          if (!grouped.has(String(id))) grouped.set(String(id), { category_name: name, 
            company_count: 0, color: company.category_color  || company.color || "#1c6b41", icon: icon });
          grouped.get(String(id)).company_count += 1;
        });
        setCategoryRows(Array.from(grouped.values()));
      } catch (error) {
        setMessage(error.message || "Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      loadDashboard();
    } else {
      api.get("/api/auth/company-name").then((response) => setCompanyName(response.company_name)).catch(() => {});
    }
  }, [isAdmin]);

  return (
    <>
      <Topbar title="Dashboard" subtitle={isAdmin ? " WholeSale Locator " : ` ${companyName} Dashboard`} onMenuClick={openSidebar} />

      <div className="p-3 p-lg-4">
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <StatCard icon="bi-building" label="Total Companies" value={stats.total_companies ?? 0} delta="Live data" />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard icon="bi-check-circle-fill" label="Active Companies" value={activeCount} delta={`${activePct}%`} color="#1f9d55" bg="#e7f7ef" />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard icon="bi-grid-3x3-gap-fill" label="Categories" value={stats.total_categories ?? 0} delta="Live data" color="#2f6fed" bg="#e9f0ff" />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard icon="bi-people-fill" label="Total Users" value={stats.total_users ?? 0} delta="Live data" color="#7a5cd6" bg="#f0ecfd" />
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-lg-5">
            <div className="card-surface p-3 h-100">
              <p className="fw-semibold mb-3">Companies by Category</p>
              <div className="d-flex align-items-center">
                <div style={{ width: 140, height: 140 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={chartData} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={2}>
                        {chartData.map((d) => (
                          <Cell key={d.name} fill={d.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} companies`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-fill ps-3">
                  {chartData.map((d) => (
                    <div key={`${d.name}-${d.value}`} className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                        <i className={`bi ${d.icon} me-1`} style={{ color: d.color, fontSize: "0.9rem" }} />
                        <span style={{ fontSize: "0.82rem" }}>{d.name}</span>
                      </div>
                      <span className="text-muted-brand" style={{ fontSize: "0.8rem" }}>
                        {d.value} ({((d.value / totalCatCompanies) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card-surface p-3 h-100">
              <p className="fw-semibold mb-3">Company Locations Overview</p>
              {loading ? <div className="text-muted-brand">Loading dashboard map...</div> : <AdminMap companies={companyRows} height={230} zoom={13} />}
            </div>
          </div>
        </div>

        <div className="card-surface p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <p className="fw-semibold mb-0">Recent Added Companies</p>
            <Link to="/companies" className="text-primary-brand fw-semibold" style={{ fontSize: "0.85rem" }}>View all</Link>
          </div>
          <div className="table-responsive">
            <table className="table admin-table mb-0">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Category</th>
                  <th>Phone</th>
                  <th>Added On</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-brand py-3">No recent companies yet.</td>
                  </tr>
                ) : recent.map((c) => (
                  <tr key={c.id}>
                    <td className="fw-medium">{c.company_name || c.name}</td>
                    <td className="text-muted-brand">{c.category_name || "Uncategorized"}</td>
                    <td className="text-muted-brand">{c.phone}</td>
                    <td className="text-muted-brand">{new Date(c.created_at || c.addedOn || 0).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</td>
                    <td><StatusBadge status={c.status || "Active"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
