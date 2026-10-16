import { useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import authService from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { toPublicUser } from '@/lib/authMappers';

/**
 * Restores the JWT session on first client paint.
 * Always sets authSetupComplete so route guards wait instead of bouncing to /login.
 */
export function AuthBootstrap() {
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const token = apiClient.getAccessToken();
      if (!token) {
        if (!cancelled) {
          useAuthStore.setState({ authSetupComplete: true });
        }
        return;
      }

      try {
        const profile = await authService.getProfile();
        if (cancelled) return;

        const publicUser = toPublicUser(profile as any);
        useAuthStore.setState({
          user: publicUser,
          isAuthenticated: true,
          sessionToken: token,
          lastLoginTime: new Date().toISOString(),
          authSetupComplete: true,
          error: null,
        });
      } catch {
        if (cancelled) return;
        // Token is stale — clear and let the user sign in again.
        apiClient.setTokens(null, null);
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
          sessionToken: undefined,
          refreshToken: undefined,
          lastLoginTime: undefined,
          authSetupComplete: true,
        });
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

export default AuthBootstrap;
