/**
 * Security (mobile app: Security): two-factor sign-in, when the PIN is asked, password and PIN,
 * signed-in sessions, trusted devices, SMS alerts and closing the account.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'wouter';
import toast from 'react-hot-toast';
import { ChevronRight, KeyRound, Lock, MessageSquare, ShieldCheck, Smartphone, Trash2, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import apiClient from '@/lib/apiClient';
import { deviceId } from '@/services/authService';
import { usePinPrompt } from '@/components/ui/pin-prompt';
import { formatTimeAgo } from '@/utils/formatting';

interface Session { id: string; deviceName: string; ipAddress: string; createdAt: string; isCurrent?: boolean }
interface Device { id: string; deviceId: string; name: string; trustedAt: string; lastSeenAt: string }
type PinRequirement = 'always' | 'above_20k' | 'never';

const PIN_OPTIONS: { value: PinRequirement; label: string; sub: string }[] = [
  { value: 'always', label: 'Every transaction', sub: 'Most secure' },
  { value: 'above_20k', label: 'Above ₦20,000', sub: 'Small payments skip the PIN' },
  { value: 'never', label: 'Never', sub: 'Not recommended' },
];

const card = 'divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]';
const field = { background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{title}</h2>
      <div className={card}>{children}</div>
    </section>
  );
}

function Row({ icon: Icon, title, sub, right, onClick, href, danger }: { icon: React.ElementType; title: string; sub?: string; right?: React.ReactNode; onClick?: () => void; href?: string; danger?: boolean }) {
  const body = (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${onClick || href ? 'transition-colors hover:bg-[var(--surface-secondary)]' : ''}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--surface-tertiary)' }}>
        <Icon size={17} className={danger ? 'text-[#EF4444]' : 'text-[var(--text-secondary)]'} />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className={`text-sm font-medium ${danger ? 'text-[#EF4444]' : 'text-[var(--text-primary)]'}`}>{title}</div>
        {sub && <div className="text-xs text-[var(--text-secondary)]">{sub}</div>}
      </div>
      {right ?? ((onClick || href) && <ChevronRight size={16} className="text-[var(--text-tertiary)]" />)}
    </div>
  );
  if (href) return <Link href={href} className="block">{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="block w-full">{body}</button>;
  return body;
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl" style={{ background: 'var(--card)' }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[var(--text-tertiary)]"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default function SecurityCenterPage() {
  const [, navigate] = useLocation();
  const { user, initializeSession, logout } = useAuthStore();
  const { askPin, pinDialog } = usePinPrompt();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [twoFactor, setTwoFactor] = useState<boolean | null>(null);
  const [sms, setSms] = useState<{ smsAlerts: boolean; hasPhone: boolean } | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [twoFaSheet, setTwoFaSheet] = useState<'setup' | 'disable' | null>(null);
  const [setup, setSetup] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [closeSheet, setCloseSheet] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const refresh = apiClient.getRefreshToken();
    const [s, d, t, n] = await Promise.allSettled([
      apiClient.get(`/auth/sessions${refresh ? `?refreshToken=${encodeURIComponent(refresh)}` : ''}`),
      apiClient.get('/users/me/devices'),
      apiClient.get('/auth/2fa/status'),
      apiClient.get('/users/me/notification-preferences'),
    ]);
    if (s.status === 'fulfilled') setSessions(s.value?.data?.sessions ?? []);
    if (d.status === 'fulfilled') setDevices(d.value?.data?.devices ?? []);
    if (t.status === 'fulfilled') setTwoFactor(!!t.value?.data?.twoFactorActive);
    if (n.status === 'fulfilled') setSms(n.value?.data ?? null);
    setLoaded(true);
  };
  useEffect(() => { void load(); }, []);

  const setPinRequirement = async (value: PinRequirement) => {
    if (value === user?.pinRequirement) return;
    // The backend needs the PIN to change this setting.
    const done = await askPin({ title: 'Confirm with your PIN', description: 'Required to change when your PIN is asked' },
      (pin) => apiClient.patch('/auth/profile', { pinRequirement: value, pin }));
    if (done) { await initializeSession().catch(() => {}); toast.success('PIN setting updated'); }
  };

  const startTwoFactor = async () => {
    setBusy(true); setCode('');
    try {
      const res = await apiClient.post('/auth/2fa/setup');
      setSetup(res?.data ?? null);
      setTwoFaSheet('setup');
    } catch (e: any) { toast.error(e?.message || 'Could not start two-factor setup'); }
    finally { setBusy(false); }
  };

  const confirmTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) { toast.error('Enter the 6-digit code'); return; }
    setBusy(true);
    try {
      if (twoFaSheet === 'setup') await apiClient.post('/auth/2fa/enable', { code });
      else await apiClient.post('/auth/2fa/disable', { code, password });
      toast.success(twoFaSheet === 'setup' ? 'Two-factor authentication is on' : 'Two-factor authentication is off');
      setTwoFaSheet(null); setCode(''); setPassword('');
      await load();
    } catch (e: any) { toast.error(e?.message || 'That code didn’t work'); setCode(''); }
    finally { setBusy(false); }
  };

  const revokeSession = async (s: Session) => {
    if (!window.confirm(`Sign out ${s.deviceName}?`)) return;
    try { await apiClient.delete(`/auth/sessions/${s.id}`); await load(); }
    catch (e: any) { toast.error(e?.message || 'Could not sign it out'); }
  };

  const revokeOthers = async () => {
    if (!window.confirm('Sign out every other device?')) return;
    try {
      await apiClient.post('/auth/sessions/revoke', { keepCurrentSession: true, refreshToken: apiClient.getRefreshToken() });
      await load();
      toast.success('Other sessions signed out');
    } catch (e: any) { toast.error(e?.message || 'Could not sign them out'); }
  };

  const forgetDevice = async (d: Device) => {
    if (!window.confirm(`Forget ${d.name}? It will need an email code to sign in again.`)) return;
    try { await apiClient.delete(`/users/me/devices/${d.id}`); await load(); }
    catch (e: any) { toast.error(e?.message || 'Could not forget it'); }
  };

  const toggleSms = async () => {
    if (!sms) return;
    try {
      const res = await apiClient.patch('/users/me/notification-preferences', { smsAlerts: !sms.smsAlerts });
      setSms({ ...sms, smsAlerts: !!res?.data?.smsAlerts });
    } catch (e: any) { toast.error(e?.message || 'Could not update SMS alerts'); }
  };

  const requestClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { toast.error('Enter your password'); return; }
    setBusy(true);
    try {
      await apiClient.delete('/users/me', { password, reason: closeReason || undefined });
      setCloseSheet(false);
      logout();
      toast.success('Closure requested. Our team will confirm the closure.');
      navigate('/login');
    } catch (e: any) { toast.error(e?.message || 'Could not request closure'); }
    finally { setBusy(false); }
  };

  if (!user) return null;
  const currentDevice = deviceId();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Section title="Sign-in">
        <Row icon={ShieldCheck} title="Two-factor authentication"
          sub={twoFactor === null ? 'Loading…' : twoFactor ? 'On · a code from your authenticator app at sign-in' : 'Off · add an authenticator app code at sign-in'}
          onClick={twoFactor === null || busy ? undefined : twoFactor ? () => { setCode(''); setPassword(''); setTwoFaSheet('disable'); } : startTwoFactor}
          right={twoFactor === null ? null : <span className="text-xs font-semibold" style={{ color: twoFactor ? '#10B981' : 'var(--accent-text)' }}>{twoFactor ? 'Turn off' : 'Turn on'}</span>} />
        <Row icon={Lock} title="Change password" sub="Update your login password" href="/profile/change-password" />
      </Section>

      <Section title="Transaction PIN">
        <div className="px-4 py-3.5">
          <p className="text-sm font-medium text-[var(--text-primary)]">Ask for my PIN</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {PIN_OPTIONS.map(o => {
              const on = (user.pinRequirement ?? 'always') === o.value;
              return (
                <button key={o.value} type="button" onClick={() => setPinRequirement(o.value)} aria-pressed={on}
                  className="rounded-xl px-3 py-2.5 text-left"
                  style={on ? { border: '2px solid #6fe8d6', background: 'rgba(111,232,214,0.08)' } : { border: '1px solid var(--border)' }}>
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">{o.label}</span>
                  <span className="block text-[11px] text-[var(--text-tertiary)]">{o.sub}</span>
                </button>
              );
            })}
          </div>
        </div>
        <Row icon={KeyRound} title="Change transaction PIN" sub="4-digit PIN" href="/profile/change-pin" />
      </Section>

      <Section title="Alerts">
        <Row icon={MessageSquare} title="SMS alerts"
          sub={!sms ? 'Loading…' : sms.hasPhone ? 'A text for every debit and credit (in-app and email alerts are always on)' : 'Add a phone number to your profile to get SMS alerts'}
          onClick={sms?.hasPhone ? toggleSms : undefined}
          right={sms?.hasPhone ? (
            <span className="relative inline-flex h-6 w-10 rounded-full p-0.5 transition-colors" style={{ background: sms.smsAlerts ? '#6fe8d6' : 'var(--surface-tertiary)' }} role="switch" aria-checked={sms.smsAlerts}>
              <span className={`h-5 w-5 rounded-full bg-white transition-transform ${sms.smsAlerts ? 'translate-x-4' : ''}`} />
            </span>
          ) : null} />
      </Section>

      <Section title="Signed-in sessions">
        {!loaded ? <p className="p-4 text-sm text-[var(--text-secondary)]">Loading…</p>
          : sessions.length === 0 ? <p className="p-4 text-sm text-[var(--text-secondary)]">No active sessions.</p>
          : sessions.map(s => (
            <Row key={s.id} icon={Smartphone} title={s.deviceName} sub={`${s.ipAddress} · ${formatTimeAgo(s.createdAt)}`}
              right={s.isCurrent ? <span className="rounded bg-[#10B981]/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[#10B981]">This browser</span>
                : <button type="button" onClick={() => revokeSession(s)} className="text-xs font-medium text-[#EF4444] hover:underline">Sign out</button>} />
          ))}
      </Section>
      {sessions.length > 1 && (
        <button type="button" onClick={revokeOthers} className="-mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 text-sm font-medium text-[#EF4444]">
          Sign out all other sessions
        </button>
      )}

      <Section title="Trusted devices">
        {devices.length === 0 ? <p className="p-4 text-sm text-[var(--text-secondary)]">{loaded ? 'No trusted devices yet.' : 'Loading…'}</p>
          : devices.map(d => (
            <Row key={d.id} icon={Smartphone} title={d.name} sub={`Last used ${formatTimeAgo(d.lastSeenAt)} · new devices need an email code`}
              right={d.deviceId === currentDevice ? <span className="rounded bg-[#10B981]/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[#10B981]">This browser</span>
                : <button type="button" onClick={() => forgetDevice(d)} className="text-xs font-medium text-[#EF4444] hover:underline">Forget</button>} />
          ))}
      </Section>

      <Section title="Account">
        <Row icon={Trash2} title="Close my account" sub="Ask us to close your RCCGPay account" danger onClick={() => { setPassword(''); setCloseReason(''); setCloseSheet(true); }} />
      </Section>

      {twoFaSheet && (
        <Sheet title={twoFaSheet === 'setup' ? 'Turn on two-factor' : 'Turn off two-factor'} onClose={() => setTwoFaSheet(null)}>
          <form onSubmit={confirmTwoFactor} className="space-y-4">
            {twoFaSheet === 'setup' && setup && (
              <>
                <p className="text-sm text-[var(--text-secondary)]">Scan this with an authenticator app (Google Authenticator, 1Password, Authy…), then enter the 6-digit code it shows.</p>
                <img src={setup.qrCodeDataUrl} alt="Two-factor QR code" className="mx-auto h-48 w-48 rounded-xl bg-white p-2" />
                <p className="break-all text-center font-mono text-xs text-[var(--text-tertiary)]">Or enter this key: {setup.secret}</p>
              </>
            )}
            {twoFaSheet === 'disable' && (
              <input type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-2xl px-4 py-3 outline-none" style={field} />
            )}
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-2xl px-4 py-3 text-center font-mono text-lg tracking-[0.4em] outline-none" style={field} />
            <button type="submit" disabled={busy} className="w-full rounded-2xl py-3.5 text-sm font-black disabled:opacity-50" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
              {busy ? 'Checking…' : twoFaSheet === 'setup' ? 'Turn on' : 'Turn off'}
            </button>
          </form>
        </Sheet>
      )}

      {closeSheet && (
        <Sheet title="Close my account" onClose={() => setCloseSheet(false)}>
          <form onSubmit={requestClosure} className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">You’ll be signed out everywhere and our team will confirm the closure. Withdraw your balance first.</p>
            <input type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 outline-none" style={field} />
            <textarea placeholder="Why are you leaving? (optional)" value={closeReason} onChange={e => setCloseReason(e.target.value)} maxLength={500}
              className="min-h-[80px] w-full rounded-2xl px-4 py-3 outline-none" style={field} />
            <button type="submit" disabled={busy} className="w-full rounded-2xl py-3.5 text-sm font-black text-white disabled:opacity-50" style={{ background: '#EF4444' }}>
              {busy ? 'Sending…' : 'Request closure'}
            </button>
          </form>
        </Sheet>
      )}
      {pinDialog}
    </div>
  );
}
