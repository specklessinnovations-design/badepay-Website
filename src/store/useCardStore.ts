import { create } from 'zustand';
import cardService, { type VirtualCard as BackendCard } from '@/services/cardService';

export type CardCurrency = 'NGN' | 'USD';
export type CardStatus = 'active' | 'frozen';

export interface CardChannels {
  online: boolean;
  atm: boolean;
  pos: boolean;
}

export interface VirtualCard {
  id: string;
  currency: CardCurrency;
  status: CardStatus;
  balance: number;
  spendingLimit: number;
  spendingUsed: number;
  last4: string;
  pan: string;
  cvv: string;
  pin?: string;
  expiryMonth: string;
  expiryYear: string;
  createdAt: string;
  channels: CardChannels;
}

function mapBackendCard(card: BackendCard): VirtualCard {
  const [expiryMonth, expiryYear] = card.expiryDate.split('/');
  return {
    id: card.id,
    currency: card.currency as CardCurrency,
    status: card.isFrozen ? 'frozen' : 'active',
    balance: card.balance,
    spendingLimit: card.spendingLimit,
    spendingUsed: 0,
    last4: card.cardNumber.slice(-4),
    pan: card.cardNumber,
    cvv: card.cvv,
    expiryMonth,
    expiryYear,
    createdAt: card.createdAt,
    channels: { online: true, atm: true, pos: true },
  };
}

interface CardState {
  cards: VirtualCard[];
  isLoading: boolean;
  fetchCards: () => Promise<void>;
  createCard: (currency: CardCurrency) => Promise<VirtualCard | null>;
  toggleFreeze: (id: string) => Promise<void>;
  setSpendingLimit: (id: string, limit: number) => Promise<void>;
}

export const useCardStore = create<CardState>()((set, get) => ({
  cards: [],
  isLoading: false,

  fetchCards: async () => {
    set({ isLoading: true });
    try {
      const backendCards = await cardService.getCards();
      const cards = backendCards.map(mapBackendCard);
      set({ cards, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createCard: async (currency) => {
    set({ isLoading: true });
    try {
      const backendCard = await cardService.createCard(currency);
      const card = mapBackendCard(backendCard);
      set((state) => ({ cards: [card, ...state.cards], isLoading: false }));
      return card;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },

  toggleFreeze: async (id) => {
    try {
      const updatedCard = await cardService.toggleFreeze(id);
      const card = mapBackendCard(updatedCard);
      set((state) => ({
        cards: state.cards.map((c) => (c.id === id ? card : c)),
      }));
    } catch {}
  },

  setSpendingLimit: async (id, limit) => {
    try {
      const updatedCard = await cardService.updateSettings(id, { spendingLimit: limit });
      const card = mapBackendCard(updatedCard);
      set((state) => ({
        cards: state.cards.map((c) => (c.id === id ? card : c)),
      }));
    } catch {}
  },
}));
