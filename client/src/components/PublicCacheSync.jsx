import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export default function PublicCacheSync() {
  const queryClient = useQueryClient();
  const versionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const response = await fetch(`${API_URL}/api/cache/version`, { cache: "no-store" });
        if (!response.ok) return;
        const { version } = await response.json();
        if (cancelled) return;
        if (versionRef.current !== null && versionRef.current !== version) {
          await queryClient.invalidateQueries();
        }
        versionRef.current = version;
      } catch {
        // Offline/server failures are handled by the existing query retry logic.
      }
    };
    check();
    const timer = window.setInterval(check, 30_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [queryClient]);

  return null;
}
