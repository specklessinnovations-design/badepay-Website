/**
 * BadePay Transfers Service
 * Connects to the real backend API for P2P and bank transfers.
 */
import apiClient from '@/lib/apiClient';

export const transfersService = {
  /** GET /transfers/history — alias for transaction list */
  history: async () => apiClient.get('/transfers/history'),

  /** POST /transfers/initiate — initiate a transfer */
  initiate: async (payload: any) => apiClient.post('/transfers/initiate', payload),

  /** POST /transfers/confirm — confirm a transfer (alias) */
  confirm: async (payload: any) => apiClient.post('/transfers/confirm', payload),

  /** GET /transfers/banks — list Nigerian banks */
  getBanks: async () => {
    const resp = await apiClient.get('/transfers/banks');
    return resp?.data?.banks || resp?.data || [];
  },

  /** POST /transfers/resolve-account — resolve a bank account */
  resolveAccount: async (accountNumber: string, bankCode: string) => {
    const resp = await apiClient.post('/transfers/resolve-account', { accountNumber, bankCode });
    return resp?.data || null;
  },
};

export default transfersService;
