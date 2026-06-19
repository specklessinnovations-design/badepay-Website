import apiClient from '@/lib/apiClient';

export const walletService = {
  getBalance: async () => apiClient.get('/wallet/balance'),
  fund: async (amount: number, providerData?: any) => apiClient.post('/wallet/fund', { amount, providerData }),
};

export default walletService;
// FRONTEND-ONLY MODE: walletService is stubbed.
export const walletService = {
  getBalance: async () => ({ balance: 125000 }),
  topUp: async () => ({ reference: 'REF-MOCK', status: 'success' }),
  withdraw: async () => ({ reference: 'REF-MOCK', status: 'success' }),
};
