/**
 * BadePay KYC Service: GET /kyc/status. Submissions are made from the KYC and Verify BVN pages
 * (POST /kyc/bvn with dateOfBirth, POST /kyc/nin with a selfie).
 */
import apiClient from '@/lib/apiClient';

export const kycService = {
  status: async () => apiClient.get('/kyc/status'),
};

export default kycService;
