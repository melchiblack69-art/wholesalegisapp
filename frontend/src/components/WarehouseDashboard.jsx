import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { publicId } from "../utils/publicId";

export default function WarehouseDashboard() {
  const { openSidebar } = useSidebar();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_users: 0,
    total_products: 0,
    total_images: 0,
    recent_products: [],
  });
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/api/auth/company/stats"),
      api.get("/api/auth/company-name"),
    ])
      .then(([statsData, companyData]) => {
        if (!active) return;
        setStats({
          total_users: 0,
          total_products: 0,
          total_images: 0,
          recent_products: [],
          ...statsData,
        });
        setCompanyName(companyData?.company_name || "");
      })
      .catch((e) => {
        if (active) setError(e.message || "Could not load dashboard data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const products = Array.isArray(stats.recent_products)
    ? stats.recent_products
    : [];
  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={companyName || user?.companyName || "Warehouse overview"}
        onMenuClick={openSidebar}
      />
      <main className="p-3 p-lg-4">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-4">
            <StatCard
              icon="bi-box-seam-fill"
              label="Total Products"
              value={stats.total_products ?? 0}
            
            />
          </div>
          <div className="col-6 col-lg-4">
            <StatCard
              icon="bi-people-fill"
              label="Team Members"
              value={stats.total_users ?? 0}
              color="#7a5cd6"
              bg="#f0ecfd"
            />
          </div>
          <div className="col-6 col-lg-4">
            <StatCard
              icon="bi-images"
              label="Company Images"
              value={stats.total_images ?? 0}
              color="#2f6fed"
              bg="#e9f0ff"
            />
          </div>
        </div>
        <div className="card-surface p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div>
              <p className="fw-semibold mb-1">Recently added products</p>
              <p className="text-muted-brand small mb-0">
                The latest products added to your company.
              </p>
            </div>
            <Link
              to={`/company/products/${user?.companyPublicId || user?.companyId}`}
              className="text-primary-brand fw-semibold"
              style={{ fontSize: "0.85rem" }}
            >
              View all
            </Link>
          </div>
          <div className="table-responsive">
            <table className="table admin-table mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center text-muted-brand py-4"
                    >
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center text-muted-brand py-4"
                    >
                      No products have been added yet.
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr
                      key={
                        publicId(product) || `${product.product_name}-${index}`
                      }
                    >
                      <td className="text-muted-brand">{index + 1}</td>
                      <td className="fw-medium">
                        {product.product_name || "Unnamed product"}
                      </td>
                      <td>{product.quantity ?? 0}</td>
                      <td className="text-muted-brand">
                        {product.unit || "—"}
                      </td>
                      <td className="text-muted-brand">
                        {product.created_at
                          ? new Date(product.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
