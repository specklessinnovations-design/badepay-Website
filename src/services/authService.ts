/**
 * BadePay Auth Service
 * Connects to the real BadePay backend REST API for all authentication operations.
 * Auth is now email-based (OTP delivered via Resend email).
 */

import apiClient from '@/lib/apiClient';
import type { MerchantProfile } from '@/types/merchant';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string;
  email: string;
  phone?: string; // Optional — kept for KYC/profile display
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
    phone: raw.phone || undefined,
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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

function extractUser(resp: any): any {
  return resp?.data?.user || resp?.user || resp?.data || {};
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Login with email + password.
   * Backend endpoint: POST /auth/login
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const resp = await apiClient.post('/auth/login', { email: normalizeEmail(email), password });
    const { token, refreshToken } = extractTokens(resp);
    if (token) apiClient.setTokens(token, refreshToken);
    return { user: mapBackendUser(extractUser(resp)), token, refreshToken };
  },

  /**
   * Register a new user.
   * Backend endpoint: POST /auth/register
   */
  register: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    userType: 'consumer' | 'merchant';
    businessName?: string;
    tradingName?: string;
    businessType?: string;
    category?: string;
    address?: string;
  }): Promise<AuthResponse & { pinId?: string }> => {
    const resp = await apiClient.post('/auth/register', {
      ...data,
      email: normalizeEmail(data.email),
    });
    const { token, refreshToken } = extractTokens(resp);
    if (token) apiClient.setTokens(token, refreshToken);
    return {
      user: mapBackendUser(extractUser(resp)),
      token,
      refreshToken,
      pinId: resp?.data?.pinId,
    };
  },

  /**
   * Send OTP to email address.
   * Backend endpoint: POST /auth/otp/send
   */
  sendOTP: async (email: string): Promise<{ pinId?: string }> => {
    const resp = await apiClient.post('/auth/otp/send', { email: normalizeEmail(email) });
    return { pinId: resp?.data?.pinId || resp?.pinId };
  },

  /** Alias for sendOTP — used by resend buttons */
  resendOTP: async (email: string): Promise<{ pinId?: string }> => {
    const resp = await apiClient.post('/auth/otp/send', { email: normalizeEmail(email) });
    return { pinId: resp?.data?.pinId || resp?.pinId };
  },

  /**
   * Verify OTP code sent to email.
   * Backend endpoint: POST /auth/otp/verify
   */
  verifyOTP: async (email: string, otp: string): Promise<AuthResponse> => {
    const resp = await apiClient.post('/auth/otp/verify', { email: normalizeEmail(email), otp });
    const { token, refreshToken } = extractTokens(resp);
    if (token) apiClient.setTokens(token, refreshToken);
    return { user: mapBackendUser(extractUser(resp)), token, refreshToken };
  },

  /**
   * Forgot password — sends reset OTP to email.
   * Backend endpoint: POST /auth/forgot-password
   */
  forgotPassword: async (email: string): Promise<{ pinId?: string }> => {
    const resp = await apiClient.post('/auth/forgot-password', { email: normalizeEmail(email) });
    return { pinId: resp?.data?.pinId || resp?.pinId };
  },

  /**
   * Reset password using email + OTP from Resend.
   * Backend endpoint: POST /auth/reset-password
   */
  resetPassword: async (email: string, otp: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', {
      email: normalizeEmail(email),
      otp,
      newPassword,
    });
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
   * Update profile (name / phone).
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
   */
  revokeSessions: async (keepCurrentSession?: boolean): Promise<void> => {
    const refreshToken = apiClient.getRefreshToken();
    await apiClient.post('/auth/sessions/revoke', { keepCurrentSession, refreshToken });
  },

  /**
   * Revoke specific session.
   */
  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  // ── Two-Factor Authentication (TOTP) ─────────────────────────────────────

  get2FAStatus: async (): Promise<{ twoFactorActive: boolean }> => {
    const resp = await apiClient.get('/auth/2fa/status');
    return resp?.data || { twoFactorActive: false };
  },

  setup2FA: async (): Promise<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }> => {
    const resp = await apiClient.post('/auth/2fa/setup');
    return resp?.data || {};
  },

  enable2FA: async (code: string): Promise<void> => {
    await apiClient.post('/auth/2fa/enable', { code });
  },

  verify2FA: async (code: string): Promise<void> => {
    await apiClient.post('/auth/2fa/verify', { code });
  },

  disable2FA: async (code: string, password: string): Promise<void> => {
    await apiClient.post('/auth/2fa/disable', { code, password });
  },

  /**
   * Complete merchant onboarding.
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

export async function getUserById(_id: string) {
  try {
    const resp = await apiClient.get('/users/me');
    const rawUser = resp?.data?.user || resp?.data || resp?.user || {};
    return {
      id: rawUser.id || '',
      email: rawUser.email || '',
      phone: rawUser.phone || undefined,
      firstName: rawUser.firstName || '',
      lastName: rawUser.lastName || '',
      userType: rawUser.userType || 'consumer',
      createdAt: rawUser.createdAt || new Date().toISOString(),
      balance: Number(rawUser.balance ?? rawUser.wallet?.balance ?? 0),
      kycLevel: (rawUser.kycLevel ?? 0) as 0 | 1 | 2 | 3,
      kycStatus: rawUser.kycStatus || 'pending',
      isActive: rawUser.isActive !== false,
    };
  } catch {
    return null;
  }
}

// Attach to authService for compatibility
(authService as any).getUserById = getUserById;
