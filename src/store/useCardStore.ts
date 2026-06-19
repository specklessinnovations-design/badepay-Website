import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore';
import { useTransactionStore } from './useTransactionStore';
import { authService } from '@/services/authService';

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

interface CardState {
  cards: VirtualCard[];
  createCard: (currency: CardCurrency) => VirtualCard;
  toggleFreeze: (id: string) => void;
  fundCard: (id: string, amount: number) => boolean;
  setSpendingLimit: (id: string, limit: number) => void;
  setCardPin: (id: string, pin: string) => void;
  updateChannels: (id: string, channels: Partial<CardChannels>) => void;
  recordCardSpend: (id: string, amount: number) => boolean;
}

function generatePan(): string {
  const prefix = '4532';
  let rest = '';
  for (let i = 0; i < 12; i++) rest += Math.floor(Math.random() * 10);
  return prefix + rest;
}

function generateCvv(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

function generateLast4(pan: string): string {
  return pan.slice(-4);
}

function deductWallet(amount: number): boolean {
  const user = useAuthStore.getState().user;
  if (!user || amount <= 0 || amount > user.balance) return false;
  const newBal = user.balance - amount;
  useAuthStore.setState({ user: { ...user, balance: newBal } });
  authService.updateUserBalance(user.id, -amount).catch(() => {});
  return true;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      cards: [],

      createCard: (currency) => {
        const now = new Date();
        const pan = generatePan();
        const card: VirtualCard = {
          id: `card_${Date.now()}`,
          currency,
          status: 'active',
          balance: 0,
          spendingLimit: currency === 'NGN' ? 500000 : 5000,
          spendingUsed: 0,
          pan,
          cvv: generateCvv(),
          last4: generateLast4(pan),
          expiryMonth: String(now.getMonth() + 1).padStart(2, '0'),
          expiryYear: String(now.getFullYear() + 3).slice(-2),
          createdAt: now.toISOString(),
          channels: { online: true, atm: true, pos: true },
        };
        set((state) => ({ cards: [...state.cards, card] }));
        return card;
      },

      toggleFreeze: (id) => {
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === id
              ? { ...c, status: c.status === 'active' ? ('frozen' as const) : ('active' as const) }
              : c
          ),
        }));
      },

      fundCard: (id, amount) => {
        if (amount <= 0) return false;
        const card = get().cards.find((c) => c.id === id);
        if (!card || card.status === 'frozen') return false;
        if (!deductWallet(amount)) return false;

        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === id ? { ...c, balance: c.balance + amount } : c
          ),
        }));

        useTransactionStore.getState().addTransaction({
          name: `${card.currency} Virtual Card`,
          amount,
          type: 'debit',
          category: 'transfer',
          description: `Funded virtual card •••• ${card.last4}`,
        });

        return true;
      },

      setSpendingLimit: (id, limit) => {
        if (limit <= 0) return;
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, spendingLimit: limit } : c)),
        }));
      },

      setCardPin: (id, pin) => {
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, pin } : c)),
        }));
      },

      updateChannels: (id, channels) => {
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === id ? { ...c, channels: { ...c.channels, ...channels } } : c
          ),
        }));
      },

      recordCardSpend: (id, amount) => {
        const card = get().cards.find((c) => c.id === id);
        if (!card || card.status === 'frozen' || amount <= 0 || amount > card.balance) return false;
        if (card.spendingUsed + amount > card.spendingLimit) return false;

        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === id
              ? { ...c, balance: c.balance - amount, spendingUsed: c.spendingUsed + amount }
              : c
          ),
        }));
        return true;
      },
    }),
    {
      name: 'badepay_cards',
      partialize: (state) => ({ cards: state.cards }),
    }
  )
);
