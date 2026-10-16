/**
 * Merchant payouts (mobile app: Payouts): money available in the business wallet, the bank account it
 * goes to (name-checked), the automatic schedule, withdraw now, and real payout history.
 * Every change and withdrawal needs the transaction PIN. Backend: /merchants/payouts/*.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BadgeCheck, Building2, Landmark, PauseCircle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { usePinPrompt } from '@/components/ui/pin-prompt';
import toast from 'react-hot-toast';

type Schedule = 'instant' | 'daily' | 'weekly' | 'monthly' | 'manual';
interface Settings {
  schedule: Schedule; weekday: number | null; monthDay: number | null; minimum: number; reserve: number;
  bankAccount: { accountName: string; accountNumber: string; bankCode: string; bankName: string | null; verified: boolean } | null;
  balance: { walletBalance: number; reserve: number; inTransit: number; available: number; fee: number };
  nextPayoutAt: string | null; automaticPayoutsResumeAt: string | null; paused: { since: string; reason: string | null } | null;
}
interface Payout { id: string; reference: string; trigger: string; amount: number | string; fee: number | string; status: string; accountName: string; failureReason: string | null; createdAt: string }
interface Bank { code: string; name: string }

const SCHEDULES: { id: Schedule; label: string }[] = [
  { id: 'manual', label: 'Manual' }, { id: 'instant', label: 'Instant' }, { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' },
];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const naira = (n: number | string) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
const unwrap = (r: any) => r?.data ?? r;
const card = { background: 'var(--card)', border: '1px solid var(--border)' } as const;
const input = { background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const;

export default function PayoutsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [history, setHistory] = useState<Payout[]>([]);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState<'schedule' | 'bank' | 'withdraw' | null>(null);
  const { askPin, pinDialog } = usePinPrompt();

  const [form, setForm] = useState({ schedule: 'manual' as Schedule, weekday: 5, monthDay: 1, minimum: '', reserve: '' });
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [bankError, setBankError] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const load = async () => {
    try {
      const [s, h] = await Promise.all([apiClient.get('/merchants/payouts/settings'), apiClient.get('/merchants/payouts?limit=20').catch(() => null)]);
      const st = unwrap(s) as Settings;
      setSettings(st);
      setForm({ schedule: st.schedule, weekday: st.weekday ?? 5, monthDay: st.monthDay ?? 1, minimum: st.minimum ? String(st.minimum) : '', reserve: st.reserve ? String(st.reserve) : '' });
      setHistory(unwrap(h)?.payouts ?? []);
    } catch (e) {
      setError((e as Error)?.message || 'Could not load payouts');
    }
  };
  useEffect(() => { void load(); }, []);

  // Check the account name as soon as a bank and 10-digit number are in.
  useEffect(() => {
    setAccountName('');
    if (accountNumber.length !== 10 || !bankCode) return;
    let live = true;
    setResolving(true); setBankError('');
    apiClient.post('/transfers/resolve-account', { accountNumber, bankCode })
      .then((r) => live && setAccountName(unwrap(r)?.accountName ?? ''))
      .catch((e) => live && setBankError(e?.message || 'Could not check that account'))
      .finally(() => live && setResolving(false));
    return () => { live = false; };
  }, [accountNumber, bankCode]);

  const openBank = async () => {
    setSheet('bank'); setBankError('');
    if (!banks.length) {
      try { setBanks(unwrap(await apiClient.get('/transfers/banks'))?.banks ?? []); } catch (e) { setBankError((e as Error)?.message || 'Could not load banks'); }
    }
  };

  const save = async (body: Record<string, unknown>, success: string) => {
    setSheet(null);
    const res = await askPin({ title: 'Confirm with your PIN', description: 'Required to change payout settings' },
      async (pin) => unwrap(await apiClient.put('/merchants/payouts/settings', { ...body, pin })) as Settings);
    if (res) { setSettings(res); toast.success(success); }
  };

  const withdraw = async () => {
    const amount = Number(withdrawAmount) || undefined;
    setSheet(null);
    const key = crypto.randomUUID(); // one key per withdrawal: a retry can never pay twice
    const res = await askPin({ title: 'Withdraw to bank', description: `${naira(amount ?? settings?.balance.available ?? 0)} to ${settings?.bankAccount?.accountName}` },
      async (pin) => unwrap(await apiClient.postIdempotent('/merchants/payouts/withdraw', { pin, amount }, key)));
    if (res?.settlement) {
      toast.success(`Payout started: ${naira(res.settlement.amount)} to ${res.settlement.accountName}. It’s final when the bank confirms.`);
      await load();
    }
  };

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!settings) return <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: '#6fe8d6' }} /></div>;
  const canWithdraw = !!settings.bankAccount && settings.balance.available > 0 && !settings.paused;
  const statusColor = (s: string) => (s === 'success' ? '#10b981' : s === 'failed' || s === 'reversed' ? '#ef4444' : '#f59e0b');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {settings.paused && (
        <p className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
          <PauseCircle size={16} /> Payouts are paused by BadePay{settings.paused.reason ? `: ${settings.paused.reason}` : ''}.
        </p>
      )}
      <div className="rounded-3xl p-5" style={card}>
        <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Available to pay out</p>
        <p className="mt-1 text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{naira(settings.balance.available)}</p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Balance {naira(settings.balance.walletBalance)} · Reserve {naira(settings.balance.reserve)}{settings.balance.fee ? ` · Fee ${naira(settings.balance.fee)}` : ''}{settings.balance.inTransit ? ` · In transit ${naira(settings.balance.inTransit)}` : ''}
        </p>
        {settings.nextPayoutAt && settings.schedule !== 'manual' && <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Next automatic payout {when(settings.nextPayoutAt)}</p>}
        {settings.automaticPayoutsResumeAt && <p className="mt-1 text-xs" style={{ color: '#f59e0b' }}>New bank account — automatic payouts resume {when(settings.automaticPayoutsResumeAt)}</p>}
        <button type="button" disabled={!canWithdraw} onClick={() => { setWithdrawAmount(''); setSheet('withdraw'); }}
          className="mt-4 h-11 w-full rounded-xl text-sm font-black disabled:opacity-50" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          Withdraw to bank
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl" style={card}>
        <button type="button" onClick={openBank} className="flex w-full items-center gap-3 px-4 py-4 text-left" style={{ borderBottom: '1px solid var(--border)' }}>
          <Landmark size={18} style={{ color: 'var(--text-tertiary)' }} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Payout account</span>
            {settings.bankAccount
              ? <span className="block truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{settings.bankAccount.bankName ?? settings.bankAccount.bankCode} · {settings.bankAccount.accountNumber} · {settings.bankAccount.accountName}</span>
              : <span className="block text-xs" style={{ color: '#f59e0b' }}>Add a bank account to receive payouts</span>}
          </span>
          {settings.bankAccount?.verified && <BadgeCheck size={16} style={{ color: '#10b981' }} />}
        </button>
        <button type="button" onClick={() => setSheet('schedule')} className="flex w-full items-center gap-3 px-4 py-4 text-left">
          <Building2 size={18} style={{ color: 'var(--text-tertiary)' }} />
          <span className="flex-1">
            <span className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Schedule</span>
            <span className="block text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
              {settings.schedule}{settings.schedule === 'weekly' && settings.weekday ? ` · ${WEEKDAYS[settings.weekday - 1]}` : ''}{settings.schedule === 'monthly' && settings.monthDay ? ` · day ${settings.monthDay}` : ''}{settings.minimum ? ` · min ${naira(settings.minimum)}` : ''}
            </span>
          </span>
        </button>
      </div>

      <section>
        <p className="mb-2 px-1 text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>History</p>
        <div className="overflow-hidden rounded-2xl" style={card}>
          {!history.length && <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No payouts yet.</p>}
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{naira(h.amount)}</p>
                <p className="text-[11px] capitalize" style={{ color: 'var(--text-tertiary)' }}>{h.trigger} · {when(h.createdAt)}</p>
                {h.failureReason && <p className="text-[11px]" style={{ color: '#ef4444' }}>{h.failureReason}</p>}
              </div>
              <span className="text-xs font-semibold capitalize" style={{ color: statusColor(h.status) }}>{h.status}</span>
            </div>
          ))}
        </div>
      </section>

      {sheet && createPortal(
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={(e) => e.target === e.currentTarget && setSheet(null)} role="dialog" aria-modal="true">
          <div className="w-full max-w-md space-y-4 rounded-t-3xl p-5 sm:rounded-3xl" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
            {sheet === 'schedule' && (
              <>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Payout schedule</p>
                <div className="flex flex-wrap gap-2">
                  {SCHEDULES.map((s) => (
                    <button key={s.id} type="button" onClick={() => setForm({ ...form, schedule: s.id })} className="h-9 rounded-full px-4 text-xs font-semibold"
                      style={form.schedule === s.id ? { background: '#6fe8d6', color: '#1a1a1a' } : input}>{s.label}</button>
                  ))}
                </div>
                {form.schedule === 'weekly' && (
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS.map((d, i) => (
                      <button key={d} type="button" onClick={() => setForm({ ...form, weekday: i + 1 })} className="h-9 rounded-lg text-xs font-semibold"
                        style={form.weekday === i + 1 ? { background: '#6fe8d6', color: '#1a1a1a' } : input}>{d}</button>
                    ))}
                  </div>
                )}
                {form.schedule === 'monthly' && (
                  <label className="block text-xs" style={{ color: 'var(--text-secondary)' }}>Day of month (1–28)
                    <input type="number" min={1} max={28} value={form.monthDay} onChange={(e) => setForm({ ...form, monthDay: Math.min(28, Math.max(1, Number(e.target.value) || 1)) })} className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={input} />
                  </label>
                )}
                {form.schedule !== 'manual' && (
                  <label className="block text-xs" style={{ color: 'var(--text-secondary)' }}>Minimum payout (₦, optional)
                    <input type="number" min={0} value={form.minimum} onChange={(e) => setForm({ ...form, minimum: e.target.value })} className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={input} />
                  </label>
                )}
                <label className="block text-xs" style={{ color: 'var(--text-secondary)' }}>Keep in wallet — reserve (₦)
                  <input type="number" min={0} value={form.reserve} onChange={(e) => setForm({ ...form, reserve: e.target.value })} className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={input} />
                </label>
                <button type="button" onClick={() => save({
                  schedule: form.schedule,
                  weekday: form.schedule === 'weekly' ? form.weekday : undefined,
                  monthDay: form.schedule === 'monthly' ? form.monthDay : undefined,
                  minimum: Number(form.minimum) || undefined,
                  reserve: form.reserve === '' ? undefined : Number(form.reserve),
                }, 'Payout schedule saved')} className="h-11 w-full rounded-xl text-sm font-black" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>Save</button>
              </>
            )}
            {sheet === 'bank' && (
              <>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Payout account</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>The account name must match you or your business. Automatic payouts pause for a short while after a change.</p>
                <select aria-label="Bank" value={bankCode} onChange={(e) => setBankCode(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={input}>
                  <option value="">Select bank…</option>
                  {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
                <input inputMode="numeric" maxLength={10} placeholder="10-digit account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={input} aria-label="Account number" />
                {resolving && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Checking the account…</p>}
                {accountName && <p className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}><BadgeCheck size={15} /> {accountName}</p>}
                {bankError && <p className="text-xs text-red-400">{bankError}</p>}
                <button type="button" disabled={!accountName} onClick={() => save({ bankAccount: { accountNumber, bankCode, bankName: banks.find((b) => b.code === bankCode)?.name } }, 'Bank account saved')}
                  className="h-11 w-full rounded-xl text-sm font-black disabled:opacity-50" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>Save account</button>
              </>
            )}
            {sheet === 'withdraw' && (
              <>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Withdraw to bank</p>
                <input type="number" min={0} placeholder={`Up to ${naira(settings.balance.available)}`} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={input} aria-label="Amount" />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Leave empty to withdraw everything available. The payout is final only when the bank confirms it.</p>
                <button type="button" onClick={withdraw} className="h-11 w-full rounded-xl text-sm font-black" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>Withdraw</button>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
      {pinDialog}
    </div>
  );
}
