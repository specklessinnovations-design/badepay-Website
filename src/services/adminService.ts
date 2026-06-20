/**
 * BadePay Admin Service
 * Connects to the real backend API for admin operations.
 * Admin uses a separate JWT stored under a different key.
 */

import apiClient from '@/lib/apiClient';
import adminApiClient from '@/lib/adminApiClient';
import {
  mapUsersToAdminRecords,
  mapTransactionsToAdminRecords,
  mapUsersToKycSubmissions,
} from '@/lib/adminMappers';
import type { AdminUserRecord, AdminTxRecord, KYCSubmission } from '@/types/admin';

const ADMIN_TOKEN_KEY = 'badepay_admin_token';

function getAdminToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function setAdminToken(token: string | null) {
  if (typeof localStorage === 'undefined') return;
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

/**
 * Override the Authorization header for admin requests by temporarily
 * injecting the admin token into the apiClient.
 */
async function adminRequest<T = any>(
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
  body?: any,
): Promise<T> {
  const adminToken = getAdminToken();
  const url = `${(apiClient as any).BASE_URL || 'http://localhost:3000/api/v1'}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
  const res = await fetch(url, {
    method: method.toUpperCase(),
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: any;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data?.message || `Admin request failed: ${res.status}`);
  return data as T;
}

export const adminService = {
  /**
   * Admin login.
   * Backend: POST /admin/auth/login
   */
  login: async (email: string, password: string) => {
    const resp = await apiClient.post('/admin/auth/login', { email, password });
    const token = resp?.data?.token || resp?.token;
    const admin = resp?.data?.admin || resp?.admin;
    if (token) setAdminToken(token);
    return admin || { name: 'Admin', email, role: 'admin' as const };
  },

  /**
   * Admin logout — clears the admin token.
   */
  logout: async () => {
    setAdminToken(null);
  },

  /**
   * Get platform stats.
   */
  getStats: async () => {
    const usersResp = await adminApiClient.getUsers(1, 1);
    const txResp = await adminApiClient.getTransactions(1, 1);
    const merchantsResp = await adminApiClient.getMerchants();
    const usersTotal = usersResp?.data?.total ?? usersResp?.data?.pagination?.totalCount ?? 0;
    const txTotal = txResp?.data?.total ?? txResp?.data?.pagination?.totalCount ?? 0;
    const pendingKyc = 0;
    const totalVolume = 0;
    return { users: usersTotal, transactions: txTotal, pendingKyc, totalVolume };
  },

  /**
   * Get users list.
   * Backend: GET /admin/users
   */
  getUsers: async (page = 1, limit = 50): Promise<{ data: { data: AdminUserRecord[] } }> => {
    const resp = await adminApiClient.getUsers(page, limit);
    const users = resp?.data?.users ?? [];
    const transactionsResp = await adminApiClient.getTransactions(1, 1000).catch(() => ({ data: { transactions: [] } }));
    const transactions = transactionsResp?.data?.transactions ?? [];
    const mapped = mapUsersToAdminRecords(users, transactions as any) as AdminUserRecord[];
    return { data: { data: mapped } };
  },

  /**
   * Toggle user active status.
   * Backend: PATCH /admin/users/:id/status
   */
  toggleUserActive: async (id: string, isActive: boolean) => {
    try {
      return await adminApiClient.toggleUserActive(id, isActive);
    } catch {
      return { success: false };
    }
  },

  /**
   * Get transactions list.
   * Backend: GET /admin/transactions
   */
  getTransactions: async (page = 1, limit = 50): Promise<{ data: { data: AdminTxRecord[] } }> => {
    const resp = await adminApiClient.getTransactions(page, limit);
    const transactions = resp?.data?.transactions ?? [];
    const usersResp = await adminApiClient.getUsers(1, 1000).catch(() => ({ data: { users: [] } }));
    const users = usersResp?.data?.users ?? [];
    const mapped = mapTransactionsToAdminRecords(transactions as any, users as any) as AdminTxRecord[];
    return { data: { data: mapped } };
  },

  /**
   * Get pending KYC submissions.
   * Backend: GET /admin/users (filter kycStatus=pending)
   */
  getPendingKyc: async (): Promise<KYCSubmission[]> => {
    const usersResp = await adminApiClient.getUsers(1, 1000);
    const users = usersResp?.data?.users ?? [];
    return mapUsersToKycSubmissions(users as any).filter((s) => s.status === 'pending');
  },

  /**
   * Review a KYC submission.
   * Backend: PATCH /admin/users/:id/kyc
   */
  reviewKyc: async (userId: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      return adminApiClient.approveKyc(userId, 2);
    }
    return adminApiClient.approveKyc(userId, 1 as 2 | 3).catch(() => ({ success: false }));
  },

  /**
   * Get disputes.
   * Backend: GET /admin/disputes
   */
  getDisputes: async (page = 1, limit = 50) => {
    const resp = await adminApiClient.getDisputes(page, limit);
    return resp?.data?.disputes ?? resp?.data ?? [];
  },

  /**
   * Update dispute status.
   * Backend: PATCH /admin/disputes/:id
   */
  updateDispute: async (id: string, status: string) => {
    return adminApiClient.updateDispute(id, status);
  },

  /**
   * Reverse a transaction.
   * Backend: POST /admin/transactions/:id/reverse
   */
  reverseTransaction: async (id: string) => {
    return adminApiClient.reverseTransaction(id);
  },
};

export default adminService;
