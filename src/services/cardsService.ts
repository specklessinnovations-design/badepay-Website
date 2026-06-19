import apiClient from '@/lib/apiClient';

export const cardsService = {
  list: async () => apiClient.get('/cards'),
  create: async (data: any) => apiClient.post('/cards', data),
  freeze: async (id: string) => apiClient.patch(`/cards/${id}/freeze`),
  updateSettings: async (id: string, data: any) => apiClient.patch(`/cards/${id}/settings`, data),
};

export default cardsService;
