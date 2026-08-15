import { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import { useSidebar } from "../context/SidebarContext";
import { api } from "../api/client";
import { reportTypes } from "../data/reports";

const formats = [
  { key: "print", label: "Print report", icon: "bi-printer", hint: "Open a print-ready view" },
  { key: "excel", label: "Excel / CSV", icon: "bi-file-earmark-spreadsheet", hint: "Download spreadsheet data" },
  { key: "json", label: "JSON data", icon: "bi-braces", hint: "Download raw API data" },
];

export default function Reports() {
  const { openSidebar } = useSidebar();
  const [report, setReport] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [choice, setChoice] = useState(null);
  const reportColumns = report?.type === "category"
    ? [["name", "Category"], ["company_count", "Companies"]]
    : report?.type === "location"
      ? [["name", "Company"], ["address", "Address"], ["latitude", "Latitude"], ["longitude", "Longitude"], ["status", "Status"]]
      : [["name", "Company"], ["category", "Category"], ["status", "Status"], ["email", "Email"]];

  const loadReport = async (type) => {
    setLoading(true);
    try { const data = await api.get(`/api/auth/reports/${type}`); setReport(data); setRecent((items) => [{ ...data, id: Date.now() }, ...items]); return data; }
    finally { setLoading(false); }
  };
  const generate = (format) => {
    if (!choice) return;
    loadReport(choice.key).then((data) => exportReport(format, data));
  };
  const exportReport = (format, source = report) => {
    if (!source) return;
    const rows = source.rows || [];
    const headers = Object.keys(rows[0] || { name: "No data" });
    const csv = [headers, ...rows.map((row) => headers.map((h) => String(row[h] ?? "").replaceAll('"', '""')))]
      .map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    if (format === "print") {
      const win = window.open("", "_blank");
      const table = `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${String(row[h] ?? "—")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      win.document.write(`<html><head><title>${choice.title}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#182420}h1{color:#1c6b41}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1c6b41;color:#fff;text-align:left}th,td{border:1px solid #d7ded9;padding:9px;font-size:12px}tr:nth-child(even){background:#f2f9f4}@media print{button{display:none}}</style></head><body><h1>${choice.title}</h1><p>Generated ${new Date(source.generatedAt).toLocaleString()}</p>${table}</body></html>`); win.document.close(); win.print();
    } else {
      const content = format === "json" ? JSON.stringify(source, null, 2) : csv;
      const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv" });
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${choice.key}-report.${format === "json" ? "json" : "csv"}`; link.click(); URL.revokeObjectURL(link.href);
    }
    setChoice(null);
  };
  useEffect(() => { loadReport("company").catch(() => {}); }, []);

  return <><Topbar title="Reports" subtitle="Generate and download live system reports." onMenuClick={openSidebar} />
    <div className="p-3 p-lg-4"><div className="row g-3 mb-4">
      {reportTypes.map((item) => <div className="col-6 col-lg-3" key={item.key}><div className="report-card card-surface p-3 h-100 d-flex flex-column"><div className="report-card-icon"><i className={`bi ${item.icon}`} /></div><p className="fw-semibold mb-1">{item.title}</p><p className="text-muted-brand small mb-3">{item.subtitle}</p><button className="btn btn-brand btn-sm mt-auto" onClick={() => setChoice(item)} disabled={loading}><i className="bi bi-file-earmark-bar-graph me-1" />Generate</button></div></div>)}
    </div><div className="card-surface report-table-card p-3"><div className="d-flex align-items-center justify-content-between mb-3"><div><p className="fw-semibold mb-1">Live report data</p>{report && <p className="text-muted-brand small mb-0">{report.rows?.length || 0} records · Updated {new Date(report.generatedAt).toLocaleString()}</p>}</div><i className="bi bi-table text-primary-brand fs-4" /></div><div className="table-responsive"><table className="table report-table align-middle mb-0"><thead><tr>{reportColumns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{(report?.rows || []).slice(0, 8).map((row, index) => <tr key={row.public_id || row.id || `${report.type}-${index}`}>{reportColumns.map(([key]) => <td key={key} className={key === "name" ? "fw-semibold" : "text-muted-brand"}>{key === "status" ? <span className={`badge rounded-pill ${String(row[key]).toLowerCase() === "active" ? "text-bg-success" : "text-bg-secondary"}`}>{row[key] || "—"}</span> : row[key] ?? "—"}</td>)}</tr>)}</tbody></table></div>{recent.length > 0 && <small className="text-muted-brand d-block mt-3">Reports generated this session: {recent.length}</small>}</div></div>
    {choice && <div className="global-modal-backdrop" onClick={() => setChoice(null)}><div className="global-modal-card report-format-modal" onClick={(e) => e.stopPropagation()}><h5 className="fw-bold mb-1">Generate {choice.title}</h5><p className="text-muted-brand small mb-3">Choose how you want to receive this live report.</p>{formats.map((format) => <button key={format.key} className="report-format-option" onClick={() => generate(format.key)}><i className={`bi ${format.icon}`} /><span><strong>{format.label}</strong><small>{format.hint}</small></span><i className="bi bi-chevron-right ms-auto" /></button>)}<button className="btn btn-light w-100 mt-2" onClick={() => setChoice(null)}>Cancel</button></div></div>}
  </>;
}
