import apiClient from '@/lib/apiClient';

export const qrService = {
  generate: async (payload: any) => apiClient.post('/qr/generate', payload),
  scan: async (payload: any) => apiClient.post('/qr/scan', payload),
  pay: async (payload: any) => apiClient.post('/qr/pay', payload),
};

export default qrService;
