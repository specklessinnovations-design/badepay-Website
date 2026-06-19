import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction } from '@/mock/transactions';
import { useAuthStore } from './useAuthStore';

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'date' | 'status'>) => Transaction;
}

function withUserContext(tx: Omit<Transaction, 'id' | 'date' | 'status'>): Omit<Transaction, 'id' | 'date' | 'status'> {
  const user = useAuthStore.getState().user;
  if (!user) return tx;
  return {
    ...tx,
    userId: tx.userId ?? user.id,
    userEmail: tx.userEmail ?? user.email,
    userName: tx.userName ?? `${user.firstName} ${user.lastName}`.trim(),
    reference: tx.reference ?? `REF-${Date.now().toString(36).toUpperCase()}`,
  };
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: [],

      addTransaction: (tx) => {
        const enriched = withUserContext(tx);
        const newTx: Transaction = {
          ...enriched,
          id: 'TXN' + Date.now().toString().slice(-8),
          date: new Date().toISOString(),
          status: 'success',
        };
        set((state) => ({ transactions: [newTx, ...state.transactions] }));
        return newTx;
      },
    }),
    { name: 'badepay_transactions' }
  )
);
