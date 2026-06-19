import apiClient from '@/lib/apiClient';

export const billsService = {
  purchaseAirtime: async (payload: any) => apiClient.post('/bills/airtime', payload),
  purchaseData: async (payload: any) => apiClient.post('/bills/data', payload),
  payElectricity: async (payload: any) => apiClient.post('/bills/electricity', payload),
  payCable: async (payload: any) => apiClient.post('/bills/cable', payload),
};

export default billsService;
