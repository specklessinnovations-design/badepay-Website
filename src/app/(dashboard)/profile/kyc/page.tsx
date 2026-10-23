/**
 * Verification levels and limits (mobile app: Kyc).
 * Level 1: BVN + date of birth (POST /kyc/bvn) · Level 2: NIN + live selfie (POST /kyc/nin) · Level 3: by our team.
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Check, Clock, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import apiClient from '@/lib/apiClient';
import { resizeImage } from '@/lib/resizeImage';

interface Limits { perTransaction: number; daily: number; monthly: number }
interface Status { kycLevel: number; kycStatus: string; limits: Limits; nextStep?: string | null }
interface Tier { level: number; name: string; requirement: string; dailyLimit: number }

const short = (n: number) => (n >= 1_000_000 ? `₦${+(n / 1_000_000).toFixed(1)}m` : n >= 1000 ? `₦${+(n / 1000).toFixed(1)}k` : `₦${n}`);
const field = { background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const;

const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result));
  r.onerror = () => reject(new Error('Could not read that photo'));
  r.readAsDataURL(file);
});

export default function KycPage() {
  const initializeSession = useAuthStore(s => s.initializeSession);
  const [status, setStatus] = useState<Status | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [sheet, setSheet] = useState<'bvn' | 'nin' | null>(null);
  const [number, setNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selfie, setSelfie] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const camera = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [s, t] = await Promise.allSettled([apiClient.get('/kyc/status'), apiClient.get('/kyc/limits')]);
    if (s.status === 'fulfilled') setStatus(s.value?.data ?? null);
    if (t.status === 'fulfilled') setTiers(t.value?.data?.tiers ?? []);
  };
  useEffect(() => { void load(); }, []);

  const level = status?.kycLevel ?? 0;
  const state = (lvl: number) => (level >= lvl ? 'done' : level === lvl - 1 ? 'current' : 'locked');

  const open = (kind: 'bvn' | 'nin') => { setSheet(kind); setNumber(''); setSelfie(null); setError(''); };

  const onSelfie = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { setSelfie(await toDataUrl(await resizeImage(file, 900))); }
    catch (err: any) { setError(err?.message || 'Could not use that photo'); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = !/^\d{11}$/.test(number) ? `${sheet === 'bvn' ? 'BVN' : 'NIN'} must be 11 digits`
      : sheet === 'bvn' && !dateOfBirth ? 'Select your date of birth'
      : sheet === 'nin' && !selfie ? 'Take a selfie to continue' : '';
    setError(problem);
    if (problem) return;
    setSubmitting(true);
    try {
      const res = sheet === 'bvn'
        ? await apiClient.post('/kyc/bvn', { bvn: number, dateOfBirth })
        : await apiClient.post('/kyc/nin', { nin: number, selfie });
      setSheet(null);
      if (res?.data?.submission?.status === 'approved') toast.success(res?.message || 'Verified');
      else toast(res?.message || 'Thanks, we’re reviewing your details.');
      await Promise.all([load(), initializeSession().catch(() => {})]);
    } catch (err: any) {
      setError(err?.message || 'We could not verify these details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-3xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>Current level</p>
        <p className="mt-1 text-[28px] font-bold" style={{ color: 'var(--text-primary)' }}>{status ? `Level ${level}` : '…'}</p>
        {status && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {([['Per payment', status.limits.perTransaction], ['Daily', status.limits.daily], ['Monthly', status.limits.monthly]] as const).map(([label, v]) => (
              <div key={label} className="rounded-xl p-2.5" style={{ background: 'var(--surface-secondary)' }}>
                <p className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{short(v)}</p>
              </div>
            ))}
          </div>
        )}
        {status?.nextStep && <p className="mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{status.nextStep}</p>}
      </div>

      <div className="space-y-3">
        {tiers.filter(t => t.level > 0).map(t => {
          const st = state(t.level);
          return (
            <div key={t.level} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={st === 'done' ? { background: 'rgba(16,185,129,0.15)', color: '#10B981' } : st === 'current' ? { background: 'rgba(111,232,214,0.18)', color: '#0b7367' } : { background: 'var(--surface-secondary)', color: 'var(--text-tertiary)' }}>
                {st === 'done' ? <Check size={18} /> : t.level === 3 && st === 'current' ? <Clock size={18} /> : st === 'locked' ? <Lock size={15} /> : <span className="text-sm font-bold">{t.level}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                <p className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>{t.requirement} · {short(t.dailyLimit)}/day</p>
              </div>
              {(t.level === 1 || t.level === 2) && st === 'current' && (
                <button type="button" onClick={() => open(t.level === 1 ? 'bvn' : 'nin')} className="rounded-full px-4 py-2 text-xs font-bold" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>Verify</button>
              )}
            </div>
          );
        })}
      </div>

      <p className="rounded-2xl p-4 text-xs" style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
        Your BVN and NIN are checked with an identity verification provider. RCCGPay never stores the full numbers.
      </p>

      {sheet && createPortal(
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={sheet === 'bvn' ? 'Verify your BVN' : 'Verify your NIN'}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setSheet(null)} />
          <form onSubmit={submit} className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{sheet === 'bvn' ? 'Verify your BVN' : 'Verify your NIN'}</h2>
              <button type="button" onClick={() => setSheet(null)} aria-label="Close" style={{ color: 'var(--text-tertiary)' }}><X size={18} /></button>
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {sheet === 'bvn' ? 'Dial *565*0# on the phone linked to your bank to get your BVN.' : 'Enter your NIN and take a clear selfie in good light. It’s matched with your NIN photo.'}
            </p>
            <label className="mt-4 block text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{sheet === 'bvn' ? 'BVN' : 'NIN'}</label>
            <input inputMode="numeric" maxLength={11} placeholder="11 digits" value={number} autoComplete="off"
              onChange={e => setNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="mt-2 w-full rounded-2xl px-4 py-3 outline-none" style={field} />
            {sheet === 'bvn' && (
              <>
                <label className="mt-4 block text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Date of birth</label>
                <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} max={new Date().toISOString().slice(0, 10)}
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none" style={field} />
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>As registered with your bank.</p>
              </>
            )}
            {sheet === 'nin' && (
              <>
                <input ref={camera} type="file" accept="image/*" capture="user" className="hidden" onChange={onSelfie} />
                <button type="button" onClick={() => camera.current?.click()}
                  className="mt-4 flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                  {selfie ? <img src={selfie} alt="Your selfie" className="h-full w-full object-cover" />
                    : <span className="flex flex-col items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}><Camera size={26} /> Take a selfie</span>}
                </button>
              </>
            )}
            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={submitting} className="mt-6 w-full rounded-2xl py-3.5 text-sm font-black disabled:opacity-50" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
              {submitting ? 'Checking…' : 'Submit'}
            </button>
          </form>
        </div>,
        document.body,
      )}
    </div>
  );
}
