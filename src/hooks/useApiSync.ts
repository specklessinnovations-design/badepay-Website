/**
 * useApiSync — syncs the authenticated user's profile and wallet balance
 * from the backend on mount and on demand.
 */
import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import apiClient from '@/lib/apiClient';

export function useApiSync(enabled = true) {
  const { isAuthenticated, user, updateUserBalance } = useAuthStore();

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !apiClient.getAccessToken()) return;
    try {
      // Sync wallet balance
      const walletResp = await apiClient.get('/wallet/balance');
      const balance = walletResp?.data?.balance ?? walletResp?.balance;
      if (typeof balance === 'number' && user) {
        updateUserBalance(balance - (user.balance ?? 0));
      }
    } catch {
      // Silently fail — user stays logged in with cached data
    }
  }, [isAuthenticated, user, updateUserBalance]);

  useEffect(() => {
    if (enabled) {
      refresh();
    }
  }, [enabled, refresh]);

  return { refresh };
}

export default useApiSync;
