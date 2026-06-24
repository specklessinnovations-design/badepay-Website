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
   * Backend: GET /admin/dashboard
   */
  getStats: async () => {
    try {
      const resp = await adminApiClient.get('/admin/dashboard');
      const data = resp?.data || resp;
      return {
        users: data.users?.total || 0,
        activeUsers: data.users?.active || 0,
        merchants: data.users?.merchants || 0,
        transactions: data.transactions?.total || 0,
        totalVolume: data.transactions?.totalVolume || 0,
        todayVolume: data.transactions?.todayVolume || 0,
        pendingDisputes: data.disputes?.requiresAction || 0,
        openDisputes: data.disputes?.open || 0,
        recentTransactions: data.recentTransactions || [],
      };
    } catch {
      return {
        users: 0,
        activeUsers: 0,
        merchants: 0,
        transactions: 0,
        totalVolume: 0,
        todayVolume: 0,
        pendingDisputes: 0,
        openDisputes: 0,
        recentTransactions: [],
      };
    }
  },

  /**
   * Get analytics data.
   * Backend: GET /admin/dashboard
   */
  getAnalytics: async () => {
    try {
      const resp = await adminApiClient.get('/admin/dashboard');
      const data = resp?.data || resp;
      return {
        dailyRevenue: data.dailyRevenue || [],
        weeklyUsers: data.weeklyUsers || [],
        monthlyVolume: data.monthlyVolume || [],
        kpiSummary: {
          totalUsers: data.users?.total || 0,
          totalVolume: data.transactions?.totalVolume || 0,
          totalTransactions: data.transactions?.total || 0,
          totalRevenue: data.revenue?.total || 0,
          activeToday: data.users?.active || 0,
          pendingKYC: data.kyc?.pending || 0,
          openDisputes: data.disputes?.open || 0,
          merchantCount: data.users?.merchants || 0,
          consumerCount: data.users?.consumers || 0,
        },
      };
    } catch {
      return {
        dailyRevenue: [],
        weeklyUsers: [],
        monthlyVolume: [],
        kpiSummary: {
          totalUsers: 0,
          totalVolume: 0,
          totalTransactions: 0,
          totalRevenue: 0,
          activeToday: 0,
          pendingKYC: 0,
          openDisputes: 0,
          merchantCount: 0,
          consumerCount: 0,
        },
      };
    }
  },

  /**
   * Get users list.
   * Backend: GET /admin/users
   */
  getUsers: async (page = 1, limit = 50, search?: string, userType?: string, kycStatus?: string, isActive?: boolean): Promise<{ data: { data: AdminUserRecord[] } }> => {
    const query = new URLSearchParams();
    if (page) query.set('page', String(page));
    if (limit) query.set('limit', String(limit));
    if (search) query.set('search', search);
    if (userType) query.set('userType', userType);
    if (kycStatus) query.set('kycStatus', kycStatus);
    if (isActive !== undefined) query.set('isActive', String(isActive));
    const qs = query.toString();
    const resp = await adminApiClient.get(`/admin/users${qs ? '?' + qs : ''}`);
    const users = resp?.data?.users ?? [];
    const transactionsResp = await adminApiClient.get('/admin/transactions?page=1&limit=1000').catch(() => ({ data: { transactions: [] } }));
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
    const query = new URLSearchParams();
    if (page) query.set('page', String(page));
    if (limit) query.set('limit', String(limit));
    const qs = query.toString();
    const resp = await adminApiClient.get(`/admin/transactions${qs ? '?' + qs : ''}`);
    const transactions = resp?.data?.transactions ?? [];
    const usersResp = await adminApiClient.get('/admin/users?page=1&limit=1000').catch(() => ({ data: { users: [] } }));
    const users = usersResp?.data?.users ?? [];
    const mapped = mapTransactionsToAdminRecords(transactions as any, users as any) as AdminTxRecord[];
    return { data: { data: mapped } };
  },

  /**
   * Get pending KYC submissions.
   * Backend: GET /admin/users (filter kycStatus=pending)
   */
  getPendingKyc: async (): Promise<KYCSubmission[]> => {
    const resp = await adminApiClient.get('/admin/users?kycStatus=pending&limit=100');
    const users = resp?.data?.users ?? [];
    return mapUsersToKycSubmissions(users as any).filter((s) => s.status === 'pending');
  },

  /**
   * Review a KYC submission.
   * Backend: PATCH /admin/users/:id/kyc
   */
  reviewKyc: async (userId: string, action: 'approve' | 'reject') => {
    const tier = action === 'approve' ? 2 : 1;
    try {
      await adminApiClient.patch(`/admin/users/${userId}/kyc`, { tier });
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  /**
   * Get disputes.
   * Backend: GET /admin/disputes
   */
  getDisputes: async (page = 1, limit = 50) => {
    const query = new URLSearchParams();
    if (page) query.set('page', String(page));
    if (limit) query.set('limit', String(limit));
    const qs = query.toString();
    const resp = await adminApiClient.get(`/admin/disputes${qs ? '?' + qs : ''}`);
    return resp?.data?.disputes ?? resp?.data ?? [];
  },

  /**
   * Update dispute status.
   * Backend: PATCH /admin/disputes/:id
   */
  updateDispute: async (id: string, status: string) => {
    try {
      await adminApiClient.patch(`/admin/disputes/${id}`, { status });
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  /**
   * Reverse a transaction.
   * Backend: POST /admin/transactions/:id/reverse
   */
  reverseTransaction: async (id: string) => {
    try {
      await adminApiClient.post(`/admin/transactions/${id}/reverse`);
      return { success: true };
    } catch {
      return { success: false };
    }
  },
};

export default adminService;
