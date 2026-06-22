import { create } from 'zustand';
import authService from '@/services/authService';
import { toPublicUser } from '@/lib/authMappers';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import type { MerchantProfile } from '@/types/merchant';
import {
  buildTradingSlug,
  generateMerchantId,
} from '@/types/merchant';
import { formatAccountForDisplay } from '@/lib/authRouting';

export type KYCLevel = 0 | 1 | 2 | 3;
export type UserType = 'consumer' | 'merchant';

export interface User {
  id: string;
  email: string;
  phone?: string; // Optional — kept for KYC/profile
  firstName: string;
  lastName: string;
  userType: UserType;
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
  kycLevel: KYCLevel;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  bvnVerified?: boolean;
  ninVerified?: boolean;
  selfieVerified?: boolean;
  addressVerified?: boolean;
  username?: string;
  twoFactorEnabled?: boolean;
  createdAt: string;
  lastLogin?: string;
  balance: number;
  transactionPin?: string;
  biometricEnabled?: boolean;
  deviceId?: string;
  merchantProfile?: MerchantProfile;
  kycSubmittedAt?: string;
  isActive?: boolean;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionToken?: string;
  refreshToken?: string;
  deviceVerified: boolean;
  deviceId?: string;
  suspiciousLoginAttempts: number;
  lastLoginTime?: string;

  // Auth actions
  login: (email: string, password: string, rememberDevice?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  verifyOtp: (otp: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string, otp: string) => Promise<void>;
  sendPasswordResetOTP: (email: string) => Promise<void>;
  verifyDevice: (deviceCode: string) => Promise<void>;
  updateKycLevel: (level: KYCLevel) => Promise<void>;
  updateKycData: (data: Partial<User>) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  completeMerchantOnboarding: (data: Omit<MerchantProfile, 'merchantId' | 'qrSlug' | 'verified' | 'onboardingComplete' | 'payoutAccount'>) => Promise<void>;
  upgradeToMerchant: () => Promise<void>;
  syncUserFromStorage: () => void;
  updateUserBalance: (amount: number) => void;
  enableBiometric: () => void;
  disableBiometric: () => void;
  refreshSession: () => Promise<void>;
  checkSessionValidity: () => boolean;
  clearError: () => void;
}

export interface RegisterData {
  email: string;
  phone?: string; // Optional — kept for KYC/profile
  firstName: string;
  lastName: string;
  password: string;
  userType: UserType;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      deviceVerified: false,
      suspiciousLoginAttempts: 0,

      /**
       * Login with email and password
       */
      login: async (email: string, password: string, rememberDevice = false) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);

          usePreferencesStore.getState().recordLogin(getDeviceLabel());
          authService.updateUserProfile({
            lastLogin: new Date().toISOString(),
          }).catch(() => {});

          set({
            user: toPublicUser(response.user),
            isAuthenticated: true,
            sessionToken: response.token,
            refreshToken: response.refreshToken,
            deviceVerified: rememberDevice,
            suspiciousLoginAttempts: 0,
            lastLoginTime: new Date().toISOString(),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            error: errorMessage,
            suspiciousLoginAttempts: get().suspiciousLoginAttempts + 1,
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Register a new user
       */
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone, // optional
            password: data.password,
            userType: data.userType,
          });

