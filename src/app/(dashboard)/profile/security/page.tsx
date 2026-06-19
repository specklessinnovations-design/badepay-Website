

import React from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { formatTimeAgo } from '@/utils/formatting';
import toast from 'react-hot-toast';

export default function SecurityCenterPage() {
  const [, navigate] = useLocation();
  const { user, updateProfile } = useAuthStore();
  const loginHistory = usePreferencesStore((s) => s.loginHistory);

  if (!user) return null;

  const toggle2FA = async () => {
    try {
      await updateProfile({ twoFactorEnabled: !user.twoFactorEnabled });
      toast.success(user.twoFactorEnabled ? '2FA disabled' : '2FA enabled');
    } catch {
      toast.error('Could not update 2FA');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--text-primary)]">Two-factor authentication</p>
            <p className="text-sm text-[var(--text-secondary)]">Extra protection on login and transfers</p>
          </div>
          <button
            type="button"
            onClick={toggle2FA}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${user.twoFactorEnabled ? 'bg-[#6fe8d6] text-[#1a1a1a]' : 'border border-[var(--border)] text-[var(--text-secondary)]'}`}
          >
            {user.twoFactorEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </section>

      <section>
        <button
          type="button"
          onClick={() => navigate('/set-pin')}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-left"
        >
          <p className="font-medium text-[var(--text-primary)]">Transaction PIN</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {user.transactionPin ? 'PIN is set · tap to change' : 'Not set · tap to create'}
          </p>
        </button>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Login history</h2>
        <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          {loginHistory.length === 0 ? (
            <p className="p-4 text-sm text-[var(--text-secondary)]">No login history yet.</p>
          ) : (
            loginHistory.map((entry) => (
              <div key={entry.id} className="px-4 py-3">
                <p className="font-medium text-[var(--text-primary)]">{entry.device}</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {entry.location} · {formatTimeAgo(entry.timestamp)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <Link href="/forgot-password" className="block text-center text-sm transition-colors hover:opacity-80"
        style={{ color: 'var(--accent-text)' }}>
        Change password
      </Link>
    </div>
  );
}
