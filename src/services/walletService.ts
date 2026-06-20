/**
 * BadePay Wallet Service
 * Connects to the real backend API for wallet operations.
 */

import apiClient from '@/lib/apiClient';

export const walletService = {
  /**
   * Get wallet balance.
   * Backend: GET /wallet/balance
   */
  getBalance: async (): Promise<{ balance: number; ledgerBalance: number; currency: string; isLocked: boolean }> => {
    const resp = await apiClient.get('/wallet/balance');
    return resp?.data || { balance: 0, ledgerBalance: 0, currency: 'NGN', isLocked: false };
  },

  /**
   * Initialise a Paystack funding session.
   * Backend: POST /wallet/fund
   * Returns: { authorizationUrl, reference }
   */
  fund: async (amount: number, _providerData?: any): Promise<{ authorizationUrl: string; reference: string }> => {
    const resp = await apiClient.post('/wallet/fund', { amount });
    return resp?.data || resp;
  },

  /**
   * Verify a Paystack funding transaction by reference (URL param).
   * Backend: POST /wallet/fund/verify/:reference
   */
  verifyFunding: async (reference: string): Promise<any> => {
    const resp = await apiClient.post(`/wallet/fund/verify/${reference}`);
    return resp?.data || resp;
  },

  /**
   * Verify a Paystack funding transaction by reference (body).
   * Backend: POST /wallet/fund/verify
   */
  verifyFundingFromBody: async (reference: string): Promise<any> => {
    const resp = await apiClient.post('/wallet/fund/verify', { reference });
    return resp?.data || resp;
  },

  /**
   * Legacy alias kept for compatibility.
   */
  topUp: async (amount?: number): Promise<any> => {
    if (!amount) return { reference: '', status: 'error' };
    return walletService.fund(amount);
  },

  /**
   * Withdraw to a linked bank account.
   * Backend: POST /transfers/initiate  (type: 'bank')
   */
  withdraw: async (payload: {
    amount: number;
    accountNumber: string;
    bankCode: string;
    narration?: string;
  }): Promise<any> => {
    const resp = await apiClient.post('/transfers/initiate', {
      type: 'bank',
      amount: payload.amount,
      accountNumber: payload.accountNumber,
      bankCode: payload.bankCode,
      narration: payload.narration,
    });
    return resp?.data || resp;
  },
};

export default walletService;
