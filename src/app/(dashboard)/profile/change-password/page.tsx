import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, Check } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const [, navigate] = useLocation();
  const { user, resetPassword, logout } = useAuthStore();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const getPasswordRules = (password: string) => {
    return [
      { label: 'At least 8 characters', ok: password.length >= 8 },
      { label: 'Contains uppercase letter', ok: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', ok: /[a-z]/.test(password) },
      { label: 'Contains number', ok: /\d/.test(password) },
      { label: 'Contains special character', ok: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
  };

  const rules = getPasswordRules(newPassword);

  const handleSubmit = async () => {
    setError('');
    if (!currentPassword) {
      setError('Enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from your current password');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(user?.email || '', '', newPassword);
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    await logout();
    navigate('/login');
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)' }}>
          <CheckCircle2 size={36} className="text-[#10B981]" />
        </div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">Password Updated</h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-[280px]">
          For your security, you have been signed out on all devices. Sign in again with your new password.
        </p>
        <button
          onClick={handleContinue}
          className="mt-8 rounded-full bg-[#6fe8d6] px-8 py-3 text-sm font-semibold text-[#1a1a1a]"
          style={{ boxShadow: '0 4px 20px rgba(111,232,214,0.3)' }}
        >
          Continue to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/profile/security')}
          className="h-9 w-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--text-primary)]">Change password</h1>
      </div>

      <div>
        <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Update your password</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Enter your current password, then choose a new one.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl p-4 flex gap-3"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={20} className="text-[#EF4444] shrink-0 mt-0.5" />
          <p className="text-sm text-[#EF4444]">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            Current password
          </label>
          <div className="mt-2 h-14 rounded-xl flex items-center px-4 gap-3"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setError(''); }}
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-[var(--text-secondary)]">
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            New password
          </label>
          <div className="mt-2 h-14 rounded-xl flex items-center px-4 gap-3"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="text-[var(--text-secondary)]">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {rules.map((r) => (
            <div
              key={r.label}
              className={`flex items-center gap-2 text-xs ${r.ok ? 'text-[#10B981]' : 'text-[var(--text-tertiary)]'}`}
            >
              <span className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${r.ok ? 'bg-[#10B981]/20' : 'var(--surface-tertiary)'}`}>
                {r.ok && <Check size={12} className="text-[#10B981]" />}
              </span>
              {r.label}
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            Confirm new password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
            className="mt-2 w-full h-14 rounded-xl px-4 bg-transparent outline-none text-sm"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
            placeholder="Repeat new password"
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="rounded-2xl p-3.5 flex gap-2.5"
        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
        <ShieldCheck size={16} className="text-[#6fe8d6] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Changing your password will sign you out on all devices for security.
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full rounded-xl bg-[#6fe8d6] py-3.5 text-sm font-semibold text-[#1a1a1a] disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ boxShadow: '0 4px 20px rgba(111,232,214,0.3)' }}
      >
        {loading ? (
          <>
            <div className="h-4 w-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
            Updating...
          </>
        ) : (
          'Update password'
        )}
      </button>
    </div>
  );
}
