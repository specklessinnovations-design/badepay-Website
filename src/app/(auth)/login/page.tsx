import React, { useState, Suspense } from 'react';
import { Link } from 'wouter';
import { useLocation, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, Store, User, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getPostAuthPath } from '@/lib/authRouting';
import { PremiumInput } from '@/components/ui/premium-input';
import { PremiumButton } from '@/components/ui/premium-button';
import { bpToast } from '@/lib/bpToast';
import { validatePhoneNumber } from '@/utils/authHelpers';

function LoginForm() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const accountType = new URLSearchParams(search).get('type') === 'merchant' ? 'merchant' : 'personal';
  const { login, isLoading, error } = useAuthStore();

  const [formData, setFormData] = useState({ phone: '', password: '', rememberDevice: false });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    else if (!validatePhoneNumber(formData.phone.trim())) errors.phone = 'Enter a valid Nigerian phone number';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(formData.phone, formData.password, formData.rememberDevice);
      bpToast.success('Welcome back!');
      navigate(getPostAuthPath(useAuthStore.getState().user));
    } catch (err) {
      bpToast.error(error || (err instanceof Error ? err.message : 'Login failed. Check your credentials.'));
    }
  };

  const update = (field: string, value: string | boolean) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (validationErrors[field as string]) setValidationErrors(p => ({ ...p, [field]: '' }));
  };

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="w-full">
          <label className="mb-2 block text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Phone number
          </label>
          <div className="flex items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] transition-all duration-200 focus-within:border-[#6fe8d6]">
            <div className="flex items-center gap-2 pl-4 pr-3 py-3.5 shrink-0"
              style={{ borderRight: '1px solid var(--border)' }}>
              <svg width="22" height="15" viewBox="0 0 22 15" className="rounded-sm">
                <rect width="7.33" height="15" fill="#008751" />
                <rect x="7.33" width="7.34" height="15" fill="#ffffff" />
                <rect x="14.67" width="7.33" height="15" fill="#008751" />
              </svg>
              <span className="text-sm font-bold text-[var(--text-primary)] select-none">+234</span>
            </div>
            <input
              type="tel"
              placeholder="803 000 0000"
              value={formData.phone.replace(/^\+234/, '')}
              onChange={e => update('phone', '+234' + e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="flex-1 bg-transparent px-4 py-3.5 text-base text-[var(--text-primary)] focus:outline-none placeholder-[var(--text-tertiary)] tracking-wide font-medium"
              disabled={isLoading}
            />
          </div>
          {validationErrors.phone && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#EF4444]">
              {validationErrors.phone}
            </p>
          )}
        </div>

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
          disabled={isLoading}
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.rememberDevice}
                onChange={e => update('rememberDevice', e.target.checked)}
                className="sr-only peer"
                disabled={isLoading}
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
          <PremiumButton type="submit" fullWidth size="lg" isLoading={isLoading} disabled={isLoading}>
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
