/**
 * BadePay Bills Service
 * Connects to the real backend API for bill payments.
 */
import apiClient from '@/lib/apiClient';

export interface BillValidation {
  accountNumber: string;
  accountName: string;
  provider: string;
  billType: string;
}

export interface BillPurchaseResponse {
  transaction: any;
  token?: string;
}

export const billsService = {
  /**
   * Validate bill account.
   * Backend: POST /bills/validate
   */
  validateAccount: async (accountNumber: string, provider: string, billType: string): Promise<BillValidation> => {
    const resp = await apiClient.post('/bills/validate', { accountNumber, provider, billType });
    return resp?.data?.data ?? resp?.data;
  },

  /**
   * Purchase airtime.
   * Backend: POST /bills/airtime
   */
  purchaseAirtime: async (payload: any): Promise<BillPurchaseResponse> => {
    const resp = await apiClient.post('/bills/airtime', payload);
    return resp?.data?.data ?? resp?.data;
  },

  /**
   * Purchase data.
   * Backend: POST /bills/data
   */
  purchaseData: async (payload: any): Promise<BillPurchaseResponse> => {
    const resp = await apiClient.post('/bills/data', payload);
    return resp?.data?.data ?? resp?.data;
  },

  /**
   * Purchase electricity.
   * Backend: POST /bills/electricity
   */
  payElectricity: async (payload: any): Promise<BillPurchaseResponse> => {
    const resp = await apiClient.post('/bills/electricity', payload);
    return resp?.data?.data ?? resp?.data;
  },

  /**
   * Purchase cable TV.
   * Backend: POST /bills/cable
   */
  /**
   * Purchase cable TV.
   * Backend: POST /bills/cable
   */
  payCable: async (payload: any): Promise<BillPurchaseResponse> => {
    const resp = await apiClient.post('/bills/cable', payload);
    return resp?.data?.data ?? resp?.data;
  },

  /**
   * Pay a generic bill (e.g. betting, transport, healthcare, tax, etc.)
   * Backend: POST /bills/:category
   */
  payGenericBill: async (category: string, payload: any): Promise<any> => {
    const resp = await apiClient.post(`/bills/${category}`, payload);
    return resp?.data?.data ?? resp?.data;
  },
};

export default billsService;
