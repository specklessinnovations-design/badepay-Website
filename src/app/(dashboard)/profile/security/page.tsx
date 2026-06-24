
import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import apiClient from '@/lib/apiClient';
import { formatTimeAgo } from '@/utils/formatting';
import toast from 'react-hot-toast';
import { Smartphone, Lock, KeyRound, ChevronRight, ShieldCheck } from 'lucide-react';

interface Session {
  id: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function SecurityCenterPage() {
  const [, navigate] = useLocation();
  const { user, syncUserFromStorage } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsResp] = await Promise.all([
          apiClient.get('/auth/sessions'),
          syncUserFromStorage(),
        ]);
        setSessions(sessionsResp?.data?.sessions || []);
      } catch {
        toast.error('Failed to load security settings');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [syncUserFromStorage]);

  const fetchSessions = async () => {
    try {
      const resp = await apiClient.get('/auth/sessions');
      setSessions(resp?.data?.sessions || []);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
      toast.success('Session revoked');
      fetchSessions();
    } catch {
      toast.error('Failed to revoke session');
    }
  };

  const revokeAllSessions = async () => {
    try {
      await apiClient.delete('/auth/sessions');
      toast.success('All sessions revoked');
      fetchSessions();
    } catch {
      toast.error('Failed to revoke sessions');
    }
  };

  const securityScore = user?.hasPinSet ? 90 : 60;

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Security score card */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(111,232,214,0.1) 0%, var(--card) 60%)', border: '1px solid rgba(111,232,214,0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(111,232,214,0.15)' }}>
            <ShieldCheck size={24} className="text-[#6fe8d6]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {user?.hasPinSet ? 'Account protected' : 'Set up your PIN'}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              {user?.hasPinSet
                ? 'PIN required on every transaction'
                : 'Add a transaction PIN to secure payments'}
            </div>
          </div>
          <span className="text-xl font-semibold text-[#6fe8d6]">
            {securityScore}<span className="text-sm">/100</span>
          </span>
        </div>
        <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-tertiary)' }}>
          <div className="h-full rounded-full bg-[#6fe8d6]" style={{ width: `${securityScore}%` }} />
        </div>
      </div>

      {/* Authentication section */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Authentication</h2>
        <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--surface-tertiary)' }}>
              <Lock size={18} className="text-[var(--text-secondary)]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[var(--text-primary)]">PIN for every transaction</div>
              <div className="text-xs text-[var(--text-secondary)]">
                Required on every payment
              </div>
            </div>
            <div className="h-6 w-10 rounded-full p-0.5"
              style={{ background: '#6fe8d6' }}>
              <div className="h-5 w-5 rounded-full bg-white translate-x-4 transition-transform" />
            </div>
          </div>
          <Link href="/profile/change-password" className="block">
            <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-secondary)]">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--surface-tertiary)' }}>
                <Lock size={18} className="text-[var(--text-secondary)]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--text-primary)]">Change password</div>
                <div className="text-xs text-[var(--text-secondary)]">Update your login password</div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
            </div>
          </Link>
          <Link href="/profile/change-pin" className="block">
            <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-secondary)]">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--surface-tertiary)' }}>
                <KeyRound size={18} className="text-[var(--text-secondary)]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--text-primary)]">Change transaction PIN</div>
                <div className="text-xs text-[var(--text-secondary)]">4-digit · secure PIN</div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
            </div>
          </Link>
        </div>
      </section>

      {/* Active devices section */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Active devices</h2>
        <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          {loading ? (
            <p className="p-4 text-sm text-[var(--text-secondary)]">Loading devices...</p>
          ) : sessions.length === 0 ? (
            <p className="p-4 text-sm text-[var(--text-secondary)]">No active sessions.</p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="px-4 py-3.5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--surface-tertiary)' }}>
                  <Smartphone size={16} className="text-[var(--text-secondary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{session.deviceName}</div>
                    {session.isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-medium uppercase tracking-wider">This device</span>}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {session.ipAddress} · {formatTimeAgo(session.createdAt)}
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    type="button"
                    onClick={() => revokeSession(session.id)}
                    className="text-xs text-[#EF4444] hover:underline font-medium"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        {sessions.length > 1 && (
          <button
            type="button"
            onClick={revokeAllSessions}
            className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 text-sm text-[#EF4444] font-medium"
          >
            Sign out all other devices
          </button>
        )}
      </section>

      <div className="flex items-start gap-2 text-xs text-[var(--text-tertiary)]">
        <ShieldCheck size={14} className="text-[#6fe8d6] shrink-0 mt-0.5" />
        <span>BadePay uses AES-256 encryption at rest and TLS 1.3 in transit. Certified PCI-DSS Level 1.</span>
      </div>
    </div>
  );
}
