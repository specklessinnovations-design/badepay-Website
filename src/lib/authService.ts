import apiClient from './apiClient';

export const authService = {
  signup: async (data: any) => {
    return apiClient.post('/auth/signup', data);
  },

  sendOtp: async (phone: string) => {
    return apiClient.post('/auth/send-otp', { phone });
  },

  verifyOtp: async (phone: string, otp: string) => {
    const resp = await apiClient.post('/auth/verify-otp', { phone, otp });
    if (resp && resp.data) {
      const { accessToken, refreshToken } = resp.data.tokens || resp.tokens || {};
      if (accessToken || refreshToken) apiClient.setTokens(accessToken, refreshToken);
    }
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
