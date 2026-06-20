/**
 * BadePay KYC Service
 * Connects to the real backend API for KYC verification.
 */
import apiClient from '@/lib/apiClient';

export const kycService = {
  status: async () => apiClient.get('/kyc/status'),
  verifyTier2: async (payload: any) => apiClient.post('/kyc/tier2', payload),
  verifyTier3: async (formData: FormData) => apiClient.postForm('/kyc/tier3', formData),
};

export default kycService;
