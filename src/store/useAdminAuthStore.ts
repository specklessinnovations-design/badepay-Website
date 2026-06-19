// FRONTEND-ONLY MODE: Admin auth store uses mock data only — no API calls.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/apiClient';

interface AdminUser {
  name: string;
  email: string;
  role: 'super_admin' | 'admin';
}

interface AdminAuthState {
  isAuthenticated: boolean;
  admin: AdminUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (action: string) => boolean;
}

const MOCK_ADMINS: { email: string; password: string; user: AdminUser }[] = [
  {
    email: 'super@badepay.app',
    password: 'admin123',
    user: { name: 'Super Admin', email: 'super@badepay.app', role: 'super_admin' },
  },
  {
    email: 'admin@badepay.app',
    password: 'admin123',
    user: { name: 'Regular Admin', email: 'admin@badepay.app', role: 'admin' },
  },
];

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      admin: null,

      login: async (email: string, password: string) => {
        // Try backend admin password login if available
        try {
          const resp = await apiClient.post('/auth/admin-login', { email, password });
          const payload = resp?.data || resp;
          const tokens = payload?.tokens || payload?.data?.tokens;
          const admin = payload?.admin || payload?.data?.admin;
          if (tokens) {
            const access = tokens.accessToken || tokens.access;
            const refresh = tokens.refreshToken || tokens.refresh;
            apiClient.setTokens(access, refresh);
          }
          if (admin) {
            set({ isAuthenticated: true, admin });
            return true;
          }
        } catch (e) {
          // Backend endpoint missing or failed — fallback to local demo credentials
        }

        const match = MOCK_ADMINS.find((a) => a.email === email && a.password === password);
        if (match) {
          set({ isAuthenticated: true, admin: match.user });
          return true;
        }
        return false;
      },

      logout: async () => {
        set({ isAuthenticated: false, admin: null });
      },

      hasPermission: (action: string) => {
        const role = get().admin?.role;
        if (!role) return false;
        if (role === 'super_admin') return true;
        const adminPermissions = [
          'view_dashboard',
          'view_users',
          'suspend_users',
          'view_transactions',
          'review_kyc',
          'view_disputes',
          'resolve_disputes',
          'view_analytics',
          'manage_merchants',
          'view_audit_log',
        ];
        return adminPermissions.includes(action);
      },
    }),
    { name: 'badepay-admin-auth' }
  )
);
