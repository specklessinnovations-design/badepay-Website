import React, { useState, Suspense } from 'react';
import { Link } from 'wouter';
import { useLocation, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Store, User, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getPostAuthPath } from '@/lib/authRouting';
import { PremiumInput } from '@/components/ui/premium-input';
import { PremiumButton } from '@/components/ui/premium-button';
import { bpToast } from '@/lib/bpToast';

function LoginForm() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const accountType = new URLSearchParams(search).get('type') === 'merchant' ? 'merchant' : 'personal';
  const { login, isLoading, error } = useAuthStore();

  const [formData, setFormData] = useState({ email: '', password: '', rememberDevice: false });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [quickLoginLoading, setQuickLoginLoading] = useState<'personal' | 'merchant' | null>(null);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Enter a valid email address';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(formData.email, formData.password, formData.rememberDevice);
      bpToast.success('Welcome back!');
      navigate(getPostAuthPath(useAuthStore.getState().user));
    } catch (err) {
      bpToast.error(error || (err instanceof Error ? err.message : 'Login failed. Check your credentials.'));
    }
  };

  const handleQuickLogin = async (type: 'personal' | 'merchant') => {
    const creds = type === 'merchant'
      ? { email: 'merchant@badepay.com', password: 'Merchant123' }
      : { email: 'demo@badepay.com', password: 'Demo123' };

    setQuickLoginLoading(type);
    try {
      await login(creds.email, creds.password, false);
      bpToast.success(type === 'merchant' ? '🏪 Merchant demo loaded!' : '👋 Welcome to the demo!');
      navigate(getPostAuthPath(useAuthStore.getState().user));
    } catch (err) {
      bpToast.error('Demo login failed. Please try again.');
    } finally {
      setQuickLoginLoading(null);
    }
  };

  const update = (field: string, value: string | boolean) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (validationErrors[field as string]) setValidationErrors(p => ({ ...p, [field]: '' }));
  };

  const anyLoading = isLoading || quickLoginLoading !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" as const }}
      className="w-full"
    >
      <div className="mb-7">
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] mb-1.5">Welcome back</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          {accountType === 'merchant' ? 'Sign in to your merchant portal' : 'Sign in to your BadePay account'}
        </p>
      </div>

      {/* Account type toggle */}
      <div className="mb-6 flex gap-1.5 rounded-2xl p-1.5"
        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
        {[
          { type: 'personal', label: 'Personal', icon: User, href: '/login' },
          { type: 'merchant', label: 'Merchant', icon: Store, href: '/login?type=merchant' },
        ].map(({ type, label, icon: Icon, href }) => (
          <Link key={type} href={href}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${
              accountType === type
                ? 'bg-[#6fe8d6] text-[#1a1a1a] shadow-[0_2px_12px_rgba(111,232,214,0.3)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}>
            <Icon size={15} strokeWidth={accountType === type ? 2.5 : 2} />
            {label}
          </Link>
        ))}
      </div>

      {/* ── Quick demo access ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6 rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(111,232,214,0.25)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5"
          style={{ background: 'rgba(111,232,214,0.07)' }}>
          <Zap size={12} style={{ color: 'var(--accent-text)' }} />
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--accent-text)' }}>
            Quick Demo Access
          </span>
        </div>

        {/* Demo buttons */}
        <div className="grid grid-cols-2 gap-px" style={{ background: 'var(--border)' }}>
          {/* Personal demo */}
          <button
            type="button"
            onClick={() => handleQuickLogin('personal')}
            disabled={anyLoading}
            className="flex flex-col items-start gap-2 p-3.5 transition-all active:scale-95 disabled:opacity-60"
            style={{ background: 'var(--card)' }}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(111,232,214,0.12)' }}>
                {quickLoginLoading === 'personal'
                  ? <Loader2 size={13} className="animate-spin" style={{ color: '#6fe8d6' }} />
                  : <User size={13} style={{ color: '#6fe8d6' }} />}
              </div>
              <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>Personal</span>
            </div>
            <p className="text-[10px] font-mono text-left" style={{ color: 'var(--text-tertiary)' }}>
              demo@badepay.com
            </p>
          </button>

          {/* Merchant demo */}
          <button
            type="button"
            onClick={() => handleQuickLogin('merchant')}
            disabled={anyLoading}
            className="flex flex-col items-start gap-2 p-3.5 transition-all active:scale-95 disabled:opacity-60 relative"
            style={{ background: 'var(--card)' }}
          >
            {/* Recommended badge */}
            <div className="absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[9px] font-black"
              style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
              NEW
            </div>
            <div className="flex items-center gap-2 w-full">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(111,232,214,0.2)' }}>
                {quickLoginLoading === 'merchant'
                  ? <Loader2 size={13} className="animate-spin" style={{ color: '#6fe8d6' }} />
                  : <Store size={13} style={{ color: '#6fe8d6' }} />}
              </div>
              <span className="text-xs font-black" style={{ color: 'var(--accent-text)' }}>Merchant</span>
            </div>
            <p className="text-[10px] font-mono text-left" style={{ color: 'var(--text-tertiary)' }}>
              merchant@badepay.com
            </p>
          </button>
        </div>

        {/* Hint */}
        <div className="px-4 py-2" style={{ background: 'rgba(111,232,214,0.03)' }}>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            One click · No sign-up needed · Full merchant store pre-loaded
          </p>
        </div>
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>or sign in manually</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PremiumInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon={<Mail size={17} />}
          value={formData.email}
          onChange={e => update('email', e.target.value)}
          error={validationErrors.email}
          disabled={anyLoading}
        />

        <PremiumInput
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          icon={<Lock size={17} />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors p-1">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
          value={formData.password}
          onChange={e => update('password', e.target.value)}
          error={validationErrors.password}
          disabled={anyLoading}
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.rememberDevice}
                onChange={e => update('rememberDevice', e.target.checked)}
                className="sr-only peer"
                disabled={anyLoading}
              />
              <div className="h-5 w-5 rounded-md border-2 border-[var(--border)] bg-[var(--surface-secondary)] peer-checked:bg-[#6fe8d6] peer-checked:border-[#6fe8d6] transition-all flex items-center justify-center">
                {formData.rememberDevice && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors select-none">
              Remember this device
            </span>
          </label>
          <Link href="/forgot-password" className="text-sm font-semibold transition-colors" style={{ color: 'var(--accent-text)' }}>
            Forgot password?
          </Link>
        </div>

        <div className="pt-2">
          <PremiumButton type="submit" fullWidth size="lg" isLoading={isLoading} disabled={anyLoading}>
            {!isLoading && <>Sign in <ArrowRight size={17} /></>}
          </PremiumButton>
        </div>
      </form>

      <p className="mt-7 text-center text-sm text-[var(--text-secondary)]">
        New to BadePay?{' '}
        <Link
          href={accountType === 'merchant' ? '/register?role=merchant' : '/register'}
          className="font-bold transition-colors"
          style={{ color: 'var(--accent-text)' }}
        >
          {accountType === 'merchant' ? 'Register your business' : 'Create account'}
        </Link>
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex items-center justify-center gap-2"
      >
        <ShieldCheck size={14} className="text-[var(--text-tertiary)]" />
        <p className="text-xs text-[var(--text-tertiary)]">256-bit encryption · Bank-grade security</p>
      </motion.div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6fe8d6] border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
