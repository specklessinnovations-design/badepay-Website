// FRONTEND-ONLY MODE: walletService is stubbed.
import apiClient from '@/lib/apiClient';

export const walletService = {
  getBalance: async () => ({ balance: 125000 }),
  fund: async (_amount: number, _providerData?: any) => apiClient.post('/wallet/fund'),
  topUp: async () => ({ reference: 'REF-MOCK', status: 'success' }),
  withdraw: async () => ({ reference: 'REF-MOCK', status: 'success' }),
};

export default walletService;
