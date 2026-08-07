import MobileHeader from "../components/MobileHeader";
import { useSystemSettings } from "../context/SystemSettingsContext";

export default function About() {
  const systemCtx = useSystemSettings();
  const about = systemCtx?.description || "Hi "  ;
  console.log(about);
    return (
    <>
      <MobileHeader variant="back" title="About Us" />
      <div className="container py-4 px-3" style={{ maxWidth: 900 }}>
        <h1 className="fw-bold mb-3" style={{ fontSize: "1.6rem" }}>About This Platform</h1>
        <p className="text-muted-brand" style={{ lineHeight: 1.6 }}>
          { about }
        </p>
      </div>
    </>
  );
}
