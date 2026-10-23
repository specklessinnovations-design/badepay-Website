/**
 * After BVN verification (mobile app: AccountReady): the bank account that pays straight into the wallet.
 * POST /wallet/virtual-account { wallet } creates it if needed (safe to call again).
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Check, Copy, RefreshCw, Share2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import apiClient from '@/lib/apiClient';
import { ensureVirtualAccount, formatAccountNumber, type VirtualAccount } from '@/services/virtualAccount';
import { bpToast } from '@/lib/bpToast';

export default function AccountReadyPage() {
  const [, navigate] = useLocation();
  const user = useAuthStore(s => s.user);
  const merchant = !!user?.merchantProfile?.businessName;
  const [va, setVa] = useState<VirtualAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setVa(await ensureVirtualAccount(merchant ? 'merchant' : 'personal')); }
    catch (e: any) { setError(e?.message || 'We couldn’t create your account number yet.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (!apiClient.getAccessToken()) { navigate('/login'); return; }
    if (user) void load();
  }, [!!user]); // eslint-disable-line react-hooks/exhaustive-deps

  const details = va ? `My BadePay account details:\nBank: ${va.bankName}\nAccount Number: ${va.accountNumber}\nAccount Name: ${va.accountName}` : '';
  const copy = async () => { if (va) { await navigator.clipboard.writeText(va.accountNumber); bpToast.success('Account number copied'); } };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'BadePay account details', text: details });
      else { await navigator.clipboard.writeText(details); bpToast.success('Details copied'); }
    } catch { /* share sheet closed */ }
  };

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: '#6fe8d6', boxShadow: '0 0 40px rgba(111,232,214,0.45)' }}>
          <Check size={36} strokeWidth={3} color="#081a18" />
        </div>
        <p className="mt-6 text-[11px] uppercase tracking-[0.22em]" style={{ color: '#0b7367' }}>KYC level {user?.kycLevel ?? 0}</p>
        <h1 className="mt-3 text-[28px] font-black leading-tight" style={{ color: 'var(--text-primary)' }}>Your BadePay account is ready</h1>
        <p className="mt-3 max-w-[320px] text-sm" style={{ color: 'var(--text-secondary)' }}>Fund your wallet by sending money to this account from any Nigerian bank.</p>
      </div>
      <div className="mx-auto mt-10 max-w-md rounded-3xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>Account number</p>
          {va && <span className="rounded-full px-2 py-1 text-[10px]" style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>{va.bankName}</span>}
        </div>
        {loading ? (
          <div className="mt-3 h-9 w-48 animate-pulse rounded-lg" style={{ background: 'var(--surface-secondary)' }} />
        ) : va ? (
          <>
            <p className="mt-2 font-mono text-[30px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{formatAccountNumber(va.accountNumber)}</p>
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>Account name</p>
              <p className="mt-1 text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>{va.accountName}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button type="button" onClick={copy} className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold" style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}><Copy size={15} /> Copy</button>
              <button type="button" onClick={share} className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold" style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}><Share2 size={15} /> Share</button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
            <button type="button" onClick={load} className="mt-4 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold" style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}><RefreshCw size={15} /> Try again</button>
          </>
        )}
      </div>
      <div className="mx-auto mt-8 max-w-md">
        <button type="button" onClick={() => navigate(merchant ? '/merchant' : '/dashboard')}
          className="w-full rounded-2xl py-3.5 text-sm font-black" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          Let's continue
        </button>
      </div>
    </div>
  );
}
