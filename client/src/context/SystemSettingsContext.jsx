import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const { data: settings = FALLBACK, isFetched: loaded, refetch } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const data = await api.get("/api/system/sys-details");
      return {
        id: data.id,
        system_name: data.system_name || "",
        other_name: data.other_name || "",
        system_logo: data.system_logo || "",
        system_email: data.system_email || "",
        maintenance_mode: !!data.maintenance_mode,
        description: data.description || "",
        updated_at: data.updated_at || "",
      };
    },
    staleTime: 30 * 60 * 1000,
  });

  const updateSettings = (next) => queryClient.setQueryData(["system-settings"], (current = FALLBACK) => ({ ...current, ...next }));

 useEffect(() => {
  const handleFocus = () => {
    refetch();
  };

  window.addEventListener("focus", handleFocus);
  const handleSettingsChanged = () => { refetch(); };
  window.addEventListener("system-settings-updated", handleSettingsChanged);
  window.addEventListener("systemSettingsChanged", handleSettingsChanged);

  return () => {
    window.removeEventListener("focus", handleFocus);
    window.removeEventListener("system-settings-updated", handleSettingsChanged);
    window.removeEventListener("systemSettingsChanged", handleSettingsChanged);
  };
}, [refetch]);

  return (
    <SystemSettingsContext.Provider value={{ ...settings, loaded, refresh: refetch, updateSettings }}>
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
