import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import AdminMap, { NIA_CENTER } from "../components/AdminMap";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { useModal } from "../context/ModalContext";

function parseProducts(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const COMPANY_MANAGEMENT_ROLES = ["warehouse_manager", "warehouse_user"];

function parseWorkingHours(value) {
  if (!value) {
    return [{ days: "", openTime: "", closeTime: "" }];
  }

  if (Array.isArray(value)) {
    return value.map((entry) => ({
      days: entry?.days || entry?.day || "",
      openTime: entry?.openTime || entry?.from || entry?.open || "",
      closeTime: entry?.closeTime || entry?.to || entry?.close || "",
    }));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [{ days: "", openTime: "", closeTime: "" }];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => ({
          days: entry?.days || entry?.day || "",
          openTime: entry?.openTime || entry?.from || entry?.open || "",
          closeTime: entry?.closeTime || entry?.to || entry?.close || "",
        }));
      }
    } catch {
      // If the saved value is plain text, fall back to a single row with the text in days.
    }

    return [{ days: trimmed, openTime: "", closeTime: "" }];
  }

  return [{ days: "", openTime: "", closeTime: "" }];
}

function serializeWorkingHours(rows) {
  return JSON.stringify(rows.filter((row) => row.days || row.openTime || row.closeTime));
}

