/**
 * BadePay Admin API Client
 * Uses the admin JWT (stored separately) for all admin API calls.
 */

// Backend base URL is set via VITE_API_URL in .env; falls back to the production backend when unset.
const BASE_URL: string = import.meta.env.VITE_API_URL || 'https://badepay-backend.vercel.app/api/v1';

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
  put: async (path: string, body?: any) => adminFetch("PUT", path, body),
  delete: async (path: string) => adminFetch("DELETE", path),

  // Users
  getUsers: async (page = 1, limit = 50) =>
    adminFetch("GET", `/admin/users?page=${page}&limit=${limit}`),

  getUser: async (id: string) => adminFetch("GET", `/admin/users/${id}`),

  approveKyc: async (id: string, tier: 2 | 3) =>
    adminFetch("PATCH", `/admin/users/${id}/kyc`, { tier }),

  updateKyc: async (id: string, kycStatus: string, kycLevel?: number) =>
    adminFetch("PATCH", `/admin/users/${id}/kyc`, { kycStatus, kycLevel }),

  // Fix: backend expects { action: 'ban' | 'unban' | 'lock_wallet' | 'unlock_wallet' }
  toggleUserActive: async (id: string, active: boolean) =>
    adminFetch("PATCH", `/admin/users/${id}/status`, { action: active ? 'unban' : 'ban' }),

  lockWallet: async (id: string, lock: boolean) =>
    adminFetch("PATCH", `/admin/users/${id}/status`, { action: lock ? 'lock_wallet' : 'unlock_wallet' }),

  // Merchants
  getMerchants: async (page = 1, limit = 50, search?: string, verified?: string, isActive?: string) => {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) qs.set('search', search);
    if (verified !== undefined) qs.set('verified', verified);
    if (isActive !== undefined) qs.set('isActive', isActive);
    return adminFetch("GET", `/admin/merchants?${qs.toString()}`);
  },

  getMerchantDetail: async (id: string) => adminFetch("GET", `/admin/merchants/${id}`),

  verifyMerchant: async (id: string) => adminFetch("POST", `/admin/merchants/${id}/verify`),

  // Transactions
  getTransactions: async (page = 1, limit = 50) =>
    adminFetch("GET", `/admin/transactions?page=${page}&limit=${limit}`),

  reverseTransaction: async (id: string) => adminFetch("POST", `/admin/transactions/${id}/reverse`),

  // Disputes
  getDisputes: async (page = 1, limit = 50) =>
    adminFetch("GET", `/admin/disputes?page=${page}&limit=${limit}`),

  updateDispute: async (id: string, status: string) =>
    adminFetch("PATCH", `/admin/disputes/${id}`, { status }),

  // Audit
  getAuditLogs: async (page = 1, limit = 50) =>
    adminFetch("GET", `/admin/audit-logs?page=${page}&limit=${limit}`),
};

export default adminApiClient;
