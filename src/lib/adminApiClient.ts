import apiClient from '@/lib/apiClient';

const adminApiClient = {
  getUsers: async (page = 1, limit = 50) => {
    return apiClient.get(`/admin/users?page=${page}&limit=${limit}`);
  },

  getUser: async (id: string) => {
    return apiClient.get(`/admin/users/${id}`);
  },

  approveKyc: async (id: string, tier: 2 | 3) => {
    return apiClient.patch(`/admin/users/${id}/kyc`, { tier });
  },

  toggleUserActive: async (id: string, active: boolean) => {
    return apiClient.patch(`/admin/users/${id}/status`, { active });
  },

  getTransactions: async (page = 1, limit = 50) => {
    return apiClient.get(`/admin/transactions?page=${page}&limit=${limit}`);
  },

  getMerchants: async () => {
    return apiClient.get(`/admin/merchants`);
  },

  verifyMerchant: async (id: string) => {
    return apiClient.post(`/admin/merchants/${id}/verify`);
  },

  reverseTransaction: async (id: string) => {
    return apiClient.post(`/admin/transactions/${id}/reverse`);
  },

  getDisputes: async (page = 1, limit = 50) => {
    return apiClient.get(`/admin/disputes?page=${page}&limit=${limit}`);
  },

  updateDispute: async (id: string, status: string) => {
    return apiClient.patch(`/admin/disputes/${id}`, { status });
  },

  getAuditLogs: async (page = 1, limit = 50) => {
    return apiClient.get(`/admin/audit-logs?page=${page}&limit=${limit}`);
  },
};

export default adminApiClient;
