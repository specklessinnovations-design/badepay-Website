import apiClient from '@/lib/apiClient';

export const transfersService = {
  history: async () => apiClient.get('/transfers/history'),
  initiate: async (payload: any) => apiClient.post('/transfers/initiate', payload),
  confirm: async (payload: any) => apiClient.post('/transfers/confirm', payload),
};

export default transfersService;
