import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '@/services/authService';
import type { StoredUser } from '@/services/authService';

export interface MerchantPayment {
  id: string;
  customerName: string;
  amount: number;
  date: string;
  status: 'success' | 'pending' | 'failed';
  reference: string;
}

export interface MerchantSettlement {
  id: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'processing';
  reference: string;
}

interface MerchantState {
  payments: MerchantPayment[];
  settlements: MerchantSettlement[];
  recordPayment: (merchantUserId: string, customerName: string, amount: number) => boolean;
}

export const useMerchantStore = create<MerchantState>()(
  persist(
    (set) => ({
      payments: [],
      settlements: [],

      recordPayment: (merchantUserId, customerName, amount) => {
        if (amount <= 0) return false;

        const payment: MerchantPayment = {
          id: `mp_${Date.now()}`,
          customerName,
          amount,
          date: new Date().toISOString(),
          status: 'success',
          reference: `REF-${Date.now().toString(36).toUpperCase()}`,
        };

        set((state) => ({ payments: [payment, ...state.payments] }));

        authService.updateUserBalance(merchantUserId, amount).catch(() => {});

        const merchant = authService.getUserById(merchantUserId);
        if (merchant?.merchantProfile?.payoutPreference === 'daily') {
          const settlement: MerchantSettlement = {
            id: `ms_${Date.now()}`,
            amount,
            date: new Date().toISOString(),
            status: 'pending',
            reference: payment.reference,
          };
          set((state) => ({ settlements: [settlement, ...state.settlements] }));
        }

        return true;
      },
    }),
    {
      name: 'badepay_merchant',
      partialize: (state) => ({ payments: state.payments, settlements: state.settlements }),
    }
  )
);

export function findMerchantByScanTarget(nameOrSlug: string): StoredUser | null {
  const users = authService.listUsers();
  const normalized = nameOrSlug.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const user of users) {
    if (user.userType !== 'merchant' || !user.merchantProfile?.onboardingComplete) continue;
    const profile = user.merchantProfile;
    const slug = profile.qrSlug.toLowerCase();
    const trading = profile.tradingName.toLowerCase();
    const business = profile.businessName.toLowerCase();
    if (
      slug === normalized ||
      trading.replace(/[^a-z0-9]/g, '') === normalized ||
      business.replace(/[^a-z0-9]/g, '') === normalized ||
      trading === nameOrSlug.toLowerCase() ||
      business === nameOrSlug.toLowerCase()
    ) {
      return user;
    }
  }
  return null;
}
