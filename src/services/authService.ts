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
  hasPinSet?: boolean;
  pinRequirement?: 'always' | 'above_20k';
  kycLevel: 0 | 1 | 2 | 3;
  kycStatus?: 'unsubmitted' | 'pending' | 'approved' | 'rejected';
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
  /** YYYY-MM-DD, set from the verified BVN. */
  dateOfBirth?: string;
}

export interface AuthResponse {
  user: StoredUser;
  token: string;
  refreshToken: string;
}

/**
 * Sign-in can need one more step before there's a session (same as the mobile app):
 * - verifyEmail: older account with an unverified email; a code was emailed
 * - verifyDevice: first sign-in from this browser; a code was emailed
 * - twoFactor: 2FA is on; enter the authenticator code
 */
export type LoginChallenge =
  | { kind: 'verifyEmail'; email: string; pinId?: string }
  | { kind: 'verifyDevice'; email: string; pinId?: string }
  | { kind: 'twoFactor'; challengeToken: string };

export type SignInResult = { signedIn: AuthResponse } | { challenge: LoginChallenge };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapBackendUser(raw: any): StoredUser {
  return {
    id: raw.id || raw._id || '',
    email: raw.email || '',
    phone: raw.phone || undefined,
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    userType: (() => {
      const explicit = raw.userType || raw.user_type || raw.accountType || raw.account_type;
      if (explicit === 'merchant' || explicit === 'business') return 'merchant';
      if (explicit === 'consumer' || explicit === 'personal') return 'consumer';
      const hasMerchant =
        raw.merchantProfile || raw.merchant_profile || raw.merchant ||
        (raw.user && (raw.user.merchantProfile || raw.user.merchant_profile));
      return hasMerchant ? 'merchant' : 'consumer';
    })(),
    createdAt: raw.createdAt || new Date().toISOString(),
    accountNumber: raw.accountNumber || raw.account_number || '',
    bankName: raw.bankName || 'BadePay Bank',
    accountName: raw.accountName || `${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
    balance: Number(raw.balance ?? raw.wallet?.balance ?? 0),
    kycLevel: (raw.kycLevel ?? 0) as 0 | 1 | 2 | 3,
    kycStatus: raw.kycStatus || undefined, // unknown, not 'pending' (that means under review)
    bvnVerified: raw.bvnVerified || false,
    ninVerified: raw.ninVerified || false,
    twoFactorEnabled: raw.twoFactorEnabled || false,
    isActive: raw.isActive !== false,
    avatar: raw.avatar || undefined,
    lastLogin: raw.lastLogin || undefined,
    kycSubmittedAt: raw.kycSubmittedAt || undefined,
    dateOfBirth: raw.dateOfBirth ? String(raw.dateOfBirth).slice(0, 10) : undefined,
    hasPinSet: raw.hasPinSet ?? !!raw.transactionPin,
    pinRequirement: raw.pinRequirement || 'always',
    merchantProfile: (() => {
      const mp =
        raw.merchantProfile ||
        raw.merchant_profile ||
        raw.merchant ||
        (raw.user && (raw.user.merchantProfile || raw.user.merchant_profile));
      if (!mp || typeof mp !== 'object') return undefined;
      const onboardingComplete =
        mp.onboardingComplete === true ||
        mp.onboarding_complete === true ||
        mp.onboardingStatus === 'completed' ||
        mp.onboarding_status === 'completed' ||
        Boolean(mp.businessName || mp.business_name);
      return {
        ...mp,
        businessName: mp.businessName || mp.business_name || '',
        category: mp.category || mp.businessCategory || '',
        onboardingComplete,
      };
    })(),
  };
}

/** Stable id for this browser, so the backend can recognise it as a trusted device. */
export function deviceId(): string {
  const KEY = 'bp_device_id';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) { id = `web-${crypto.randomUUID()}`; localStorage.setItem(KEY, id); }
    return id;
  } catch {
    return 'web-unknown-device';
  }
}
const device = () => ({ deviceId: deviceId(), deviceName: 'BadePay Web' });

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

function signInResult(resp: any, email: string): SignInResult {
  const d = resp?.data ?? {};
  if (d.requiresTwoFactor && d.challengeToken) return { challenge: { kind: 'twoFactor', challengeToken: d.challengeToken } };
  if (d.requiresEmailVerification) return { challenge: { kind: 'verifyEmail', email, pinId: d.pinId } };
  if (d.requiresDeviceVerification) return { challenge: { kind: 'verifyDevice', email, pinId: d.pinId } };
  const { token, refreshToken } = extractTokens(resp);
  if (!token) throw new Error(resp?.message || 'Sign-in failed. Please try again.');
  apiClient.setTokens(token, refreshToken);
  return { signedIn: { user: mapBackendUser(extractUser(resp)), token, refreshToken } };
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Login with email + password.
   * Backend endpoint: POST /auth/login
   */
  login: async (email: string, password: string): Promise<SignInResult> =>
    signInResult(await apiClient.post('/auth/login', { email: normalizeEmail(email), password, ...device() }), normalizeEmail(email)),

  /** Unverified email at sign-in: the emailed code verifies it and signs in. */
  verifyEmailLogin: async (email: string, otp: string, pinId?: string): Promise<SignInResult> =>
    signInResult(await apiClient.post('/auth/login/verify-email', { email: normalizeEmail(email), otp, pinId, ...device() }), normalizeEmail(email)),

  /** New browser: the emailed code trusts it and signs in. */
  verifyDevice: async (email: string, otp: string, pinId?: string): Promise<SignInResult> =>
    signInResult(await apiClient.post('/auth/login/verify-device', { email: normalizeEmail(email), otp, pinId, ...device() }), normalizeEmail(email)),

  completeTwoFactor: async (challengeToken: string, code: string): Promise<SignInResult> =>
    signInResult(await apiClient.post('/auth/login/2fa', { challengeToken, code }), ''),

  /** Sign-up step 1: is this email free? */
  checkEmail: async (email: string): Promise<boolean> => {
    const resp = await apiClient.post('/auth/check-email', { email: normalizeEmail(email) });
    return !!resp?.data?.exists;
  },

  /** Sign-up step 2: the emailed code proves the email; returns the proof `register` needs (valid 30 minutes). */
  confirmSignupEmail: async (email: string, otp: string): Promise<string> => {
    const resp = await apiClient.post('/auth/otp/verify', { email: normalizeEmail(email), otp, ...device() });
    const proof = resp?.data?.emailVerificationToken;
    if (!proof) throw new Error('That code didn’t work. Request a new one and try again.');
    return proof;
  },

  /** Whether sign-up is invite-only right now (private pilot). */
  pilot: async (): Promise<{ inviteOnly: boolean; message: string | null }> => {
    const resp = await apiClient.get('/auth/pilot');
    return resp?.data ?? { inviteOnly: false, message: null };
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
    location?: string;
    pin?: string;
    emailVerificationToken: string;
  }): Promise<AuthResponse & { pinId?: string }> => {
    const resp = await apiClient.post('/auth/register', {
      ...data,
      email: normalizeEmail(data.email),
      ...device(),
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
   * Complete merchant onboarding for an existing consumer account.
   * Backend endpoint: POST /auth/merchant/onboard
   */
  completeMerchantOnboarding: async (data: {
    businessName: string;
    tradingName: string;
    businessType: string;
    category: string;
    address: string;
    rcNumber?: string;
    taxId?: string;
    supportPhone?: string;
    payoutPreference?: string;
  }): Promise<StoredUser> => {
    // The backend re-issues the session as a merchant (merchant routes check the token).
    const resp = await apiClient.post('/auth/merchant/onboard', { ...data, refreshToken: apiClient.getRefreshToken() ?? undefined });
    const { token, refreshToken } = extractTokens(resp);
    if (token) apiClient.setTokens(token, refreshToken || apiClient.getRefreshToken());
    const rawUser = resp?.data?.user || resp?.data || {};
    return mapBackendUser(rawUser);
  },

  /**
   * Upgrade existing consumer account to merchant.
   */
  upgradeToMerchant: async (): Promise<void> => {
    await apiClient.patch('/auth/profile', { userType: 'merchant' });
  },

  /**
   * Generate personal QR code for customers
   * Backend endpoint: GET /qr/personal
   */
  generatePersonalQrCode: async (): Promise<{ qrSlug: string; displayName: string; payload: string }> => {
    const resp = await apiClient.get('/qr/personal');
    return resp?.data?.data || resp?.data || {};
  },

  /**
   * Generate QR code for merchant
   * Backend endpoint: GET /qr/generate
   */
  generateQrCode: async (): Promise<{ qrSlug: string; tradingName: string; payload: string }> => {
    const resp = await apiClient.get('/qr/generate');
    return resp?.data?.data || resp?.data || {};
  },

  /**
   * Generate a dynamic QR code with pre-filled amount
   * Backend endpoint: POST /qr/dynamic
   */
  generateDynamicQrCode: async (payload: { amount: number; reference?: string }): Promise<any> => {
    const resp = await apiClient.post('/qr/dynamic', payload);
    return resp?.data || resp;
  },

  /**
   * Scan a QR code to resolve merchant or user
   * Backend endpoint: POST /qr/scan
   */
  scanQrCode: async (code: string): Promise<any> => {
    const resp = await apiClient.post('/qr/scan', { code });
    return resp?.data || resp;
  },

  /**
   * Initiate a QR payment
   * Backend endpoint: POST /qr/pay
   */
  payQrCode: async (payload: {
    merchantSlug: string;
    amount: number;
    pin: string;
    recipientType: 'merchant' | 'personal';
    dynamicReference?: string;
    idempotencyKey?: string;
    /** The scanned pay link (the server enforces its recipient and set amount) */
    payLink?: string;
    /** What it's for: one of the merchant's QR items */
    productId?: string;
    note?: string;
  }): Promise<any> => {
    const resp = await apiClient.post('/qr/pay', payload);
    return resp?.data || resp;
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
      kycStatus: rawUser.kycStatus || undefined,
      isActive: rawUser.isActive !== false,
    };
  } catch {
    return null;
  }
}

// Attach to authService for compatibility
(authService as any).getUserById = getUserById;
(authService as any).getUserById = getUserById;
