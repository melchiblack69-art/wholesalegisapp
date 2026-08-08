// Central place that talks to your Express API.
// Set VITE_API_URL in a .env file, e.g. VITE_API_URL=https://your-api.onrender.com/api
export const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

console.log(BASE_URL);

const TOKEN_KEY = "NIA_user_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  
  try {
    const headers = {};

    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (!isForm && body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      ...(method === "GET" || method === "HEAD"
        ? {}
        : {
            body: body
              ? isForm
                ? body
                : JSON.stringify(body)
              : undefined,
          }),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      // No JSON response (e.g. empty body, 204, or HTML error page)
    }

    if (!res.ok) {
      // Maintenance Mode
      if (res.status === 503 && data?.maintenance) {
        if (window.location.pathname !== "/maintenance") {
          console.log("Maintenance Mode: redirecting from", window.location.pathname);
          window.location.href = "/maintenance";
        }
        const err = new Error(data?.message || "The system is under maintenance.");
        err.isMaintenance = true;
        throw err;
      }

      // Unauthorized
      if (res.status === 401) {
        const isSessionIssue = ["Invalid token", "Not authorized", "Token expired"].includes(
          data?.message
        );

        if (path !== "/api/user/login" && isSessionIssue) {
          localStorage.removeItem(TOKEN_KEY);
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        throw new Error(data?.message || "Unauthorized");
      }

      // Catch-all: 400, 403, 404, 409, 500, etc.
      throw new Error(data?.message || `Request failed (${res.status})`);
    }

    return data;
  } finally {
  
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body, opts = {}) => request(path, { method: "POST", body, ...opts }),
  put: (path, body, opts = {}) => request(path, { method: "PUT", body, ...opts }),
  patch: (path, body, opts = {}) => request(path, { method: "PATCH", body, ...opts }),
  del: (path, body, opts = {}) => request(path, { method: "DELETE", body, ...opts }),
};

/*
 * Expected backend contract (build these routes in Express against your single `users` table):
 *
 * POST /api/auth/login
 *   body: { email, password }
 *   200: { token, admin: { id, name, email, role, ... } }
 *
 * POST /api/auth/register            (public — a wholesaler signs itself up)
 *   body: { companyName, email, password, phone, address }
 *   200/201: { token, user } or { message: "Registered, pending approval" }
 *
 * GET /api/auth/me                   (Authorization: Bearer <token>)
 *   200: { user }
 */