          // Store user temporarily (not authenticated until OTP verified)
          set({
            user: toPublicUser(response.user),
            isAuthenticated: false,
            sessionToken: 'temp_' + Math.random().toString(36).substr(2, 20),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Verify OTP after registration
       */
      verifyOtp: async (otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = get().user;
          if (!currentUser) throw new Error('No user found for OTP verification');

          const response = await authService.verifyOTP(currentUser.email, otp);

          usePreferencesStore.getState().recordLogin(getDeviceLabel());

          set({
            user: toPublicUser(response.user),
            isAuthenticated: true,
            sessionToken: response.token,
            refreshToken: response.refreshToken,
            lastLoginTime: new Date().toISOString(),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'OTP verification failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Send password reset OTP
       */
      sendPasswordResetOTP: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.forgotPassword(email);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send reset OTP';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Reset password with token
       */
      resetPassword: async (token: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resetPassword(token, newPassword);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Verify transaction PIN
       */
      verifyPin: async (pin: string) => {
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('User not authenticated');
          }

          return await authService.verifyTransactionPIN(pin);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'PIN verification failed';
          set({ error: errorMessage });
          return false;
        }
      },

      /**
       * Set transaction PIN
       */
      setPin: async (pin: string) => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('User not authenticated');
          }

          await authService.setTransactionPIN(pin);

          // Update local user state
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  transactionPin: pin,
                }
              : null,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to set PIN';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Verify device
       */
      verifyDevice: async (deviceCode: string) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate device verification
          await new Promise((resolve) => setTimeout(resolve, 500));

          set({
            deviceVerified: true,
            deviceId: 'device_' + Math.random().toString(36).substr(2, 9),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Device verification failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Update KYC level
       */
      updateKycLevel: async (level: KYCLevel) => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('User not authenticated');
          }

          const updated = await authService.updateUserProfile({
            kycLevel: level,
            kycStatus: 'approved',
          });

          set({
            user: toPublicUser(updated),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'KYC update failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Update KYC data
       */
      updateKycData: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('User not authenticated');
          }

          const updated = await authService.updateUserProfile(data);

          set({
            user: toPublicUser(updated),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'KYC data update failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = get().user;
          if (!currentUser) throw new Error('User not authenticated');

          const updates = { ...data };
          if (updates.firstName || updates.lastName) {
            updates.accountName = `${updates.firstName ?? currentUser.firstName} ${updates.lastName ?? currentUser.lastName}`;
          }

          const updated = await authService.updateUserProfile(updates);
          set({ user: toPublicUser(updated) });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      completeMerchantOnboarding: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = get().user;
          if (!currentUser) throw new Error('User not authenticated');

          const tradingName = data.tradingName || data.businessName;
          const qrSlug = buildTradingSlug(tradingName, data.businessName);
          const merchantId = generateMerchantId();
          const payoutAcct = `BadePay · ${formatAccountForDisplay(currentUser.accountNumber)}`;

          const merchantProfile: MerchantProfile = {
            ...data,
            tradingName,
            payoutAccount: payoutAcct,
            verified: true,
            merchantId,
            qrSlug,
            onboardingComplete: true,
          };

          const updated = await authService.updateUserProfile({
            userType: 'merchant',
            accountName: tradingName,
            merchantProfile,
          });

          set({ user: toPublicUser(updated) });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Onboarding failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      upgradeToMerchant: async () => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = get().user;
          if (!currentUser) throw new Error('User not authenticated');

          const updated = await authService.updateUserProfile({
            userType: 'merchant',
          });

          set({ user: toPublicUser(updated) });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upgrade failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      syncUserFromStorage: async () => {
        const currentUser = get().user;
        if (!currentUser?.id) return;
        try {
          const stored = await authService.getProfile();
          if (stored) {
            set({ user: toPublicUser(stored) });
          }
        } catch {
          // Ignore sync errors
        }
      },

      /**
       * Update user balance
       */
      updateUserBalance: (amount: number) => {
        set((state) => {
          if (!state.user) return state;

          authService.updateUserBalance(state.user.id, amount).catch((err) => {
            console.error('Failed to update balance:', err);
          });

          return {
            user: {
              ...state.user,
              balance: state.user.balance + amount,
            },
          };
        });
      },

      /**
       * Enable biometric
       */
      enableBiometric: () => {
        const currentUser = get().user;
        if (!currentUser) return;
        authService.updateUserProfile({ biometricEnabled: true }).then((updated) => {
          set({ user: toPublicUser(updated) });
        });
      },

      /**
       * Disable biometric
       */
      disableBiometric: () => {
        const currentUser = get().user;
        if (!currentUser) return;
        authService.updateUserProfile({ biometricEnabled: false }).then((updated) => {
          set({ user: toPublicUser(updated) });
        });
      },

      /**
       * Refresh session
       */
      refreshSession: async () => {
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 300));

          set({
            sessionToken: 'token_' + Math.random().toString(36).substr(2, 40),
            lastLoginTime: new Date().toISOString(),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Session refresh failed';
          set({ error: errorMessage });
          throw error;
        }
      },

      /**
       * Check if session is still valid (24 hours)
       */
      checkSessionValidity: () => {
        const state = get();
        if (!state.isAuthenticated || !state.lastLoginTime) return false;

        const lastLogin = new Date(state.lastLoginTime).getTime();
        const now = new Date().getTime();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

        return now - lastLogin < sessionDuration;
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Logout
       */
      logout: () => {
        authService.logout().catch((err) => {
          console.error('Logout error:', err);
        });

        set({
          user: null,
          isAuthenticated: false,
          sessionToken: undefined,
          refreshToken: undefined,
          deviceVerified: false,
          suspiciousLoginAttempts: 0,
          lastLoginTime: undefined,
          error: null,
        });
      },
    })
);

function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'This device';
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/Android/i.test(ua)) return 'Android device';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  return 'This device';
}
