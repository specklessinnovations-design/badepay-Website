import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useTransactionStore } from './useTransactionStore';
import { findMerchantByScanTarget, useMerchantStore } from './useMerchantStore';
import { authService } from '@/services/authService';

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isDefault: boolean;
}

interface WalletState {
  linkedBanks: BankAccount[];
  deposit: (amount: number) => boolean;
  withdraw: (amount: number, bankId: string) => boolean;
  sendMoney: (recipientName: string, amount: number, note?: string) => boolean;
  transferToBank: (bankName: string, accountNumber: string, accountName: string, amount: number) => boolean;
  payBill: (billerName: string, amount: number, category?: TransactionCategory, note?: string) => boolean;
  scanPay: (merchantName: string, amount: number) => boolean;
  addBankAccount: (bankName: string, accountNumber: string, accountName: string) => void;
  removeBankAccount: (id: string) => void;
  getBalance: () => number;
}

type TransactionCategory = 'transfer' | 'bills' | 'deposit' | 'withdrawal';

function updateBalance(delta: number): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  const newBal = user.balance + delta;
  if (newBal < 0) return false;
  useAuthStore.setState({ user: { ...user, balance: newBal } });
  authService.updateUserBalance(user.id, delta).catch(() => {});
  return true;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  linkedBanks: [],

  getBalance: () => useAuthStore.getState().user?.balance ?? 0,

  deposit: (amount) => {
    if (amount <= 0) return false;
    if (!updateBalance(amount)) return false;
    useTransactionStore.getState().addTransaction({
      name: 'Wallet top-up',
      amount,
      type: 'credit',
      category: 'deposit',
      description: 'Add money to wallet',
    });
    return true;
  },

  withdraw: (amount, bankId) => {
    const user = useAuthStore.getState().user;
    if (!user || amount <= 0 || amount > user.balance) return false;

    const bank = get().linkedBanks.find((b) => b.id === bankId) || get().linkedBanks[0];
    const destinationName = bank ? `${bank.bankName} (${bank.accountNumber})` : 'Linked bank';

    if (!updateBalance(-amount)) return false;

    useTransactionStore.getState().addTransaction({
      name: 'Bank withdrawal',
      amount,
      type: 'debit',
      category: 'withdrawal',
      description: `Transferred to ${destinationName}`,
    });
    return true;
  },

  sendMoney: (recipientName, amount, note) => {
    const user = useAuthStore.getState().user;
    if (!user || amount <= 0 || amount > user.balance) return false;
    if (!updateBalance(-amount)) return false;

    useTransactionStore.getState().addTransaction({
      name: recipientName,
      amount,
      type: 'debit',
      category: 'transfer',
      description: note || `Transfer to ${recipientName}`,
    });
    return true;
  },

  transferToBank: (bankName, accountNumber, accountName, amount) => {
    const user = useAuthStore.getState().user;
    if (!user || amount <= 0 || amount > user.balance) return false;
    if (!updateBalance(-amount)) return false;

    const masked = accountNumber.length >= 4 ? `****${accountNumber.slice(-4)}` : accountNumber;
    useTransactionStore.getState().addTransaction({
      name: accountName,
      amount,
      type: 'debit',
      category: 'transfer',
      description: `Bank transfer to ${accountName} · ${bankName} (${masked})`,
    });
    return true;
  },

  payBill: (billerName, amount, category = 'bills', note) => {
    const user = useAuthStore.getState().user;
    if (!user || amount <= 0 || amount > user.balance) return false;
    if (!updateBalance(-amount)) return false;

    useTransactionStore.getState().addTransaction({
      name: billerName,
      amount,
      type: 'debit',
      category,
      description: note || `Payment to ${billerName}`,
    });
    return true;
  },

  scanPay: (merchantName, amount) => {
    const user = useAuthStore.getState().user;
    if (!user || amount <= 0 || amount > user.balance) return false;
    if (!updateBalance(-amount)) return false;

    useTransactionStore.getState().addTransaction({
      name: merchantName,
      amount,
      type: 'debit',
      category: 'transfer',
      description: `QR payment to ${merchantName}`,
    });

    const merchant = findMerchantByScanTarget(merchantName);
    if (merchant) {
      useMerchantStore.getState().recordPayment(
        merchant.id,
        `${user.firstName} ${user.lastName}`.trim(),
        amount
      );
    }

    return true;
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
