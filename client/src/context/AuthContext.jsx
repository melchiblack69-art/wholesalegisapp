import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../api/client";

const AuthContext = createContext(null);

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
    companyId: source.company_id ?? source.companyId ?? null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    localStorage.removeItem("turfarena_admin_token");
    localStorage.removeItem("turfarena_admin_user");

    if (!getToken()) {
      setLoading(false);
      return;
    }

    api
      .get("/api/user/me")
      .then((data) => {
        const currentUser = normalizeUser(data);
        if (!currentUser) throw new Error("Invalid session response");
        setUser(currentUser);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.isMaintenance) {
          return;
        }
        setToken(null);
        setLoading(false);
      });
  }, []);

  const login = async ({ email, password }) => {
    const data = await api.post("/api/user/login", { email, password });
    const currentUser = normalizeUser(data);
    if (!data?.token || !currentUser) throw new Error("Invalid login response");

    setToken(data.token);
    setUser(currentUser);
    return currentUser;
  };

  const register = async ({ name, email, phone, password }) => {
    const data = await api.post("/api/user/register", { name, email, phone, password });

    const currentUser = normalizeUser(data);
    if (data?.token && currentUser) {
      setToken(data.token);
      setUser(currentUser);
      return currentUser;
    }

    // Register endpoint didn't return a token directly — log in right after
    // with the same credentials so the user doesn't have to type them twice.
    return login({ email, password });
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("NIA_admin_user");
    localStorage.removeItem("turfarena_admin_token");
    localStorage.removeItem("turfarena_admin_user");
    setUser(null);
  };

  const updateCurrentUser = (payload) => {
    const currentUser = normalizeUser(payload);
    if (currentUser) setUser(currentUser);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateCurrentUser,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);