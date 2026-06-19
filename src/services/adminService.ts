import adminApiClient from '@/lib/adminApiClient';
import { mapUsersToAdminRecords, mapTransactionsToAdminRecords, mapUsersToKycSubmissions, computeAnalytics } from '@/lib/adminMappers';
import type { AdminUserRecord, AdminTxRecord, KYCSubmission } from '@/types/admin';

export const adminService = {
  login: async () => ({ name: 'Super Admin', email: 'super@badepay.app', role: 'super_admin' as const }),
  logout: async () => {},

  getStats: async () => {
    // Fetch summary counts from backend endpoints
    const usersResp = await adminApiClient.getUsers(1, 1);
    const txResp = await adminApiClient.getTransactions(1, 1);
    const merchantsResp = await adminApiClient.getMerchants();
    const usersTotal = usersResp?.data?.total ?? 0;
    const txTotal = txResp?.data?.total ?? 0;
    const pendingKyc = 0; // will be fetched separately
    const totalVolume = 0; // not provided by API currently
    return { users: usersTotal, transactions: txTotal, pendingKyc, totalVolume };
  },

  getUsers: async (page = 1, limit = 50): Promise<{ data: { data: AdminUserRecord[] } }> => {
    const resp = await adminApiClient.getUsers(page, limit);
    const users = resp?.data?.users ?? [];
    const transactionsResp = await adminApiClient.getTransactions(1, 1000).catch(() => ({ data: { transactions: [] } }));
    const transactions = transactionsResp?.data?.transactions ?? [];
    const mapped = mapUsersToAdminRecords(users, transactions as any) as AdminUserRecord[];
    return { data: { data: mapped } };
  },

  toggleUserActive: async (_id: string, _isActive: boolean) => {
    try {
      const resp = await adminApiClient.toggleUserActive(_id, _isActive);
      return resp;
    } catch (e) {
      return { success: false };
    }
  },

  getTransactions: async (page = 1, limit = 50): Promise<{ data: { data: AdminTxRecord[] } }> => {
    const resp = await adminApiClient.getTransactions(page, limit);
    const transactions = resp?.data?.transactions ?? [];
    const usersResp = await adminApiClient.getUsers(1, 1000).catch(() => ({ data: { users: [] } }));
    const users = usersResp?.data?.users ?? [];
    const mapped = mapTransactionsToAdminRecords(transactions as any, users as any) as AdminTxRecord[];
    return { data: { data: mapped } };
  },

  getPendingKyc: async (): Promise<KYCSubmission[]> => {
    const usersResp = await adminApiClient.getUsers(1, 1000);
    const users = usersResp?.data?.users ?? [];
    return mapUsersToKycSubmissions(users as any).filter((s) => s.status === 'pending');
  },

  reviewKyc: async (userId: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      // upgrade to Tier 2 by default
      return adminApiClient.approveKyc(userId, 2);
    }
    // No explicit reject endpoint; downgrade to Tier 1
    return adminApiClient.approveKyc(userId, 1 as 2 | 3).catch(() => ({ success: false }));
  },

  getDisputes: async (page = 1, limit = 50) => {
    const resp = await adminApiClient.getDisputes(page, limit).catch(() => ({ data: { disputes: [] } }));
    return resp?.data?.disputes ?? [];
  },

  reverseTransaction: async (id: string) => {
    return adminApiClient.reverseTransaction(id).catch(() => ({ success: false }));
  },

  updateDispute: async (id: string, status: string) => {
    return adminApiClient.updateDispute(id, status).catch(() => ({ success: false }));
  },

  getAnalytics: async () => {
    // Fallback: compute analytics from users/transactions
    const usersResp = await adminApiClient.getUsers(1, 1000).catch(() => ({ data: { users: [] } }));
    const txResp = await adminApiClient.getTransactions(1, 1000).catch(() => ({ data: { transactions: [] } }));
    const users = usersResp?.data?.users ?? [];
    const transactions = txResp?.data?.transactions ?? [];
    return computeAnalytics(users as any, transactions as any, [] as any);
  },
};
