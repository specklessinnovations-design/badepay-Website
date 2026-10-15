import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound } from 'lucide-react';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { Button, TextInput } from '@/components/admin/ui';

export default function AdminLoginPage() {
  const login = useAdminAuthStore((s) => s.login);
  const signedOutReason = useAdminAuthStore((s) => s.signedOutReason);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'password' | 'code'>('password');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await login(email.trim(), password, step === 'code' ? code : undefined);
      if (result === 'twoFactor') setStep('code');
    } catch (err) {
      setError((err as Error).message || 'Sign-in failed');
      if (step === 'code') setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-shell flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <img src="/favicon.png" alt="" className="h-9 w-9 object-contain" />
          <span className="text-xl font-bold tracking-tight text-[var(--ad-fg-strong)]">BadePay <span className="text-[#0f766e]">Admin</span></span>
        </div>

        <form onSubmit={submit} className="ad-card space-y-4 p-6" noValidate>
          <div>
            <h1 className="text-lg font-bold text-[var(--ad-fg-strong)]">{step === 'password' ? 'Sign in' : 'Two-factor check'}</h1>
            <p className="mt-0.5 text-sm text-[var(--ad-muted)]">
              {step === 'password' ? 'Authorised BadePay staff only.' : 'Enter the 6-digit code from your authenticator app.'}
            </p>
          </div>

          {signedOutReason && !error && (
            <p className="rounded-lg bg-[rgba(29,78,216,0.08)] px-3 py-2 text-xs text-[#1d4ed8]" role="status">{signedOutReason}</p>
          )}
          {error && <p className="rounded-lg bg-[rgba(185,28,28,0.08)] px-3 py-2 text-xs text-[#b91c1c]" role="alert">{error}</p>}

          {step === 'password' ? (
            <>
              <label className="block space-y-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ad-fg-strong)]"><Mail size={13} /> Email</span>
                <TextInput type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="block space-y-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ad-fg-strong)]"><Lock size={13} /> Password</span>
                <TextInput type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
            </>
          ) : (
            <label className="block space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ad-fg-strong)]"><KeyRound size={13} /> Authenticator code</span>
              <TextInput
                inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus required
                className="font-mono tracking-[0.4em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </label>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={busy}
            disabled={step === 'password' ? !email || !password : code.length !== 6}
          >
            {step === 'password' ? 'Sign in' : 'Verify and sign in'}
          </Button>
          {step === 'code' && (
            <button type="button" className="w-full text-center text-xs text-[var(--ad-muted)] hover:underline" onClick={() => { setStep('password'); setCode(''); setError(null); }}>
              Use a different account
            </button>
          )}
        </form>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[var(--ad-muted)]">
          <ShieldCheck size={12} /> Every sign-in and action is recorded.
        </p>
      </div>
    </div>
  );
}
