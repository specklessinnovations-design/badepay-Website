/**
 * Legacy auth helpers — kept for backward compatibility.
 * Prefer `@/services/authService` for all new code.
 */
import apiClient from './apiClient';

export const authService = {
  signup: async (data: any) => {
    return apiClient.post('/auth/register', data);
  },

  sendOtp: async (email: string) => {
    return apiClient.post('/auth/otp/send', { email: email.trim().toLowerCase() });
  },

  verifyOtp: async (email: string, otp: string) => {
    const resp = await apiClient.post('/auth/otp/verify', { email: email.trim().toLowerCase(), otp });
    const { accessToken, refreshToken } = resp?.data?.tokens || resp?.tokens || {};
    if (accessToken || refreshToken) apiClient.setTokens(accessToken, refreshToken);
    return resp;
  },

  refresh: async () => {
    return apiClient.post('/auth/refresh', { refreshToken: apiClient.getRefreshToken() });
  },

  logout: async () => {
    await apiClient.post('/auth/logout', { refreshToken: apiClient.getRefreshToken() });
    apiClient.setTokens(null, null);
  },
};

export default authService;
