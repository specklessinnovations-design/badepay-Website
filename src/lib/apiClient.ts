// Lightweight fetch-based API client with refresh-on-401 (webapp)
const ACCESS_KEY = "bade_pay_token";
const REFRESH_KEY = "bade_pay_refresh";
const API_BASE = "/api/v1";

function getAccessToken() {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken() {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

function setTokens(access: string | null, refresh: string | null) {
  if (typeof localStorage === "undefined") return;
  if (access) localStorage.setItem(ACCESS_KEY, access);
  else localStorage.removeItem(ACCESS_KEY);

  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  else localStorage.removeItem(REFRESH_KEY);
}

async function refreshTokens() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error("Refresh failed");
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function apiRequest(path: string, opts: RequestInit = {}, tryRefresh = true) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };

  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

  if (res.status === 401 && tryRefresh) {
    try {
      await refreshTokens();
      return apiRequest(path, opts, false);
    } catch (e) {
      setTokens(null, null);
      throw e;
    }
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

export const apiClient = {
  get: (p: string) => apiRequest(p, { method: "GET" }),
  post: (p: string, body?: any) => apiRequest(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: (p: string, body?: any) => apiRequest(p, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: (p: string) => apiRequest(p, { method: "DELETE" }),
  setTokens,
  getAccessToken,
  getRefreshToken,
};

export default apiClient;
// FRONTEND-ONLY MODE: All API calls are stubbed — no real backend requests are made.
// This file exists only to satisfy imports; actual data comes from mock stores.
const apiClient = {
  get: async () => ({ data: {} }),
  post: async () => ({ data: {} }),
  put: async () => ({ data: {} }),
  patch: async () => ({ data: {} }),
  delete: async () => ({ data: {} }),
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
};
export default apiClient;
