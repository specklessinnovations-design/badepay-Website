import apiClient from '@/lib/apiClient';

export interface VirtualCard {
  id: string;
  userId: string;
  currency: string;
  color: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  balance: number;
  spendingLimit: number;
  isFrozen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CardSettings {
  spendingLimit?: number;
}

const cardService = {
  /**
   * Get all cards for the current user.
   * Backend: GET /cards
   */
  getCards: async (): Promise<VirtualCard[]> => {
    const resp = await apiClient.get('/cards');
    return resp?.data?.data ?? resp?.data ?? [];
  },

  /**
   * Create a new virtual card.
   * Backend: POST /cards
   */
  createCard: async (currency: string = 'NGN', color: string = 'gradient-blue'): Promise<VirtualCard> => {
    const resp = await apiClient.post('/cards', { currency, color });
    return resp?.data?.data ?? resp?.data;
  },

  /**
   * Freeze or unfreeze a card.
   * Backend: PATCH /cards/:id/freeze
   */
  toggleFreeze: async (cardId: string): Promise<VirtualCard> => {
    const resp = await apiClient.patch(`/cards/${cardId}/freeze`);
    return resp?.data?.data ?? resp?.data;
  },

  /**
   * Update card settings (spending limit, etc.).
   * Backend: PATCH /cards/:id/settings
   */
  updateSettings: async (cardId: string, settings: CardSettings): Promise<VirtualCard> => {
    const resp = await apiClient.patch(`/cards/${cardId}/settings`, settings);
    return resp?.data?.data ?? resp?.data;
  },
};

export default cardService;
