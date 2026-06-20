/**
 * BadePay Transaction Service
 * Connects to the real backend API for transaction history and transfer operations.
 */

import apiClient from '@/lib/apiClient';

export const transactionService = {
  /**
   * Get paginated transaction list.
   * Backend: GET /transactions?page=&limit=&type=&status=
   */
  getAll: async (params?: { page?: number; limit?: number; type?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    const resp = await apiClient.get(`/transactions${qs ? '?' + qs : ''}`);
    return resp?.data || { transactions: [], pagination: {} };
  },

  /**
   * Get a single transaction by ID.
   * Backend: GET /transactions/:id
   */
  getById: async (id: string) => {
    const resp = await apiClient.get(`/transactions/${id}`);
    return resp?.data?.transaction || resp?.data || null;
  },

  /**
   * Get monthly spending stats (derived from transaction list).
   */
  getMonthlyStats: async () => {
    const data = await transactionService.getAll({ limit: 200 });
    const txs = data?.transactions || [];
    const now = new Date();
    const thisMonth = txs.filter((t: any) => {
      const d = new Date(t.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = thisMonth
      .filter((t: any) => t.type === 'funding' || t.type === 'p2p_receive')
      .reduce((s: number, t: any) => s + Number(t.amount), 0);
    const expenses = thisMonth
      .filter((t: any) => t.type !== 'funding' && t.type !== 'p2p_receive')
      .reduce((s: number, t: any) => s + Number(t.amount), 0);
    return { income, expenses, transactions: thisMonth };
  },

  /**
   * Report / export transactions (returns all for download).
   */
  report: async () => transactionService.getAll({ limit: 500 }),
};

export const transferService = {
  /**
   * Look up a BadePay user by account number or phone.
   * Backend: POST /transfers/resolve-account  (for bank accounts)
   * or GET /users/lookup?q=  (for BadePay users)
   */
  lookup: async (query: string) => {
    try {
      const resp = await apiClient.get(`/users/me`); // fallback — replace with real lookup endpoint when available
      return resp?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Resolve a bank account number.
   * Backend: POST /transfers/resolve-account
   */
  resolveAccount: async (accountNumber: string, bankCode: string) => {
    const resp = await apiClient.post('/transfers/resolve-account', { accountNumber, bankCode });
    return resp?.data || null;
  },

  /**
   * Get list of Nigerian banks.
   * Backend: GET /transfers/banks
   */
  getBanks: async () => {
    const resp = await apiClient.get('/transfers/banks');
    return resp?.data?.banks || resp?.data || [];
  },

  /**
   * Initiate a P2P or bank transfer.
   * Backend: POST /transfers/initiate
   */
  send: async (payload: {
    type: 'p2p' | 'bank';
    amount: number;
    pin: string;
    recipientAccountNumber?: string;
    accountNumber?: string;
    bankCode?: string;
    narration?: string;
  }) => {
    const resp = await apiClient.post('/transfers/initiate', payload);
    return resp?.data || resp;
  },

  /**
   * QR scan-to-pay.
   * Backend: POST /qr/pay
   */
  scanPay: async (payload: { merchantSlug: string; amount: number; pin: string }) => {
    const resp = await apiClient.post('/qr/pay', payload);
    return resp?.data || resp;
  },

  /**
   * Get receipt / transaction detail.
   * Backend: GET /transactions/:id
   */
  getReceipt: async (id: string) => {
    return transactionService.getById(id);
  },
};

export const billsService = {
  /**
   * Get bill categories (static list — no backend endpoint needed).
   */
  getCategories: async () => ['airtime', 'data', 'electricity', 'cable'],

  /**
   * Get providers for a category (static).
   */
  getProviders: async (category: string) => {
    const providers: Record<string, string[]> = {
      airtime: ['MTN', 'Airtel', 'Glo', '9mobile'],
      data: ['MTN', 'Airtel', 'Glo', '9mobile'],
      electricity: ['IKEDC', 'EKEDC', 'PHED', 'AEDC', 'BEDC', 'JEDC'],
      cable: ['DSTV', 'GOtv', 'Startimes'],
    };
    return providers[category] || [];
  },

  /**
   * Validate a meter/smart card number.
   * Backend: POST /bills/validate (if available) — currently returns mock.
   */
  validate: async (_payload: any) => ({ customerName: 'Customer' }),

  /**
   * Pay a bill.
   * Backend: POST /bills/airtime | /bills/data | /bills/electricity | /bills/cable
   */
  pay: async (category: string, payload: any) => {
    const resp = await apiClient.post(`/bills/${category}`, payload);
    return resp?.data || resp;
  },

  /**
   * Get bill payment history (from transactions).
   */
  getHistory: async () => {
    const data = await transactionService.getAll({ type: 'bills' });
    return data?.transactions || [];
  },
};
