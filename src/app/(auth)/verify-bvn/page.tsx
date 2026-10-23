/**
 * BVN verification (mobile app: VerifyBvn). Required before anything else: no money moves without a
 * verified BVN (KYC level 1). POST /kyc/bvn { bvn, dateOfBirth }.
 * `?then=merchant` continues to business setup afterwards (from "Register your business").
 */
import React, { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Clock, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import apiClient from '@/lib/apiClient';
import { bpToast } from '@/lib/bpToast';

const field = { background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const;

export default function VerifyBvnPage() {
  const [, navigate] = useLocation();
  const toMerchant = new URLSearchParams(useSearch()).get('then') === 'merchant' || (() => {
    try { return sessionStorage.getItem('bp_then_merchant') === '1'; } catch { return false; }
  })();
  const { user, initializeSession, logout } = useAuthStore();
  const [bvn, setBvn] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [dobError, setDobError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);

  const underReview = user?.kycStatus === 'pending' && !user?.bvnVerified;
  const done = () => {
    try { sessionStorage.removeItem('bp_then_merchant'); } catch { /* storage blocked */ }
    navigate(toMerchant ? '/merchant/onboarding' : '/account-ready');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bvnError = /^\d{11}$/.test(bvn) ? '' : 'Your BVN is 11 digits';
    setError(bvnError);
    setDobError(dateOfBirth ? '' : 'Select your date of birth');
    if (bvnError || !dateOfBirth) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post('/kyc/bvn', { bvn, dateOfBirth });
      await initializeSession();
      if (res?.data?.submission?.status === 'approved') {
        bpToast.success('BVN verified. Welcome to RCCGPay');
        done();
      } else {
        bpToast.success(res?.message || 'Thanks, your BVN is being reviewed.');
      }
    } catch (err: any) {
      const message = err?.message || 'We could not verify this BVN. Check the number and try again.';
      // A date of birth problem (mismatch, under 18) is shown on the date field.
      if (/date of birth|18 years/i.test(message)) setDobError(message);
      else setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const checkAgain = async () => {
    setChecking(true);
    try {
      await initializeSession();
      if ((useAuthStore.getState().user?.kycLevel ?? 0) >= 1) done();
      else bpToast.success('Still under review. We’ll notify you as soon as it’s done.');
    } finally {
      setChecking(false);
    }
  };

  const verified = (user?.kycLevel ?? 0) >= 1;
  useEffect(() => {
    if (!apiClient.getAccessToken()) navigate('/login');
    else if (user && verified) done();
  }, [user, verified]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user || verified) return <Loading />;

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-md">
        <div className="flex justify-end">
          <button type="button" onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            <LogOut size={15} /> Log out
          </button>
        </div>
        <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(111,232,214,0.15)', color: '#0b7367' }}>
          {underReview ? <Clock size={26} /> : <ShieldCheck size={26} />}
        </div>
        {underReview ? (
          <>
            <h1 className="mt-6 text-[28px] font-black leading-tight" style={{ color: 'var(--text-primary)' }}>We're checking your details</h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Your BVN needs a quick manual review. This usually takes a few hours. We'll notify you as soon as you can start using RCCGPay.
            </p>
            <button type="button" onClick={checkAgain} disabled={checking}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold disabled:opacity-50"
              style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <RefreshCw size={15} className={checking ? 'animate-spin' : ''} /> Check again
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h1 className="mt-6 text-[28px] font-black leading-tight" style={{ color: 'var(--text-primary)' }}>Verify your identity</h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Hi {user.firstName}, enter your BVN to start using RCCGPay. It keeps your money safe and gets you your own bank account number.
            </p>
            <label className="mt-8 block text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }} htmlFor="bvn">Bank Verification Number (BVN)</label>
            <input id="bvn" inputMode="numeric" autoComplete="off" maxLength={11} placeholder="11 digits" value={bvn}
              onChange={e => { setBvn(e.target.value.replace(/\D/g, '').slice(0, 11)); setError(''); }}
              className="mt-2 w-full rounded-2xl px-4 py-3.5 text-base outline-none" style={field} />
            <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Don't know it? Dial <b style={{ color: 'var(--text-primary)' }}>*565*0#</b> on the phone number linked to your bank.
            </p>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            <p className="mt-5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              The name and date of birth on your BVN must match: <b style={{ color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</b>.
            </p>
            <label className="mt-5 block text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }} htmlFor="dob">Date of birth</label>
            <input id="dob" type="date" value={dateOfBirth} max={new Date().toISOString().slice(0, 10)}
              onChange={e => { setDateOfBirth(e.target.value); setDobError(''); }}
              className="mt-2 w-full rounded-2xl px-4 py-3.5 text-base outline-none" style={field} />
            <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>As registered with your bank.</p>
            {dobError && <p className="mt-2 text-sm text-red-500">{dobError}</p>}
            <p className="mt-8 rounded-2xl p-4 text-xs leading-relaxed" style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
              Your BVN is checked with a licensed identity provider. RCCGPay never stores the full number and it never gives us access to your bank account.
            </p>
            <button type="submit" disabled={submitting || bvn.length !== 11 || !dateOfBirth}
              className="mt-4 w-full rounded-2xl py-3.5 text-sm font-black disabled:opacity-50" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
              {submitting ? 'Verifying…' : 'Verify BVN'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const Loading = () => (
  <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6fe8d6] border-t-transparent" />
  </div>
);
