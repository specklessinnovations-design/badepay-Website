// FRONTEND-ONLY MODE: transactionService is stubbed.
import { mockTransactions } from '@/mock/transactions';

export const transactionService = {
  getAll: async () => ({ data: mockTransactions }),
  getById: async () => mockTransactions[0],
  getMonthlyStats: async () => ({}),
  report: async () => ({}),
};

export const transferService = {
  lookup: async () => ({ id: 'mock-id', fullName: 'Mock User', accountNumber: '1234567890' }),
  send: async () => ({ reference: 'REF-MOCK', status: 'success' }),
  scanPay: async () => ({ reference: 'REF-MOCK', status: 'success' }),
  getReceipt: async () => ({}),
};

export const billsService = {
  getCategories: async () => [],
  getProviders: async () => [],
  validate: async () => ({ customerName: 'Mock Customer' }),
  pay: async () => ({ reference: 'REF-MOCK', status: 'success' }),
  getHistory: async () => [],
};
