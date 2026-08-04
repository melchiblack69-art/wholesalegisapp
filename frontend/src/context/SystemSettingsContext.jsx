import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const SystemSettingsContext = createContext(null);

const FALLBACK = {
  id: "",
  system_name: "NORTH INDUSTRIAL AREA",
  other_name: "Wholesale Locator",
  system_logo: "",
  system_email: "",
  maintenance_mode: false,
  description: "",
  updated_at: "",
};

export function SystemSettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  const updateSettings = (next) => {
    setSettings((current) => ({ ...current, ...next }));
  };

  const refresh = async () => {
    try {
        const data = await api.get("/api/system/sys-details");
      const next = {
        id: data.id,
        system_name: data.system_name || "",
        other_name: data.other_name || "",
        system_logo: data.system_logo || "",
        system_email: data.system_email || "",
        maintenance_mode: !!data.maintenance_mode,
        description: data.description || "",
        updated_at: data.updated_at || "",
      };
      setSettings(next);
      return next;
    } catch {
      return null;
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SystemSettingsContext.Provider value={{ ...settings, loaded, refresh, updateSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export const useSystemSettings = () => {
  const ctx = useContext(SystemSettingsContext);
  if (ctx === null) {
    throw new Error("useSystemSettings must be used within a SystemSettingsProvider");
  }
  return ctx;
};
