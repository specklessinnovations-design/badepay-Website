/**
 * Asks for the 4-digit transaction PIN and runs the action with it. Shows the server's error
 * (wrong PIN, locked…) in place so the person can try again.
 *
 *   const { askPin, pinDialog } = usePinPrompt();
 *   const result = await askPin({ title: 'Confirm', description: '…' }, (pin) => api.call(pin));
 */
import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, X } from 'lucide-react';

interface Ask { title: string; description?: string }

export function usePinPrompt() {
  const [ask, setAsk] = useState<Ask | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const action = useRef<((pin: string) => Promise<unknown>) | null>(null);
  const done = useRef<((v: unknown) => void) | null>(null);

  const askPin = useCallback(<T,>(a: Ask, run: (pin: string) => Promise<T>) => new Promise<T | null>((resolve) => {
    action.current = run as (pin: string) => Promise<unknown>;
    done.current = resolve as (v: unknown) => void;
    setPin(''); setError(''); setAsk(a);
  }), []);

  const close = (v: unknown) => { done.current?.(v); done.current = null; setAsk(null); };
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!/^\d{4}$/.test(pin)) return setError('Enter your 4-digit PIN');
    setBusy(true); setError('');
    try {
      close(await action.current!(pin));
    } catch (err) {
      setError((err as Error)?.message || 'That didn’t work. Please try again.');
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  const pinDialog = ask && typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" style={{ background: 'rgba(0,0,0,0.6)' }} role="dialog" aria-modal="true" aria-label={ask.title}>
      <form onSubmit={submit} className="w-full max-w-sm rounded-t-3xl p-5 sm:rounded-3xl" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}><Lock size={15} /> {ask.title}</p>
          <button type="button" aria-label="Cancel" onClick={() => close(null)} className="rounded-full p-1.5" style={{ background: 'var(--surface-secondary)' }}><X size={15} /></button>
        </div>
        {ask.description && <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{ask.description}</p>}
        <input autoFocus type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} aria-label="Transaction PIN"
          className="mt-4 w-full rounded-xl px-4 py-3 text-center font-mono text-2xl tracking-[0.6em] outline-none"
          style={{ background: 'var(--surface-secondary)', border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`, color: 'var(--text-primary)' }} />
        {error && <p className="mt-2 text-xs text-red-400" role="alert">{error}</p>}
        <button type="submit" disabled={busy || pin.length !== 4} className="mt-4 h-11 w-full rounded-xl text-sm font-black disabled:opacity-50" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          {busy ? 'Confirming…' : 'Confirm'}
        </button>
      </form>
    </div>,
    document.body,
  ) : null;

  return { askPin, pinDialog };
}
