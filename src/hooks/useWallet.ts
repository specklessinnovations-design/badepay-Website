import { useEffect, useState } from 'react';
import walletService from '../services/walletService';

export function useWallet() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const resp: any = await walletService.getBalance();
      setBalance(resp?.data?.balance ?? resp?.balance ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function fund(amount: number, providerData?: any) {
    setLoading(true);
    try {
      return await walletService.fund(amount, providerData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  return { balance, loading, refresh, fund };
}

export default useWallet;
