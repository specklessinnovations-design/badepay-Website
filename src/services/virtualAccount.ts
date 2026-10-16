import apiClient from '@/lib/apiClient';

/** The wallet's bank account: money sent to it from any Nigerian bank lands in the wallet. */
export interface VirtualAccount { accountNumber: string; bankName: string; accountName: string }

/** POST /wallet/virtual-account creates the account if needed and returns it (safe to call again). */
export async function ensureVirtualAccount(wallet: 'personal' | 'merchant' = 'personal'): Promise<VirtualAccount> {
  const res = await apiClient.post('/wallet/virtual-account', { wallet });
  const va = res?.data?.virtualAccount;
  if (!va?.accountNumber) throw new Error('We couldn’t create your account number yet.');
  return va;
}

export const formatAccountNumber = (n: string) => (n.length === 10 ? `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}` : n);