function formatTimeToAmPm(value) {
  if (!value) return "--";

  const [hoursValue, minutesValue] = value.split(":");
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue) || 0;
  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${String(minutes).padStart(2, "0")}${suffix}`;
}

export default function CompanyDetails() {
  const { openSidebar } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const companyId = id || (location.pathname === "/my-company" ? user?.companyId : null);
  const fileInputRef = useRef(null);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCompany, setLoadingCompany] = useState(Boolean(id));
  const {showModal} = useModal();


  const [form, setForm] = useState({
    name: "",
    category: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    products: "",
  });
  const [pin, setPin] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [images, setImages] = useState([]);
  const [saved, setSaved] = useState(false);
  const [editableFields, setEditableFields] = useState({});
  const [workingHours, setWorkingHours] = useState([{ days: "", openTime: "", closeTime: "" }]);

  useEffect(() => {
    api.get("/api/company/categories").then((rows) => setCategories(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!companyId || !user) return;

    let ignore = false;
    setLoadingCompany(true);

    Promise.all([
      api.get(`/api/auth/mycompany/${companyId}`),
      api.get(`/api/company/${companyId}/images`),
    ])
      .then(([company, imageResponse]) => {
        if (ignore) return;

        const productNames = Array.isArray(company?.products)
          ? company.products.map((product) => product.product_name || product.name || product).filter(Boolean)
          : [];

        setCompanyDetails(company || null);
        setForm({
          name: company?.company_name || company?.name || "",
          category: String(company?.cat_id || company?.category_id || company?.category || ""),
          phone: company?.phone || "",
          email: company?.email || "",
          address: company?.address || "",
          description: company?.description || "",
          products: productNames.join(", "),
        });
        const savedWorkingHours = company?.working_hours || company?.working_days_hours || company?.working_days_and_hours;
        setWorkingHours(parseWorkingHours(savedWorkingHours));
        setPin(company?.latitude && company?.longitude ? [Number(company.latitude), Number(company.longitude)] : null);
        setImages(Array.isArray(imageResponse?.images) ? imageResponse.images.map((image) => ({ ...image, previewUrl: image.url })) : []);
      })
      .catch((error) => {
        if (!ignore){
          showModal(error.message || "Could not load company deatils.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
      };
      })
      .finally(() => {
        if (!ignore) setLoadingCompany(false);
      });

    return () => {
      ignore = true;
    };
  }, [companyId, isEdit, user?.id, user?.role, user?.companyId]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const updateWorkingHour = (index, field, value) => {
    setWorkingHours((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const addWorkingHourRow = () => {
    setWorkingHours((prev) => [...prev, { days: "", openTime: "", closeTime: "" }]);
  };

  const removeWorkingHourRow = (index) => {
    setWorkingHours((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const toggleFieldEdit = (field) => {
    setEditableFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      showModal("Geolocation isn't supported on this device/browser.", { type: "error", title: "Warning", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      (err) => {
        showModal(err.message || "Couldn't get your location. Check location permissions.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 3000, confirmText: false });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onFilesChosen = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const pendingImages = files.map((file, index) => ({
      key: `temp-${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: true,
    }));

    setImages((prev) => [...prev, ...pendingImages]);
   
    try {
      for (const item of pendingImages) {
        if (!companyId) {
          throw new Error("Save the company first before uploading images.");
        }

        const formData = new FormData();
        formData.append("images", item.file);
        const response = await api.post(`/api/company/${companyId}/images`, formData, { isForm: true });
        const uploadedImages = Array.isArray(response?.images) ? response.images : [];
        const uploaded = uploadedImages[0];

        if (!uploaded) throw new Error("Image upload failed.");

        setImages((prev) =>
          prev.map((current) =>
            current.key === item.key
              ? { ...current, ...uploaded, previewUrl: uploaded.url, uploading: false }
              : current
          )
        );
      }

      showModal("Image(s) uploaded successfully .", { type: "success", title: "Success", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    } catch (error) {
      setImages((prev) => prev.filter((item) => !pendingImages.some((pending) => pending.key === item.key)));
    showModal(error.message || "Image upload failed.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    } finally {
      event.target.value = "";
    }
  };

  const removeImage = async (image) => {
    if (image?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(image.previewUrl);
    }

    if (image?.id && !image.uploading) {
      try {
        await api.del(`/api/company/${companyId}/images/${image.id}`);
      } catch (error) {
        showModal(error.message || "Could not delete image.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
        return;
      }
    }

    setImages((prev) => prev.filter((item) => {
      const sameId = image.id != null && item.id === image.id;
      const sameKey = image.key != null && item.key === image.key;
      return !sameId && !sameKey;
    }));
    showModal("Image removed.", { type: "success", title: "Success", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
  };

  const deleteAllImages = async () => {
    if (!companyId || images.length === 0) return;

    try {
      await Promise.all(images.filter((image) => image.id).map((image) =>
  api.del(`/api/company/${companyId}/images/${image.id}`)
));
      setImages([]);
      showModal("All images removed.", { type: "success", title: "Success", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    } catch (error) {
      showModal(error.message || "Could not delete all images.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    }
  };

  const setCoverImage = async (image) => {
    if (!image?.id || image.is_cover) return;

    try {
      await api.put(`/api/company/${companyId}/images/${image.id}/cover`);
      setImages((prev) => prev.map((item) => ({ ...item, is_cover: item.id === image.id })));
      showModal("Cover image updated", { type: "success", title: "Success", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    } catch (error) {
      showModal(error.message || "Could not update cover image.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    }
  };

  useEffect(() => {
    // Clean up any object URLs when the form unmounts.
    return () => images.forEach((img) => img.previewUrl && URL.revokeObjectURL(img.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!companyId) {
      showModal("Company ID missing .", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
      return;
    }

    try {
      await api.put(`/api/company/companies/${companyId}`, {
        company_name: form.name,
        category_id: form.category ? Number(form.category) : null,
        phone: form.phone,
        email: form.email,
        address: form.address,
        latitude: pin ? pin[0] : null,
        longitude: pin ? pin[1] : null,
        description: form.description,
        working_hours: serializeWorkingHours(workingHours),
        status: companyDetails?.status || "Active",
      });

      showModal("Company Information Saved.", { type: "success", title: "Success", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });

    } catch (error) {
      showModal(error.message || "Could not save company info.", { type: "error", title: "Error", 
        autoClose: true, autoCloseDelay: 2000, confirmText: false });
    }
  };

  const productList = Array.isArray(companyDetails?.products) && companyDetails.products.length
    ? companyDetails.products.map((product) => product.product_name || product.name || product).filter(Boolean)
    : parseProducts(form.products);


  return (
    <>
      <Topbar
        title={ "View/Edit Company " }
        subtitle={ "View and edit this company's details."}
        onMenuClick={openSidebar}
      />

      <div className="p-3 p-lg-4">
        <form onSubmit={onSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-lg-6">
              <div className="card-surface p-3 p-lg-4 h-100">
                <p className="fw-semibold mb-3">Company Information</p>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label">Company Name <i className="bi bi-asterisk text-danger" style={{fontSize: "0.6rem" }}></i></label>
                    <div className="input-group">
                      <input required className="form-control" placeholder="Enter company name" value={form.name} onChange={update("name")} disabled={!editableFields.name} />
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => toggleFieldEdit("name")} title="Edit field">
                        <i className="bi bi-pencil" />
                      </button>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Category <i className="bi bi-asterisk text-danger" style={{fontSize: "0.6rem" }}></i></label>
                    <div className="input-group">
                      <select required className="form-select" value={form.category} onChange={update("category")} disabled={!editableFields.category}>
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.category_name || c.name}</option>
                        ))}
                      </select>
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => toggleFieldEdit("category")} title="Edit field">
                        <i className="bi bi-pencil" />
                      </button>
                    </div>
                    {companyDetails?.cat_id && !form.category && (
                      <small className="text-muted-brand">Current category: {companyDetails.category_name}</small>
                    )}
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Phone <i className="bi bi-asterisk text-danger" style={{fontSize: "0.6rem" }}></i></label>
                    <div className="input-group">
                      <input required className="form-control" placeholder="Enter phone number" value={form.phone} onChange={update("phone")} disabled={!editableFields.phone} />
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => toggleFieldEdit("phone")} title="Edit field">
                        <i className="bi bi-pencil" />
                      </button>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Email</label>
                    <div className="input-group">
                      <input type="email" className="form-control" placeholder="Enter email address" value={form.email} onChange={update("email")} disabled={!editableFields.email} />
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => toggleFieldEdit("email")} title="Edit field">
                        <i className="bi bi-pencil" />
                      </button>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Address <i className="bi bi-asterisk text-danger" style={{fontSize: "0.6rem" }}></i></label>
                    <div className="input-group">
                      <input required className="form-control" placeholder="Enter full address" value={form.address} onChange={update("address")} disabled={!editableFields.address} />
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => toggleFieldEdit("address")} title="Edit field">
                        <i className="bi bi-pencil" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card-surface p-3 p-lg-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <p className="fw-semibold mb-0">Location</p>
                  <button
                    type="button"
                    className="btn btn-sm btn-brand-outline rounded-3 d-flex align-items-center gap-2"
                    onClick={useMyLocation}
                    disabled={locating}
                  >
                    {locating ? (
                      <span className="spinner-border spinner-border-sm" />
                    ) : (
                      <i className="bi bi-crosshair" />
                    )}
                    {locating ? "Locating..." : "Use current location"}
                  </button>
                </div>
                <p className="text-muted-brand mb-2" style={{ fontSize: "0.82rem" }}>
                  Stand at the company's location and tap the button to automatically set the map pin to your current location.
                </p>
                {locationError && (
                  <div className="alert-brand-danger mb-2" style={{ fontSize: "0.8rem" }}>
                    <i className="bi bi-exclamation-circle-fill me-2" />{locationError}
                  </div>
                )}
                <AdminMap pinPosition={pin} height={220} center={pin || NIA_CENTER} zoom={pin ? 16 : 13} />
                <div className="row g-2 mt-2">
                  <div className="col-6">
                    <label className="form-label mb-1">Latitude</label>
                    <input readOnly className="form-control" value={pin ? pin[0].toFixed(5) : ""} placeholder="—" />
                  </div>
                  <div className="col-6">
                    <label className="form-label mb-1">Longitude</label>
                    <input readOnly className="form-control" value={pin ? pin[1].toFixed(5) : ""} placeholder="—" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-lg-6">
              <div className="card-surface p-3 p-lg-4 h-100">
                <p className="fw-semibold mb-3">Additional Information</p>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={4} placeholder="Enter company description..." value={form.description} onChange={update("description")} />
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label mb-0">Working Days & Hours</label>
                    <button type="button" className="btn btn-sm btn-brand-outline rounded-3" onClick={addWorkingHourRow}>
                      <i className="bi bi-plus-lg me-1" /> Append
                    </button>
                  </div>
                  <div className="mb-3">
                    
                      {workingHours.some((row) => row.days || row.openTime || row.closeTime) ? (
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {workingHours.map((row, index) => {
                            const timeRange = [row.openTime, row.closeTime].filter(Boolean).map((value) => formatTimeToAmPm(value)).join("-");
                            const previewText = row.days ? `${row.days}${timeRange ? ` ${timeRange}` : ""}` : timeRange || "Untitled";

                            return (
                              <span
                                key={`preview-${index}`}
                                className="badge rounded-pill"
                                style={{
                                  background: "var(--color-bg)",
                                  color: "var(--color-primary)",
                                  border: "1px solid var(--color-border)",
                                  padding: "0.5rem 0.7rem",
                                  textAlign: "left",
                                  whiteSpace: "normal",
                                  display: "inline-flex",
                                  justifyContent: "flex-start",
                                }}
                              >
                                {previewText}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-brand" style={{ fontSize: "0.85rem" }}>No working hours saved yet.</span>
                      )}
                  
                  </div>

                  {workingHours.map((row, index) => (
                    <div key={`${row.days}-${index}`} className="border rounded-3 p-3 mb-2" style={{ background: "var(--color-bg)" }}>
                      <div className="row g-2 align-items-end">
                        <div className="col-md-4">
                          <label className="form-label mb-1">Days</label>
                          <select
                            className="form-select"
                            value={row.days}
                            onChange={(e) => updateWorkingHour(index, "days", e.target.value)}
                          >
                            <option value="">Select days</option>
                            <option value="Mon-Fri">Mon-Fri</option>
                            <option value="Mon-Sat">Mon-Sat</option>
                            <option value="Mon-Sun">Mon-Sun</option>
                            <option value="Tue-Sun">Tue-Sun</option>
                            <option value="Sat-Sun">Sat-Sun</option>
                            <option value="Sun">Sun</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label mb-1">Open</label>
                          <input
                            type="time"
                            className="form-control"
                            step="900"
                            value={row.openTime}
                            onChange={(e) => updateWorkingHour(index, "openTime", e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label mb-1">Close</label>
                          <input
                            type="time"
                            className="form-control"
                            step="900"
                            value={row.closeTime}
                            onChange={(e) => updateWorkingHour(index, "closeTime", e.target.value)}
                          />
                        </div>
                        <div className="col-md-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger m-1 w-50"
                            onClick={() => removeWorkingHourRow(index)}
                            disabled={workingHours.length === 1}
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card-surface p-3 p-lg-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <p className="fw-semibold mb-0">Company Images</p>
                  {images.length > 0 && <span className="text-muted-brand" style={{ fontSize: "0.8rem" }}>{images.length} images</span>}
                </div>
                <div
                  className="upload-dropzone py-4"
                  style={{ minHeight: 120 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="bi bi-images text-muted-brand mb-2" style={{ fontSize: "1.6rem" }} />
                  <p className="fw-semibold mb-1" style={{ fontSize: "0.9rem" }}>Click to add images</p>
                  <p className="text-muted-brand mb-0" style={{ fontSize: "0.78rem" }}>PNG,JPG,WEBP, multiple allowed</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  multiple
                  className="d-none"
                  onChange={onFilesChosen}
                />

                {images.length > 0 && (
                  <div className="d-flex justify-content-end mb-1 mt-2">
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={deleteAllImages}>
                      <i className="bi bi-trash3 me-1" /> Delete all
                    </button>
                  </div>
                )}

                {loadingCompany ? (
                  <div className="text-muted-brand mt-3" style={{ fontSize: "0.9rem" }}>
                    <i className="bi bi-arrow-repeat me-2" />Loading company details...
                  </div>
                ) : images.length > 0 ? (
                  <div className="row g-3 mt-1">
                    {images.map((img, i) => (
                      <div className="col-sm-6" key={img.id || img.key || `${img.previewUrl}-${i}`}>
                        <div className="border rounded-3 overflow-hidden position-relative bg-light" style={{ minHeight: 150 }}>
                          <img src={img.previewUrl || img.url} alt={`Company ${i + 1}`} style={{ width: "100%", height: 150, objectFit: "cover" }} />
                          {img.is_cover && <span className="position-absolute top-0 start-0 badge rounded-pill m-2" style={{ background: "var(--color-primary)", color: "#fff" }}>Cover</span>}
                          {img.uploading && <span className="position-absolute bottom-0 start-0 end-0 px-2 py-1 text-center" style={{ background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "0.8rem" }}>Uploading...</span>}
                          <div className="position-absolute top-0 end-0 d-flex gap-1 m-2">
                            {!img.is_cover && (
                              <button type="button" className="btn btn-sm btn-light rounded-circle" onClick={() => setCoverImage(img)} title="Set as cover" aria-label="Set as cover">
                                <i className="bi bi-star-fill" style={{ color: "var(--color-warning)" }} />
                              </button>
                            )}
                            <button type="button" className="btn btn-sm btn-light rounded-circle" onClick={() => removeImage(img)} title="Delete image" aria-label="Delete image">
                              <i className="bi bi-trash3-fill" style={{ color: "var(--color-danger)" }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-brand mt-3" style={{ fontSize: "0.9rem" }}>No images yet. Add a few to showcase the company.</div>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 flex-wrap">
            <button type="button" className="btn btn-brand-outline rounded-3 px-4" onClick={() => navigate(COMPANY_MANAGEMENT_ROLES.includes(user?.role) ? "/my-company" : "/companies")}>Cancel</button>
            <button type="submit" className="btn btn-brand rounded-3 px-4">
              <i className="bi bi-save me-2" /> Save Company
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
