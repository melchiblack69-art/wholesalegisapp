import React from "react";
import { useEffect, useState } from "react";
import { api } from "../api/client"; // named import
import logo from "../assets/logo.png"; // default import

export default function MaintenancePage() {
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
  return (
    <div className="sysmaint-page">
      <header className="sysmaint-header">
        <div className="sysmaint-logo">
          <img
            src={systemDetail?.system_logo || logo}
            alt="North Industrial Area Wholesale Locator"
            className="sysmaint-logo"
          />
        </div>
        <div className="d-flex flex-column lh-1">
          <span className="fw-bold" style={{ fontSize: "1.1rem" }}>
            {systemDetail?.system_name || "NORTH INDUSTRIAL AREA "}
          </span>
          <span
            className="fw-semibold"
            style={{ fontSize: "0.85rem", color: "var(--color-primary)" }}
          >
            {systemDetail?.other_name || "Wholesale Locator"}
          </span>
        </div>
      </header>

      <main className="sysmaint-main">
        <div className="sysmaint-icon-wrap">
          <span className="sysmaint-deco sysmaint-deco-1" />
          <span className="sysmaint-deco sysmaint-deco-2">✕</span>
          <span className="sysmaint-deco sysmaint-deco-3">✕</span>
          <span className="sysmaint-deco sysmaint-deco-4" />
          <span className="sysmaint-deco sysmaint-deco-5" />
          <i className="bi bi-tools sysmaint-icon" />
        </div>

        <h1 className="sysmaint-title">System Under Maintenance</h1>
        <div className="sysmaint-rule" />
        <p className="sysmaint-subtext">
          We are currently performing some routine maintenance
          <br className="d-none d-sm-block" />
          to improve your experience. Please check back shortly.
        </p>
      </main>

      <footer className="sysmaint-footer">
        <i className="bi bi-calendar-check sysmaint-footer-icon" />
        <span>We&apos;ll be back soon. Thank you for your patience.</span>
      </footer>
    </div>
  );
}
