import { useMemo, useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import TableToolbar from "../components/TableToolbar";
import { useSidebar } from "../context/SidebarContext";
import { api } from "../api/client";
import { useModal } from "../context/ModalContext";

const MESSAGE_PREVIEW_LENGTH = 60;

function truncate(text = "", max = MESSAGE_PREVIEW_LENGTH) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export default function Help() {
  const { openSidebar } = useSidebar();
  const [help, setHelp] = useState([]); // Replace with actual data fetching logic
  const [q, setQ] = useState("");
  const { showModal } = useModal();
  const [message, setMessage] = useState("");
  const [previewItem, setPreviewItem] = useState(null);

  const fetchHelpMessages = async () => {
    try {
      const messages = await api.get("/api/auth/messages");
      setHelp(Array.isArray(messages) ? messages : []);
    } catch (error) {
      showModal(error.message || "Could not load messages.", {
        type: "error",
        title: "Error",
        autoClose: true,
        autoCloseDelay: 2000,
        confirmText: false,
      });
    }
  };

  useEffect(() => {
    fetchHelpMessages();
  }, []);

  // Close preview on Escape
  useEffect(() => {
    if (!previewItem) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setPreviewItem(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [previewItem]);

  const filtered = useMemo(
    () =>
      help.filter(
        (h) =>
          !q ||
          h.name?.toLowerCase().includes(q.toLowerCase()) ||
          h.email?.toLowerCase().includes(q.toLowerCase()) ||
          h.message?.toLowerCase().includes(q.toLowerCase()),
      ),
    [help, q],
  );

  return (
    <>
      <Topbar
        title="Contact Messages"
        subtitle="Manage user Enquiries messages."
        onMenuClick={openSidebar}
      />

      <div className="p-3 p-lg-4">
        <div className="card-surface p-0">
          <TableToolbar
            search={q}
            onSearchChange={setQ}
            searchPlaceholder="Search name or email..."
            addLabel="Delete All"
            onAdd={() => {}}
          />
          {message && (
            <p
              className={`mt-3 mb-0 ${
                message.toLowerCase().includes("success")
                  ? "text-success"
                  : "text-danger"
              }`}
            >
              {message}
            </p>
          )}
          <div className="table-responsive">
            <table className="table admin-table mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h, i) => (
                  <tr key={h.id}>
                    <td className="text-muted-brand">{i + 1}</td>
                    <td className="text-muted-brand">{h.name}</td>
                    <td className="text-muted-brand">{h.email}</td>
                    <td className="text-muted-brand" style={{ maxWidth: 260 }}>
                      {truncate(h.message)}
                      {h.message && h.message.length > MESSAGE_PREVIEW_LENGTH && (
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 ms-1 align-baseline"
                          style={{ fontSize: "0.8rem" }}
                          onClick={() => setPreviewItem(h)}
                        >
                          Read more
                        </button>
                      )}
                    </td>
                    <td className="text-muted-brand">
                      {h.created_at ? new Date(h.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="btn btn-sm border-0 p-1"
                          title="Preview"
                          onClick={() => setPreviewItem(h)}
                        >
                          <i className="bi bi-eye" style={{ color: "var(--color-primary)" }} />
                        </button>
                        <button className="btn btn-sm border-0 p-1" title="Delete">
                          <i className="bi bi-trash" style={{ color: "var(--color-danger)" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 text-muted-brand" style={{ fontSize: "0.85rem" }}>
            Showing 1 to {filtered.length} of {filtered.length} entries
          </div>
        </div>
      </div>

      {previewItem && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="card-surface p-4"
            style={{ maxWidth: 520, width: "90%", maxHeight: "80vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div>
                <p className="fw-semibold mb-0">{previewItem.name}</p>
                <p className="text-muted-brand mb-0" style={{ fontSize: "0.85rem" }}>
                  {previewItem.email}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm border-0 p-1"
                onClick={() => setPreviewItem(null)}
                aria-label="Close preview"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <p className="text-muted-brand mb-3" style={{ whiteSpace: "pre-wrap" }}>
              {previewItem.message}
            </p>
            <p className="text-muted-brand mb-0" style={{ fontSize: "0.78rem" }}>
              {previewItem.created_at
                ? new Date(previewItem.created_at).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}