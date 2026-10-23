import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { walletService } from '@/services/walletService';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Where SeerBit sends people back after a card top-up (PAYMENT_CALLBACK_URL → /wallet/callback).
 * Confirms the payment with the backend before saying anything (mobile app: FundingCallback).
 * Card-paid store orders share the callback URL: those go to My orders.
 */
export default function FundingCallbackPage() {
  const [, navigate] = useLocation();
  const q = new URLSearchParams(window.location.search);
  const reference = q.get('reference') ?? q.get('paymentReference') ?? q.get('linkingreference') ?? '';
  const [state, setState] = useState<'verifying' | 'success' | 'pending' | 'failed'>('verifying');
  const [amount, setAmount] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  // Reload the profile so the new balance shows everywhere.
  const refreshUser = useAuthStore((s) => s.initializeSession);

  useEffect(() => {
    if (reference.startsWith('ORDPAY-')) { navigate('/orders', { replace: true }); return; }
    if (!reference) { setState('failed'); setMessage('Missing payment reference.'); return; }
    walletService.verifyFunding(reference)
      .then((res: any) => {
        const tx = res?.transaction ?? res?.data?.transaction ?? res;
        setAmount(Number(tx?.amount) || null);
        const s = tx?.status;
        setState(s === 'success' ? 'success' : s === 'pending' || s === 'review' ? 'pending' : 'failed');
        if (s !== 'success' && s !== 'pending' && s !== 'review') setMessage('The card payment was not completed.');
      })
      .catch((e) => { setState('failed'); setMessage(e?.message || 'We couldn’t confirm this payment yet.'); })
      .finally(() => { void refreshUser().catch(() => {}); });
  }, [reference]); // eslint-disable-line react-hooks/exhaustive-deps

  const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;
  const box = 'flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center';
  if (state === 'verifying') return <div className={box}><Loader2 className="animate-spin" size={36} style={{ color: '#6fe8d6' }} /><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Confirming your payment…</p></div>;
  return (
    <div className={box}>
      {state === 'success' && <><CheckCircle2 size={56} style={{ color: '#10b981' }} /><h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Wallet funded</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{amount ? `${naira(amount)} has been added to your BadePay wallet.` : 'Your BadePay wallet has been credited.'}</p></>}
      {state === 'pending' && <><Clock size={56} style={{ color: '#f59e0b' }} /><h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Payment processing</h1>
        <p className="max-w-xs text-sm" style={{ color: 'var(--text-secondary)' }}>Your bank hasn’t confirmed this payment yet. Your wallet is credited automatically as soon as it does.</p></>}
      {state === 'failed' && <><XCircle size={56} style={{ color: '#ef4444' }} /><h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Payment not completed</h1>
        <p className="max-w-xs text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p></>}
      <div className="mt-3 flex gap-2">
        <Link href="/dashboard" className="rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>Home</Link>
        {state !== 'success' && <Link href="/add-money" className="rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>Add money</Link>}
      </div>
    </div>
  );
}
