import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useTransactionStore } from './useTransactionStore';
import { useMerchantStore } from './useMerchantStore';
import { walletService } from '@/services/walletService';
import transferService from '@/services/transferService';
import billsService from '@/services/billsService';

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isDefault: boolean;
}

interface WalletState {
  linkedBanks: BankAccount[];
  isLoading: boolean;
  deposit: (amount: number) => Promise<{ success: boolean; authorizationUrl?: string; reference?: string; error?: string }>;
  withdraw: (amount: number, bankId: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  sendMoney: (recipientAccountNumber: string, amount: number, pin: string, narration?: string) => Promise<{ success: boolean; error?: string }>;
  transferToBank: (bankName: string, accountNumber: string, bankCode: string, amount: number, pin: string, narration?: string) => Promise<{ success: boolean; error?: string }>;
  payBill: (category: string, payload: any) => Promise<{ success: boolean; error?: string }>;
  scanPay: (merchantSlug: string, amount: number, pin: string) => Promise<{ success: boolean; error?: string }>;
  addBankAccount: (bankName: string, accountNumber: string, accountName: string) => void;
  removeBankAccount: (id: string) => void;
  getBalance: () => number;
  refreshBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  linkedBanks: [],
  isLoading: false,

  getBalance: () => useAuthStore.getState().user?.balance ?? 0,

  refreshBalance: async () => {
    try {
      const balanceData = await walletService.getBalance();
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.setState({ user: { ...user, balance: balanceData.balance } });
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  },

  deposit: async (amount) => {
    if (amount <= 0) return { success: false, error: 'Invalid amount' };
    set({ isLoading: true });
    try {
      const result = await walletService.fund(amount);
      if (result.authorizationUrl) {
        return { success: true, authorizationUrl: result.authorizationUrl, reference: result.reference };
      }
      return { success: false, error: 'Failed to initiate funding' };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Funding failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  withdraw: async (amount, bankId, pin) => {
    const user = useAuthStore.getState().user;
    if (!user || amount <= 0 || amount > user.balance) {
      return { success: false, error: 'Invalid withdrawal amount' };
    }

    const bank = get().linkedBanks.find((b) => b.id === bankId) || get().linkedBanks[0];
    if (!bank) return { success: false, error: 'No bank account selected' };

    set({ isLoading: true });
    try {
      await walletService.withdraw({
        amount,
        accountNumber: bank.accountNumber.replace(/\*/g, ''),
        bankCode: bank.bankName,
        narration: 'Withdrawal',
      });
      await get().refreshBalance();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Withdrawal failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  sendMoney: async (recipientAccountNumber, amount, pin, narration) => {
    const user = useAuthStore.getState().user;
    if (!user || amount <= 0 || amount > user.balance) {
      return { success: false, error: 'Invalid transfer amount' };
    }

    set({ isLoading: true });
    try {
      await transferService.initiateTransfer({
        type: 'p2p',
        amount,
        pin,
        recipientAccountNumber,
        narration,
      });
      await get().refreshBalance();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Transfer failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  transferToBank: async (bankName, accountNumber, bankCode, amount, pin, narration) => {
    const user = useAuthStore.getState().user;
    if (!user || amount <= 0 || amount > user.balance) {
      return { success: false, error: 'Invalid transfer amount' };
    }

    set({ isLoading: true });
    try {
      await transferService.initiateTransfer({
        type: 'bank',
        amount,
        pin,
        accountNumber,
        bankCode,
        narration,
      });
      await get().refreshBalance();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Bank transfer failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  payBill: async (category, payload) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Not authenticated' };

    set({ isLoading: true });
    try {
      switch (category) {
        case 'airtime':
          await billsService.purchaseAirtime(payload);
          break;
        case 'data':
          await billsService.purchaseData(payload);
          break;
        case 'electricity':
          await billsService.payElectricity(payload);
          break;
        case 'cable':
          await billsService.payCable(payload);
          break;
        default:
          throw new Error('Invalid bill category');
      }
      await get().refreshBalance();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Bill payment failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  scanPay: async (merchantSlug, amount, pin) => {
    const user = useAuthStore.getState().user;
    if (!user || amount <= 0 || amount > user.balance) {
      return { success: false, error: 'Invalid payment amount' };
    }

    set({ isLoading: true });
    try {
      // QR payment - use transfer service with P2P to merchant
      await transferService.initiateTransfer({
        type: 'p2p',
        amount,
        pin,
        recipientAccountNumber: merchantSlug,
        narration: 'QR Payment',
      });
      await get().refreshBalance();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'QR payment failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  addBankAccount: (bankName, accountNumber, accountName) => {
    const newBank: BankAccount = {
      id: 'bank_' + Date.now(),
      bankName,
      accountName,
      accountNumber: '******' + accountNumber.slice(-4),
      isDefault: get().linkedBanks.length === 0,
    };
    set((state) => ({ linkedBanks: [...state.linkedBanks, newBank] }));
  },

  removeBankAccount: (id) => {
    set((state) => ({
      linkedBanks: state.linkedBanks.filter((b) => b.id !== id),
    }));
  },
}));
