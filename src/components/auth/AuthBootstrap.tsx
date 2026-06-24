import { useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import authService from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { toPublicUser } from '@/lib/authMappers';

/**
 * Restores user session from stored JWT tokens on app load.
 */
export function AuthBootstrap() {
  const initializeSession = useAuthStore((s) => s.initializeSession);

  useEffect(() => {
    const token = apiClient.getAccessToken();
    if (!token) return;

    initializeSession().catch(() => {
      apiClient.setTokens(null, null);
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        sessionToken: undefined,
        refreshToken: undefined,
        authSetupComplete: true,
      });
    });
  }, [initializeSession]);

  return null;
}

export default AuthBootstrap;
