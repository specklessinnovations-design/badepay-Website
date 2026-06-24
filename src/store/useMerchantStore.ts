import { create } from 'zustand';
import merchantService, { type MerchantPayment, type MerchantSettlement } from '@/services/merchantService';

interface MerchantState {
  payments: MerchantPayment[];
  settlements: MerchantSettlement[];
  isLoading: boolean;
  fetchPayments: () => Promise<void>;
  fetchSettlements: () => Promise<void>;
  recordPayment: (merchantUserId: string, customerName: string, amount: number) => boolean;
}

export const useMerchantStore = create<MerchantState>()((set, get) => ({
  payments: [],
  settlements: [],
  isLoading: false,

  fetchPayments: async () => {
    set({ isLoading: true });
    try {
      const payments = await merchantService.getPayments();
      set({ payments, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchSettlements: async () => {
    set({ isLoading: true });
    try {
      const settlements = await merchantService.getSettlements();
      set({ settlements, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  recordPayment: (merchantUserId, customerName, amount) => {
    if (amount <= 0) return false;

    const payment: MerchantPayment = {
      id: `mp_${Date.now()}`,
      amount,
      customerName,
      status: 'success',
      reference: `REF-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ payments: [payment, ...state.payments] }));

    return true;
  },
}));
