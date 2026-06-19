import React, { useState, Suspense } from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Check, ArrowLeft } from 'lucide-react';
import { PremiumInput } from '@/components/ui/premium-input';
import { PremiumButton } from '@/components/ui/premium-button';
import { bpToast } from '@/lib/bpToast';

function ResetPasswordContent() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({ otp: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pwReqs = [
    { label: '6+ characters', ok: formData.password.length >= 6 },
    { label: 'Passwords match', ok: formData.password.length > 0 && formData.password === formData.confirmPassword },
  ];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.otp.trim()) e.otp = 'Verification code is required';
    else if (!/^\d{6}$/.test(formData.otp)) e.otp = 'Must be exactly 6 digits';
    if (!formData.password) e.password = 'New password is required';
    else if (formData.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const update = (field: string, value: string) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 900));
      if (formData.otp !== '123456') {
        setErrors(p => ({ ...p, otp: 'Invalid code. Use demo code 123456.' }));
        return;
      }
      setIsSuccess(true);
      bpToast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2500);
    } catch {
      bpToast.error('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-full flex flex-col items-center justify-center py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 250 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(111,232,214,0.1)', border: '2px solid rgba(111,232,214,0.3)' }}
        >
          <CheckCircle2 size={36} style={{ color: '#6fe8d6' }} />
        </motion.div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">Password reset!</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Redirecting you to sign in…</p>
        <div className="h-1 w-32 rounded-full overflow-hidden bg-[var(--surface-secondary)]">
          <motion.div className="h-full bg-[#6fe8d6]" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5 }} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" as const }}
      className="w-full"
    >
      <Link href="/forgot-password" className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] mb-2">Create new password</h1>
        <p className="text-sm text-[var(--text-secondary)]">Enter the 6-digit code from your email and set a new password.</p>
      </div>

      {/* Demo hint */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6 rounded-2xl p-3.5"
        style={{ background: 'rgba(111,232,214,0.06)', border: '1px solid rgba(111,232,214,0.2)' }}
      >
        <p className="text-xs font-bold text-[var(--accent-text)] mb-0.5">Demo mode</p>
        <p className="text-xs text-[var(--text-tertiary)]">Use OTP code <span className="font-bold font-mono text-[var(--text-primary)]">123456</span> to reset password</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* OTP */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={formData.otp}
            onChange={e => update('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={isLoading}
            className="w-full rounded-2xl px-4 py-3.5 text-center text-2xl font-black tracking-[0.5em] font-mono transition-all duration-200 focus:outline-none"
            style={{
              background: 'var(--surface-secondary)',
              border: `2px solid ${errors.otp ? '#EF4444' : formData.otp.length === 6 ? '#6fe8d6' : 'var(--border)'}`,
              color: 'var(--text-primary)',
            }}
          />
          <AnimatePresence>
            {errors.otp && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-1.5 text-xs font-semibold text-[#EF4444]">{errors.otp}</motion.p>
            )}
          </AnimatePresence>
        </div>

        <PremiumInput
          label="New password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a strong password"
          icon={<Lock size={17} />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword(v => !v)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors p-1">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
          value={formData.password}
          onChange={e => update('password', e.target.value)}
          error={errors.password}
          disabled={isLoading}
        />

        {formData.password.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pwReqs.map(r => (
              <div key={r.label} className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: r.ok ? '#10B981' : 'var(--text-tertiary)' }}>
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ background: r.ok ? 'rgba(16,185,129,0.15)' : 'var(--surface-tertiary)' }}>
                  {r.ok && <Check size={8} strokeWidth={3} />}
                </div>
                {r.label}
              </div>
            ))}
          </div>
        )}

        <PremiumInput
          label="Confirm new password"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Repeat your password"
          icon={<Lock size={17} />}
          success={formData.confirmPassword.length >= 6 && formData.password === formData.confirmPassword}
          rightIcon={
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors p-1">
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
          value={formData.confirmPassword}
          onChange={e => update('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          disabled={isLoading}
        />

        <div className="pt-2">
          <PremiumButton type="submit" fullWidth size="lg" isLoading={isLoading} disabled={isLoading}>
            {!isLoading && <>Reset password <ArrowRight size={17} /></>}
          </PremiumButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        Remember your password?{' '}
        <Link href="/login" className="font-bold transition-colors" style={{ color: 'var(--accent-text)' }}>
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6fe8d6] border-t-transparent" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
