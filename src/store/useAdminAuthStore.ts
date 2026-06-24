// Admin auth store connected to BadePay backend API
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import adminService from '@/services/adminService';

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

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      admin: null,

      login: async (email: string, password: string) => {
        try {
          const admin = await adminService.login(email, password);
          if (admin) {
            set({
              isAuthenticated: true,
              admin: {
                name: admin.name || 'Admin',
                email: admin.email || email,
                role: admin.role === 'superadmin' ? 'super_admin' : 'admin',
              },
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      logout: async () => {
        await adminService.logout().catch(() => {});
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
