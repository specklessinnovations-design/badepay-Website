import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { PremiumButton } from '@/components/ui/premium-button';
import { bpToast } from '@/lib/bpToast';
import { getPostAuthPath } from '@/lib/authRouting';
import authService from '@/services/authService';

export default function VerifyOTPPage() {
  const [, navigate] = useLocation();
  const { isLoading, user, verifyOtp, logout } = useAuthStore();
  const emailFromQuery = new URLSearchParams(window.location.search).get('email')?.trim().toLowerCase() || '';
  const displayEmail = user?.email || emailFromQuery;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const next = [...otp];
        next[index - 1] = '';
        setOtp(next);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    const next = [...otp];
    digits.split('').forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    if (!displayEmail) {
      setError('Email address not found. Please register again.');
      return;
    }
    try {
      await verifyOtp(code);
      bpToast.success('Email verified!');
      navigate(getPostAuthPath(useAuthStore.getState().user));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid code';
      setError(msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!displayEmail) {
      bpToast.error('Email address not found');
      return;
    }
    setIsResending(true);
    try {
      await authService.resendOTP(displayEmail);
      setTimeLeft(300);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setError('');
      bpToast.success('New code sent to your email');
    } catch (err) {
      bpToast.error(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setIsResending(false);
    }
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      logout();
      bpToast.success('Starting fresh…');
      navigate('/register');
    } catch (err) {
      bpToast.error(err instanceof Error ? err.message : 'Failed to restart');
      setIsRestarting(false);
    }
  };

  const isAllFilled = otp.every(d => d !== '');

  if (!displayEmail) {
    return (
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full text-center">
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">No email to verify</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Create an account first — we&apos;ll send a verification code to your inbox.
        </p>
        <PremiumButton onClick={() => navigate('/register')} fullWidth size="lg">
          Create account <ArrowRight size={17} />
        </PremiumButton>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" as const }} className="w-full">

      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-6 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto accent-icon-wrap">
        <ShieldCheck size={28} style={{ color: 'var(--accent-text)' }} />
      </motion.div>

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] mb-2">Verify your email</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-[var(--text-primary)]">{displayEmail}</span>
        </p>
      </div>

      <div className="mb-6 rounded-2xl p-4 text-left"
        style={{ background: 'rgba(111,232,214,0.06)', border: '1px solid rgba(111,232,214,0.15)' }}>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Check your inbox and spam folder. Codes expire after a few minutes — use resend if needed.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Enter verification code</label>
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <motion.input key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="w-12 h-11 text-center text-lg font-black rounded-xl transition-all duration-200 focus:outline-none font-mono flex-shrink-0"
                style={{
                  background: digit ? 'rgba(111,232,214,0.08)' : 'var(--surface-secondary)',
                  border: `2px solid ${error ? '#EF4444' : digit ? '#6fe8d6' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                  boxShadow: digit ? '0 0 16px rgba(111,232,214,0.15)' : 'none',
                }}
                disabled={isLoading || isResending || isRestarting}
                placeholder="·"
              />
            ))}
          </div>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-2 text-xs font-semibold text-[#EF4444] text-center">{error}</motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="mb-6 text-center">
          {timeLeft > 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Code expires in <span className="font-bold tabular-nums" style={{ color: 'var(--accent-text)' }}>{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-[#EF4444]">Code expired — request a new one</p>
          )}
        </div>

        <PremiumButton type="submit" fullWidth size="lg" isLoading={isLoading}
          disabled={isLoading || isResending || isRestarting || !isAllFilled}>
          {!isLoading && <>Verify email <ArrowRight size={17} /></>}
        </PremiumButton>
      </form>

      <div className="mt-6 space-y-3 text-center">
        {canResend ? (
          <>
            <button onClick={handleResend} disabled={isResending || isRestarting}
              className="text-sm font-bold transition-colors disabled:opacity-50" style={{ color: 'var(--accent-text)' }}>
              {isResending ? 'Sending…' : 'Resend code'}
            </button>
            <div>
              <button onClick={handleRestart} disabled={isResending || isRestarting}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-50">
                <RotateCcw size={13} />
                {isRestarting ? 'Restarting…' : 'Start over'}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)]">
            Didn&apos;t receive it? Check your spam folder
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        Already verified?{' '}
        <Link href="/login" className="font-bold transition-colors" style={{ color: 'var(--accent-text)' }}>
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
