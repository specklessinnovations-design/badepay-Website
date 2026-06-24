/**
 * BadePay API Client
 * A real HTTP client that communicates with the BadePay backend REST API.
 * Handles JWT auth tokens, automatic token refresh, and standardised error handling.
 */

const BASE_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PRODUCTION_API_URL) ||
  'http://localhost:3000/api/v1';

const ACCESS_KEY = "bade_pay_token";
const REFRESH_KEY = "bade_pay_refresh";

function getAccessToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

function setTokens(access?: string | null, refresh?: string | null) {
  if (typeof localStorage === "undefined") return;
  if (access) localStorage.setItem(ACCESS_KEY, access);
  else localStorage.removeItem(ACCESS_KEY);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  else localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newAccess =
      data?.accessToken || data?.tokens?.accessToken || data?.data?.tokens?.accessToken;
    const newRefresh =
      data?.refreshToken || data?.tokens?.refreshToken || data?.data?.tokens?.refreshToken;
    if (newAccess) setTokens(newAccess, newRefresh || refreshToken);
    return newAccess || null;
  } catch {
    return null;
  }
}

async function request<T = any>(
  method: string,
  path: string,
  body?: any,
  isFormData = false,
  retried = false,
): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
  const token = getAccessToken();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const init: RequestInit = {
    method,
    headers,
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
  };

  const res = await fetch(url, init);

  // If 401 and not already retried, attempt token refresh
  if (res.status === 401 && !retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(method, path, body, isFormData, true);
    }
    setTokens(null, null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("badepay:logout"));
    }
    throw new Error("Session expired. Please log in again.");
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

const apiClient = {
  get: <T = any>(path: string) => request<T>("GET", path),
  post: <T = any>(path: string, body?: any) => request<T>("POST", path, body),
  put: <T = any>(path: string, body?: any) => request<T>("PUT", path, body),
  patch: <T = any>(path: string, body?: any) => request<T>("PATCH", path, body),
  delete: <T = any>(path: string) => request<T>("DELETE", path),
  del: <T = any>(path: string) => request<T>("DELETE", path),
  postForm: <T = any>(path: string, formData: FormData) => request<T>("POST", path, formData, true),

  setTokens,
  getAccessToken,
  getRefreshToken,

  // Legacy shape kept for compatibility with existing store code
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
};

export async function apiRequest<T = any>(
  path: string,
  opts: { method?: string; body?: any } = {},
): Promise<T> {
  return request<T>(opts.method || "GET", path, opts.body);
}

export { apiClient };
export default apiClient;
