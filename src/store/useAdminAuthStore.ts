/**
 * Admin session. Only the token is stored (localStorage); who the admin is and what they may do
 * always comes from GET /admin/me. Permission checks here only shape the UI — the API enforces them.
 */
import { create } from 'zustand';
import adminApiClient, { AdminApiError, getAdminToken, setAdminToken, setUnauthorizedHandler } from '@/lib/adminApiClient';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  roleName: string;
  permissions: string[];
  twoFactorEnabled: boolean;
  twoFactorRequired: boolean;
  lastLoginAt?: string | null;
}

type Status = 'idle' | 'loading' | 'ready' | 'signedOut';

interface AdminAuthState {
  status: Status;
  admin: AdminProfile | null;
  /** Why the admin was signed out (shown on the sign-in page) */
  signedOutReason: string | null;
  isAuthenticated: boolean;
  /** Returns 'ok', or 'twoFactor' when the authenticator code is needed */
  login: (email: string, password: string, code?: string) => Promise<'ok' | 'twoFactor'>;
  loadMe: () => Promise<void>;
  logout: (reason?: string, opts?: { everywhere?: boolean }) => Promise<void>;
  replaceToken: (token: string) => void;
  hasPermission: (permission: string) => boolean;
  hasAny: (...permissions: string[]) => boolean;
}

export const useAdminAuthStore = create<AdminAuthState>()((set, get) => ({
  status: 'idle',
  admin: null,
  signedOutReason: null,
  isAuthenticated: false,

  login: async (email, password, code) => {
    const resp = await adminApiClient.post('/admin/auth/login', { email, password, ...(code ? { code } : {}) });
    if (resp?.data?.requiresTwoFactor) return 'twoFactor';
    const token = resp?.data?.token;
    if (!token) throw new AdminApiError('Sign-in failed: the server did not return a session', 500);
    setAdminToken(token);
    set({ signedOutReason: null });
    await get().loadMe();
    return 'ok';
  },

  loadMe: async () => {
    if (!getAdminToken()) {
      set({ status: 'signedOut', admin: null, isAuthenticated: false });
      return;
    }
    set((s) => ({ status: s.admin ? s.status : 'loading' }));
    try {
      const resp = await adminApiClient.get('/admin/me');
      set({ admin: resp.data as AdminProfile, status: 'ready', isAuthenticated: true });
    } catch (e) {
      if (e instanceof AdminApiError && e.status === 401) {
        set({ status: 'signedOut', admin: null, isAuthenticated: false });
      } else {
        // Network trouble: keep the current state; pages show their own errors.
        set((s) => ({ status: s.admin ? 'ready' : 'signedOut', isAuthenticated: !!s.admin }));
      }
    }
  },

  logout: async (reason, opts) => {
    if (opts?.everywhere) await adminApiClient.post('/admin/auth/logout').catch(() => {});
    setAdminToken(null);
    set({ admin: null, status: 'signedOut', isAuthenticated: false, signedOutReason: reason ?? null });
  },

  replaceToken: (token) => setAdminToken(token),

  hasPermission: (permission) => !!get().admin?.permissions.includes(permission),
  hasAny: (...permissions) => permissions.some((p) => get().admin?.permissions.includes(p)),
}));

// A 401 from any admin call ends the session (expired token, disabled admin, revoked sessions).
setUnauthorizedHandler(() => {
  const { status } = useAdminAuthStore.getState();
  if (status !== 'signedOut') {
    useAdminAuthStore.setState({
      admin: null, status: 'signedOut', isAuthenticated: false,
      signedOutReason: 'Your session ended. Please sign in again.',
    });
  }
});

/** Hook form: re-renders when permissions change. */
export const useCan = (permission: string): boolean =>
  useAdminAuthStore((s) => !!s.admin?.permissions.includes(permission));
