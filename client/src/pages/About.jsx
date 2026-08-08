import MobileHeader from "../components/MobileHeader";
import { useSystemSettings } from "../context/SystemSettingsContext";

export default function About() {
  const systemCtx = useSystemSettings();
  const about = systemCtx?.description || "Discover companies, products, and useful locations across the North Industrial Area from one simple platform.";
  const platformName = systemCtx?.system_name || "Wholesale Locator";
  const displayName = systemCtx?.other_name || "Wholesale Locator";
  const email = systemCtx?.system_email || "";
  const phone = systemCtx?.phone || systemCtx?.system_phone || "";
  const address = systemCtx?.address || systemCtx?.location || "North Industrial Area";
    return (
    <>
      <MobileHeader variant="back" title="About Us" />
      <main className="container py-4 py-lg-5 px-3 px-lg-4" style={{ maxWidth: 1040 }}>
        <section className="card-surface p-4 p-lg-5 overflow-hidden position-relative">
          <div className="position-absolute top-0 start-0 w-100" style={{ height: 6, background: "var(--color-primary)" }} />
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-5">
              
              <h1 className="fw-bold mb-3" style={{ fontSize: "clamp(1.7rem, 4vw, 2.5rem)", lineHeight: 1.15 }}>
                Connecting you to trusted wholesale businesses.
              </h1>
              <p className="text-muted-brand mb-0" style={{ lineHeight: 1.75 }}>
                Discover companies, products, and useful locations across the North Industrial Area from one simple platform.
              </p>
            </div>
            <div className="col-lg-7">
              <div className="rounded-4 p-3 p-lg-4" style={{ background: "var(--color-primary-light)" }}>
                <p className="mb-0 text-dark" style={{ whiteSpace: "pre-line", lineHeight: 1.85, fontSize: "clamp(0.95rem, 1.5vw, 1.05rem)" }}>
                  {about}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-3 mt-lg-5 rounded-4 p-4 p-lg-5 text-white" style={{ background: "linear-gradient(135deg, var(--color-primary-darker), var(--color-primary))" }}>
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                {systemCtx?.system_logo ? (
                  <img src={systemCtx.system_logo} alt={platformName} style={{ width: 48, height: 48, objectFit: "contain", background: "#fff", borderRadius: 12, padding: 6 }} />
                ) : (
                  <span className="d-flex align-items-center justify-content-center rounded-3 bg-white text-primary-brand" style={{ width: 48, height: 48 }}><i className="bi bi-buildings fs-4" /></span>
                )}
                <div>
                  <h2 className="h5 fw-bold mb-1">{platformName}</h2>
                  <span className="small" style={{ opacity: 0.8 }}>{displayName}</span>
                </div>
              </div>
              <p className="mb-0 small" style={{ lineHeight: 1.7, opacity: 0.85 }}>Find trusted wholesale businesses, products, and locations in one place.</p>
            </div>

            <div className="col-12 col-sm-6 col-lg-4">
              <h3 className="h6 fw-bold mb-3">Contact us</h3>
              <div className="d-flex flex-column gap-3 small">
                {email && <a href={`mailto:${email}`} className="text-white text-decoration-none d-flex align-items-center gap-2"><i className="bi bi-envelope" /> <span className="text-break">{email}</span></a>}
                {phone && <a href={`tel:${phone}`} className="text-white text-decoration-none d-flex align-items-center gap-2"><i className="bi bi-telephone" /> <span>{phone}</span></a>}
                <span className="d-flex align-items-start gap-2"><i className="bi bi-geo-alt" /> <span>{address}</span></span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-4">
              <h3 className="h6 fw-bold mb-3">Explore</h3>
              <div className="row g-2 small">
                {[['Browse companies', '/companies'], ['Categories', '/categories'], ['Map view', '/map'], ['Contact', '/contact']].map(([label, href]) => (
                  <div className="col-6" key={href}><a href={href} className="text-white text-decoration-none" style={{ opacity: 0.88 }}>{label}</a></div>
                ))}
              </div>
            </div>
          </div>
          <hr className="my-4" style={{ borderColor: "rgba(255,255,255,0.25)" }} />
          <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 small" style={{ opacity: 0.75 }}>
            <span>© {new Date().getFullYear()} {platformName}. All rights reserved.</span>
            <span>Built for easier wholesale discovery.</span>
          </div>
        </section>
      </main>
    </>
  );
}
