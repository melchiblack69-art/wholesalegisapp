import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../api/client";

const AuthContext = createContext(null);

// Login returns { token, admin }; GET /auth/me returns the user record directly.
// Normalizing here keeps all UI consumers independent of that API detail.
function normalizeUser(payload) {
  const source = payload?.admin ?? payload?.user ?? payload;
  if (!source?.id) return null;

  return {
    id: source.id,
    name: source.name ?? source.fullName ?? source.username ?? "",
    username: source.username ?? "",
    email: source.email ?? "",
    phone: source.phone ?? "",
    role: source.role,
    photo: source.photo ?? source.avatar ?? source.profile_photo ?? source.image ?? source.image_url ?? source.imageUrl ?? null,
    // A super_admin has no company_id by design.
    companyId: source.company_id ?? source.companyId ?? null,
    companyPublicId: source.company_public_id ?? source.companyPublicId ?? null,
    companyName: source.company_name ?? source.companyName ?? "",
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Remove session keys used by earlier mock/API implementations. The live
    // application stores exactly one JWT: `admin_token`.
    localStorage.removeItem("turfarena_admin_token");
    localStorage.removeItem("turfarena_admin_user");

    if (!getToken()) {
      setLoading(false);
      return;
    }

    api
      .get("/api/auth/me")
      .then((data) => {
        const currentUser = normalizeUser(data);
        if (!currentUser) throw new Error("Invalid session response");
        setUser(currentUser);
        setLoading(false);
      })
      .catch((err) => {
        // Maintenance mode: client.js has already kicked off a hard
        // window.location.href navigation to /maintenance. Don't clear the
        // token or flip loading to false here — doing so would let
        // ProtectedRoute re-render with user=null and race in its own
        // client-side redirect to /login before the real navigation
        // finishes, which is what was causing the login/index.html bounce.
        if (err?.isMaintenance) {
          return;
        }

        // Any other failure (expired/invalid token, network error, etc.)
        // really does mean the session is bad — clear it normally.
        setToken(null);
        setLoading(false);
      });
  }, []);

  const login = async ({ email, password }) => {
    const data = await api.post("/api/auth/login", { email, password });
    const currentUser = normalizeUser(data);
    if (!data?.token || !currentUser) throw new Error("Invalid login response");

    setToken(data.token);
    setUser(currentUser);
    return currentUser;
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("admin_user");
    localStorage.removeItem("turfarena_admin_token");
    localStorage.removeItem("turfarena_admin_user");
    setUser(null);
  };

  const updateCurrentUser = (payload) => {
    const currentUser = normalizeUser(payload);
    if (currentUser) setUser(currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateCurrentUser,
        isSuperAdmin: user?.role === "super_admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
