import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);
const STORAGE_KEY = "nia-wholesale-favorites";
const PENDING_KEY = "nia-wholesale-favorites-pending";

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      /* storage unavailable, ignore */
    }
  }, [favorites]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    const synchronize = async () => {
      try {
        const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
        await Promise.all(pending.map((item) => item.action === "remove"
          ? api.del(`/api/user/favorites/${item.id}`)
          : api.post("/api/user/favorites", { company_id: item.id })));
        const remote = await api.get("/api/user/favorites");
        const local = favorites;
        const merged = Array.from(new Set([...remote, ...local].map(String)));
        if (!cancelled) setFavorites(merged);
        await Promise.all(merged.map((companyId) => api.post("/api/user/favorites", { company_id: companyId })));
        localStorage.removeItem(PENDING_KEY);
      } catch {
        // Keep local favorites and the pending queue for the next retry.
      }
    };
    synchronize();
    return () => { cancelled = true; };
  }, [user?.id]);

  const isFavorite = (id) => favorites.some((favorite) => String(favorite) === String(id));

  const toggleFavorite = (id) => {
    const removing = favorites.some((favorite) => String(favorite) === String(id));
    setFavorites((prev) => removing
      ? prev.filter((f) => String(f) !== String(id))
      : [...prev, id]);
    if (user) {
      const request = removing
        ? api.del(`/api/user/favorites/${id}`)
        : api.post("/api/user/favorites", { company_id: id });
      request.catch(() => {
        try {
          const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
          pending.push({ id, action: removing ? "remove" : "add" });
          localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
        } catch { /* local cache remains the immediate source for the UI */ }
      });
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
