/**
 * BadePay Transaction Store
 * Fetches transactions from the real backend API.
 */
import { create } from 'zustand';
import apiClient from '@/lib/apiClient';

export interface Transaction {
  id: string;
  name?: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'success' | 'pending' | 'failed';
  date: string;
  description?: string;
  category?: string;
  reference?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  recipientName?: string;
  senderName?: string;
  narration?: string;
  createdAt?: string;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  fetchTransactions: (params?: { page?: number; limit?: number; type?: string; status?: string }) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'date' | 'status'>) => Transaction;
}

function mapTransaction(t: any): Transaction {
  const isCredit =
    t.type === 'credit' ||
    t.type === 'funding' ||
    t.type === 'p2p_receive' ||
    t.direction === 'credit';
  return {
    id: t.id || t._id || '',
    name: t.recipientName || t.senderName || t.name || t.description || '',
    amount: Number(t.amount || 0),
    type: isCredit ? 'credit' : 'debit',
    status: t.status === 'completed' ? 'success' : (t.status || 'success'),
    date: t.createdAt || t.date || new Date().toISOString(),
    description: t.narration || t.description || '',
    category: t.category || t.type || '',
    reference: t.reference || '',
    userId: t.userId || t.senderId || '',
    recipientName: t.recipientName,
    senderName: t.senderName,
    narration: t.narration,
    createdAt: t.createdAt,
  };
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  isLoading: false,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },

  fetchTransactions: async (params = {}) => {
    if (!apiClient.getAccessToken()) return;
    set({ isLoading: true });
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.type) query.set('type', params.type);
      if (params.status) query.set('status', params.status);
      const qs = query.toString();
      const resp = await apiClient.get(`/transactions${qs ? '?' + qs : ''}`);
      const raw = resp?.data?.transactions || resp?.data || [];
      const transactions = Array.isArray(raw) ? raw.map(mapTransaction) : [];
      const pagination = resp?.data?.pagination || { page: 1, limit: 20, total: transactions.length, totalPages: 1 };
      set({ transactions, pagination, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addTransaction: (tx) => {
    const newTx: Transaction = {
      ...tx,
      id: 'TXN' + Date.now().toString().slice(-8),
      date: new Date().toISOString(),
      status: 'success',
    };
    set((state) => ({ transactions: [newTx, ...state.transactions] }));
    return newTx;
  },
}));

export default useTransactionStore;
