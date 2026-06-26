import React, { useState, Suspense } from 'react';
import { Link } from 'wouter';
import { useLocation, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Store, User, ShieldCheck } from 'lucide-react';
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

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(formData.email.trim().toLowerCase(), formData.password, formData.rememberDevice);
      
      const user = useAuthStore.getState().user;
      
      // If merchant login selected but user doesn't have merchant profile
      if (accountType === 'merchant' && !user?.merchantProfile?.businessName) {
        bpToast.error('No merchant account found. Please complete merchant onboarding or use personal login.');
        return;
      }
      
      bpToast.success('Welcome back!');
      navigate(getPostAuthPath(user, accountType));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Check your credentials.';
      
      // Provide more specific error messages
      if (errorMessage.toLowerCase().includes('user not found') || errorMessage.toLowerCase().includes('invalid credentials')) {
        bpToast.error('Invalid email or password. Please check your credentials and try again.');
      } else if (errorMessage.toLowerCase().includes('account suspended')) {
        bpToast.error('Your account has been suspended. Please contact support.');
      } else {
        bpToast.error(errorMessage);
      }
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
      transition={{ duration: 0.5, ease: 'easeOut' as const }}
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
        <PremiumInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon={<Mail size={17} />}
          value={formData.email}
          onChange={e => update('email', e.target.value)}
          error={validationErrors.email}
          disabled={isLoading}
          autoFocus
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
