/**
 * BadePay Cards Service
 * Connects to the real backend API for virtual card management.
 */
import apiClient from '@/lib/apiClient';

export const cardsService = {
  /** GET /cards — list all virtual cards */
  list: async () => {
    const resp = await apiClient.get('/cards');
    return resp?.data || [];
  },

  /** POST /cards — issue a new virtual card */
  create: async (data?: any) => {
    const resp = await apiClient.post('/cards', data || {});
    return resp?.data || null;
  },

  /** PATCH /cards/:id/freeze — freeze or unfreeze a card */
  freeze: async (id: string) => {
    const resp = await apiClient.patch(`/cards/${id}/freeze`);
    return resp?.data || null;
  },

  /** PATCH /cards/:id/settings — update card settings */
  updateSettings: async (id: string, data: any) => {
    const resp = await apiClient.patch(`/cards/${id}/settings`, data);
    return resp?.data || null;
  },
};

export default cardsService;
