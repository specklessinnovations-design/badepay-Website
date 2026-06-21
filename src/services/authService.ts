/**
 * BadePay Auth Service
 * Connects to the real BadePay backend REST API for all authentication operations.
 * Replaces the previous localStorage-only mock implementation.
 */

import apiClient from '@/lib/apiClient';
import type { MerchantProfile } from '@/types/merchant';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password?: string; // never returned by backend; kept for type compat
  userType: 'consumer' | 'merchant';
  createdAt: string;
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
  balance: number;
  transactionPin?: string;
  kycLevel: 0 | 1 | 2 | 3;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  biometricEnabled?: boolean;
  username?: string;
  twoFactorEnabled?: boolean;
  merchantProfile?: MerchantProfile;
  isActive?: boolean;
  avatar?: string;
  lastLogin?: string;
  bvnVerified?: boolean;
  ninVerified?: boolean;
  kycSubmittedAt?: string;
}

export interface AuthResponse {
  user: StoredUser;
  token: string;
  refreshToken: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapBackendUser(raw: any): StoredUser {
  return {
    id: raw.id || raw._id || '',
    email: raw.email || '',
    phone: raw.phone || '',
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    userType: raw.userType || 'consumer',
    createdAt: raw.createdAt || new Date().toISOString(),
    accountNumber: raw.accountNumber || raw.account_number || '',
    bankName: raw.bankName || 'BadePay Bank',
    accountName: raw.accountName || `${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
    balance: Number(raw.balance ?? raw.wallet?.balance ?? 0),
    kycLevel: (raw.kycLevel ?? 0) as 0 | 1 | 2 | 3,
    kycStatus: raw.kycStatus || 'pending',
    bvnVerified: raw.bvnVerified || false,
    ninVerified: raw.ninVerified || false,
    twoFactorEnabled: raw.twoFactorEnabled || false,
    isActive: raw.isActive !== false,
    avatar: raw.avatar || undefined,
    lastLogin: raw.lastLogin || undefined,
    kycSubmittedAt: raw.kycSubmittedAt || undefined,
    merchantProfile: raw.merchantProfile || undefined,
  };
}

function extractTokens(resp: any): { token: string; refreshToken: string } {
  const token =
    resp?.accessToken ||
    resp?.tokens?.accessToken ||
    resp?.data?.tokens?.accessToken ||
    resp?.data?.accessToken ||
    '';
  const refreshToken =
    resp?.refreshToken ||
    resp?.tokens?.refreshToken ||
    resp?.data?.tokens?.refreshToken ||
    resp?.data?.refreshToken ||
    '';
  return { token, refreshToken };
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Login with phone + password.
   * Backend endpoint: POST /auth/login
   */
  login: async (phone: string, password: string): Promise<AuthResponse> => {
    const resp = await apiClient.post('/auth/login', { phone, password });
    const { token, refreshToken } = extractTokens(resp);
    if (token) apiClient.setTokens(token, refreshToken);
    const rawUser = resp?.data?.user || resp?.user || resp?.data || {};
    return { user: mapBackendUser(rawUser), token, refreshToken };
  },

  /**
   * Register a new user.
   * Backend endpoint: POST /auth/register
   */
  register: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    userType: 'consumer' | 'merchant';
    businessName?: string;
    tradingName?: string;
    businessType?: string;
    category?: string;
    address?: string;
  }): Promise<AuthResponse> => {
    const resp = await apiClient.post('/auth/register', data);
    const { token, refreshToken } = extractTokens(resp);
    if (token) apiClient.setTokens(token, refreshToken);
    const rawUser = resp?.data?.user || resp?.user || resp?.data || {};
    return { user: mapBackendUser(rawUser), token, refreshToken };
  },

  /**
   * Send OTP to phone number.
   * Backend endpoint: POST /auth/otp/send (alias: /auth/send-otp)
   */
  sendOTP: async (phone: string): Promise<void> => {
    await apiClient.post('/auth/otp/send', { phone });
  },

  /**
   * Verify OTP code.
   * Backend endpoint: POST /auth/otp/verify (alias: /auth/verify-otp)
   */
  verifyOTP: async (phone: string, otp: string): Promise<AuthResponse> => {
    const resp = await apiClient.post('/auth/otp/verify', { phone, otp });
    const { token, refreshToken } = extractTokens(resp);
    if (token) apiClient.setTokens(token, refreshToken);
    const rawUser = resp?.user || resp?.data?.user || {};
    return { user: mapBackendUser(rawUser), token, refreshToken };
  },

  /**
   * Forgot password - sends reset code via SMS.
   * Backend endpoint: POST /auth/forgot-password
   */
  forgotPassword: async (phone: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { phone });
  },

  /**
   * Reset password using token.
   * Backend endpoint: POST /auth/reset-password
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  /**
   * Logout — invalidates the refresh token on the server.
   * Backend endpoint: POST /auth/logout
   */
  logout: async (): Promise<void> => {
    const refreshToken = apiClient.getRefreshToken();
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore errors on logout
    } finally {
      apiClient.setTokens(null, null);
    }
  },

  /**
   * Refresh access token.
   * Backend endpoint: POST /auth/refresh
   */
  refreshToken: async (): Promise<{ token: string; refreshToken: string }> => {
    const refreshToken = apiClient.getRefreshToken();
    const resp = await apiClient.post('/auth/refresh', { refreshToken });
    const tokens = extractTokens(resp);
    if (tokens.token) apiClient.setTokens(tokens.token, tokens.refreshToken);
    return tokens;
  },

  /**
   * Get the current user's profile.
   * Backend endpoint: GET /users/me
   */
  getProfile: async (): Promise<StoredUser> => {
    const resp = await apiClient.get('/users/me');
    const rawUser = resp?.data?.user || resp?.data || resp?.user || {};
    // Fetch wallet balance separately and merge
    try {
      const walletResp = await apiClient.get('/wallet/balance');
      rawUser.balance = walletResp?.data?.balance ?? rawUser.balance ?? 0;
    } catch {
      // Wallet fetch failed — keep whatever balance came with the profile
    }
    return mapBackendUser(rawUser);
  },

  /**
   * Update user profile.
   * Backend endpoint: PATCH /users/me
   */
  updateUserProfile: async (data: Partial<StoredUser>): Promise<StoredUser> => {
    const resp = await apiClient.patch('/users/me', data);
    const rawUser = resp?.data?.user || resp?.data || resp?.user || {};
    return mapBackendUser(rawUser);
  },

  /**
   * Update wallet balance (local only — balance comes from backend).
   */
  updateUserBalance: async (_userId: string, _delta: number): Promise<void> => {
    // Balance is managed server-side; no client-side mutation needed.
  },

  /**
   * Set transaction PIN.
   * Backend endpoint: POST /auth/set-pin
   */
  setTransactionPIN: async (pin: string): Promise<void> => {
    await apiClient.post('/auth/set-pin', { pin });
  },

  /**
   * Verify transaction PIN.
   * Backend endpoint: POST /auth/verify-pin
   */
  verifyTransactionPIN: async (pin: string): Promise<boolean> => {
    try {
      await apiClient.post('/auth/verify-pin', { pin });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Change password.
   * Backend endpoint: POST /auth/change-password
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },

  /**
   * Update profile.
   * Backend endpoint: PATCH /auth/profile
   */
  updateProfile: async (data: { firstName?: string; lastName?: string; phone?: string }): Promise<StoredUser> => {
    const resp = await apiClient.patch('/auth/profile', data);
    const rawUser = resp?.data?.user || resp?.data || {};
    return mapBackendUser(rawUser);
  },

  /**
   * Get sessions.
   * Backend endpoint: GET /auth/sessions
   */
  getSessions: async (): Promise<any[]> => {
    const resp = await apiClient.get('/auth/sessions');
    return resp?.data || resp?.sessions || [];
  },

  /**
   * Revoke sessions.
   * Backend endpoint: DELETE /auth/sessions (using POST as workaround for body)
   */
  revokeSessions: async (keepCurrentSession?: boolean): Promise<void> => {
    const refreshToken = apiClient.getRefreshToken();
    await apiClient.post('/auth/sessions/revoke', { keepCurrentSession, refreshToken });
  },

  /**
   * Revoke specific session.
   * Backend endpoint: DELETE /auth/sessions/:id
   */
  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  // ── Two-Factor Authentication (TOTP) ─────────────────────────────────────

  /**
   * Get 2FA status.
   * Backend endpoint: GET /auth/2fa/status
   */
  get2FAStatus: async (): Promise<{ twoFactorActive: boolean }> => {
    const resp = await apiClient.get('/auth/2fa/status');
    return resp?.data || { twoFactorActive: false };
  },

  /**
   * Setup 2FA.
   * Backend endpoint: POST /auth/2fa/setup
   */
  setup2FA: async (): Promise<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }> => {
    const resp = await apiClient.post('/auth/2fa/setup');
    return resp?.data || {};
  },

  /**
   * Enable 2FA.
   * Backend endpoint: POST /auth/2fa/enable
   */
  enable2FA: async (code: string): Promise<void> => {
    await apiClient.post('/auth/2fa/enable', { code });
  },

  /**
   * Verify 2FA code.
   * Backend endpoint: POST /auth/2fa/verify
   */
  verify2FA: async (code: string): Promise<void> => {
    await apiClient.post('/auth/2fa/verify', { code });
  },

  /**
   * Disable 2FA.
   * Backend endpoint: POST /auth/2fa/disable
   */
  disable2FA: async (code: string, password: string): Promise<void> => {
    await apiClient.post('/auth/2fa/disable', { code, password });
  },

  /**
   * Complete merchant onboarding.
   * Backend endpoint: PATCH /auth/profile  (updates userType + merchant profile)
   */
  completeMerchantOnboarding: async (
    data: Omit<MerchantProfile, 'merchantId' | 'qrSlug' | 'verified' | 'onboardingComplete' | 'payoutAccount'>,
  ): Promise<void> => {
    await apiClient.patch('/auth/profile', {
      userType: 'merchant',
      businessName: data.businessName,
      tradingName: data.tradingName,
      businessType: data.businessType,
      category: data.category,
      address: data.address,
      supportPhone: data.supportPhone,
      rcNumber: data.rcNumber,
      taxId: data.taxId,
    });
  },

  /**
   * Upgrade existing consumer account to merchant.
   * Backend endpoint: PATCH /auth/profile
   */
  upgradeToMerchant: async (): Promise<void> => {
    await apiClient.patch('/auth/profile', { userType: 'merchant' });
  },

  // ── Legacy compatibility stubs ──────────────────────────────────────────────

  findUserByEmailOrPhone: (_emailOrPhone: string) => null,
  getAllUsers: () => [],
  updateUser: (_user: any) => {},
};

export default authService;

// ── Additional compatibility methods ──────────────────────────────────────────

/**
 * Get user by ID — fetches from backend profile endpoint.
 * Used by syncUserFromStorage in useAuthStore.
 */
export async function getUserById(_id: string) {
  try {
    const resp = await apiClient.get('/users/me');
    const rawUser = resp?.data?.user || resp?.data || resp?.user || {};
    return mapBackendUser(rawUser);
  } catch {
    return null;
  }
}

// Attach to authService for compatibility
(authService as any).getUserById = getUserById;
