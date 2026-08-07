import React from "react";
import { useEffect, useState } from "react";
import { api } from "../api/client"; // named import
import logo from "../assets/logo.png"; // default import
import { useSystemSettings } from "../context/SystemSettingsContext";

export default function MaintenancePage() {
const systemCtx = useSystemSettings();
  return (
    <div className="sysmaint-page">
      <header className="sysmaint-header">
        <div className="sysmaint-logo">
          <img
            src={systemCtx?.system_logo || logo}
            alt="North Industrial Area Wholesale Locator"
            className="sysmaint-logo"
          />
        </div>
        <div className="d-flex flex-column lh-1">
          <span className="fw-bold" style={{ fontSize: "1.1rem" }}>
            {systemCtx?.system_name || "NORTH INDUSTRIAL AREA "}
          </span>
          <span
            className="fw-semibold"
            style={{ fontSize: "0.85rem", color: "var(--color-primary)" }}
          >
            {systemCtx?.other_name || "Wholesale Locator"}
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
