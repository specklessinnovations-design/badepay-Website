

import { useEffect } from 'react';
import { refreshAllAdminData } from '@/store/useAdminDataStore';

export function useAdminDataSync() {
  useEffect(() => {
    refreshAllAdminData();

    const onStorage = (e: StorageEvent) => {
      if (
        e.key?.startsWith('badepay_') ||
        e.key === 'badepay_users' ||
        e.key === 'badepay_transactions'
      ) {
        refreshAllAdminData();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
}
