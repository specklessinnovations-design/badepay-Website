/**
 * BadePay Admin API Client
 * Uses the admin JWT (stored separately) for all admin API calls.
 */

const isProduction = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production';

const BASE_URL: string =
  (typeof import.meta !== 'undefined' && (isProduction ? (import.meta as any).env?.VITE_PRODUCTION_API_URL : (import.meta as any).env?.VITE_API_URL)) ||
  (isProduction ? 'https://badepay-backend.vercel.app/api/v1' : 'http://localhost:3000/api/v1');

const ADMIN_TOKEN_KEY = "badepay_admin_token";

function getAdminToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

async function adminFetch<T = any>(method: string, path: string, body?: any): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) throw new Error(data?.message || `Admin request failed: ${res.status}`);
  return data as T;
}

const adminApiClient = {
  get: async (path: string) => adminFetch("GET", path),
  post: async (path: string, body?: any) => adminFetch("POST", path, body),
  patch: async (path: string, body?: any) => adminFetch("PATCH", path, body),
  delete: async (path: string) => adminFetch("DELETE", path),

  getUsers: async (page = 1, limit = 50) =>
    adminFetch("GET", `/admin/users?page=${page}&limit=${limit}`),

  getUser: async (id: string) => adminFetch("GET", `/admin/users/${id}`),

  approveKyc: async (id: string, tier: 2 | 3) =>
    adminFetch("PATCH", `/admin/users/${id}/kyc`, { tier }),

  toggleUserActive: async (id: string, active: boolean) =>
    adminFetch("PATCH", `/admin/users/${id}/status`, { active }),

  getTransactions: async (page = 1, limit = 50) =>
    adminFetch("GET", `/admin/transactions?page=${page}&limit=${limit}`),

  getMerchants: async () => adminFetch("GET", `/admin/merchants`),

  verifyMerchant: async (id: string) => adminFetch("POST", `/admin/merchants/${id}/verify`),

  reverseTransaction: async (id: string) => adminFetch("POST", `/admin/transactions/${id}/reverse`),

  getDisputes: async (page = 1, limit = 50) =>
    adminFetch("GET", `/admin/disputes?page=${page}&limit=${limit}`),

  updateDispute: async (id: string, status: string) =>
    adminFetch("PATCH", `/admin/disputes/${id}`, { status }),

  getAuditLogs: async (page = 1, limit = 50) =>
    adminFetch("GET", `/admin/audit-logs?page=${page}&limit=${limit}`),
};

export default adminApiClient;
