import apiClient from '@/lib/apiClient';

export interface Bank {
  code: string;
  name: string;
}

export interface AccountResolution {
  accountNumber: string;
  accountName: string;
}

export interface TransferRequest {
  type: 'p2p' | 'bank';
  amount: number;
  pin: string;
  recipientAccountNumber?: string;
  accountNumber?: string;
  bankCode?: string;
  narration?: string;
}

export interface Transaction {
  id: string;
  reference: string;
  senderId: string;
  recipientId?: string;
  walletId: string;
  amount: number;
  type: string;
  category: string;
  status: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

const transferService = {
  /**
   * Get list of banks.
   * Backend: GET /transfers/banks
   */
  getBanks: async (): Promise<Bank[]> => {
    const resp = await apiClient.get('/transfers/banks');
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    return resp?.data?.data?.banks ?? resp?.data?.banks ?? [];
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
  },

  /**
   * Resolve account number to account name.
   * Backend: POST /transfers/resolve-account
   */
  resolveAccount: async (accountNumber: string, bankCode: string): Promise<AccountResolution> => {
    const resp = await apiClient.post('/transfers/resolve-account', { accountNumber, bankCode });
    return resp?.data?.data ?? resp?.data;
  },

  /**
   * Initiate a transfer (P2P or bank).
   * Backend: POST /transfers/initiate
   */
  initiateTransfer: async (data: TransferRequest): Promise<Transaction> => {
    const resp = await apiClient.post('/transfers/initiate', data);
    return resp?.data?.data?.transaction ?? resp?.data?.transaction ?? resp?.data;
  },

  /**
   * Get transfer history.
   * Backend: GET /transfers/history
   */
  getHistory: async (): Promise<Transaction[]> => {
    const resp = await apiClient.get('/transfers/history');
    return resp?.data?.data ?? resp?.data ?? [];
  },
};

export default transferService;
