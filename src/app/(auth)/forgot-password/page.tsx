import React, { useState } from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PremiumInput } from '@/components/ui/premium-input';
import { PremiumButton } from '@/components/ui/premium-button';
import { bpToast } from '@/lib/bpToast';
import authService from '@/services/authService';

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) { setError('Email address is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail()) return;
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
      bpToast.success('Reset code sent! Check your email.');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      bpToast.error('Failed to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' as const }}
        className="w-full text-center"
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(111,232,214,0.1)', border: '2px solid rgba(111,232,214,0.3)' }}
        >
          <CheckCircle2 size={36} style={{ color: '#6fe8d6' }} />
        </motion.div>

        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">Check your email</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-2">
          We've sent a reset code to
        </p>
        <p className="text-sm font-bold text-[var(--text-primary)] mb-8">{email}</p>

        <div className="rounded-2xl p-4 mb-6 text-left"
          style={{ background: 'rgba(111,232,214,0.06)', border: '1px solid rgba(111,232,214,0.15)' }}>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            The code expires in <strong className="text-[var(--text-primary)]">15 minutes</strong>.
            Didn't see it? Check your spam folder or try again.
          </p>
        </div>

        <PremiumButton onClick={() => navigate('/reset-password?email=' + encodeURIComponent(email))} fullWidth size="lg">
          Enter reset code <ArrowRight size={17} />
        </PremiumButton>

        <button
          onClick={() => { setSubmitted(false); setEmail(''); }}
          className="mt-4 text-sm font-semibold transition-colors"
          style={{ color: 'var(--accent-text)' }}
        >
          Try a different email address
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' as const }}
      className="w-full"
    >
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft size={15} /> Back to sign in
      </Link>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 200 }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(111,232,214,0.08)', border: '1px solid rgba(111,232,214,0.2)' }}
      >
        <ShieldCheck size={28} style={{ color: 'var(--accent-text)' }} />
      </motion.div>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] mb-2">Reset password</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Enter your email address and we'll send a reset code to your inbox.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <PremiumInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon={<Mail size={17} />}
          value={email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          error={error}
          disabled={isLoading}
          autoFocus
        />

        <div className="pt-1">
          <PremiumButton type="submit" fullWidth size="lg" isLoading={isLoading} disabled={isLoading}>
            {!isLoading && <>Send reset code <ArrowRight size={17} /></>}
          </PremiumButton>
        </div>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-8 rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
      >
        <ShieldCheck size={15} className="text-[var(--text-tertiary)] mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
          Reset codes are sent via email, expire after 15 minutes, and can only be used once.
        </p>
      </motion.div>
    </motion.div>
  );
}
