import React, { useCallback, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';

export interface ConfirmField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
}

export interface ConfirmActionOptions {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  /** 'danger' for reject / suspend / lock, 'success' for approve / activate */
  tone?: 'danger' | 'success';
  /** Ask the admin for a note; required before they can confirm */
  requireNote?: boolean;
  /** Offer a note that may be left empty (e.g. an approval comment) */
  optionalNote?: boolean;
  noteLabel?: string;
  notePlaceholder?: string;
  /** Extra inputs (outcome, amount, …) returned in `values` */
  fields?: ConfirmField[];
  /** High-risk action: ask admins with two-factor for a fresh authenticator code */
  stepUp?: boolean;
}

export interface ConfirmActionResult {
  note?: string;
  /** Authenticator code for X-Admin-OTP (only when stepUp and the admin has two-factor) */
  otp?: string;
  values: Record<string, string>;
}

const MIN_NOTE_LENGTH = 5;

const TONES = {
  danger: { bg: '#b91c1c', hover: '#991b1b' },
  success: { bg: '#0f766e', hover: '#115e59' },
} as const;

const INPUT = 'w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ad-accent-ring)]';

/**
 * Promise-based confirmation for admin actions.
 *
 *   const { confirm, dialog } = useConfirmAction();
 *   const result = await confirm({ title, description, confirmLabel, requireNote: true, stepUp: true });
 *   if (!result) return; // cancelled
 *   doThing(result.note, { otp: result.otp });
 *
 * Render `{dialog}` once anywhere in the component.
 */
export function useConfirmAction() {
  const twoFactorEnabled = useAdminAuthStore((s) => !!s.admin?.twoFactorEnabled);
  const [options, setOptions] = useState<ConfirmActionOptions | null>(null);
  const [note, setNote] = useState('');
  const [otp, setOtp] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const resolver = useRef<((r: ConfirmActionResult | null) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmActionOptions) => {
    setOptions(opts);
    setNote('');
    setOtp('');
    setValues(Object.fromEntries((opts.fields ?? []).map((f) => [f.name, f.defaultValue ?? ''])));
    setTouched(false);
    return new Promise<ConfirmActionResult | null>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: ConfirmActionResult | null) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  };

  const trimmed = note.trim();
  const noteInvalid = !!options?.requireNote && trimmed.length < MIN_NOTE_LENGTH;
  const needsOtp = !!options?.stepUp && twoFactorEnabled;
  const otpInvalid = needsOtp && !/^\d{6}$/.test(otp);
  const fieldErrors = Object.fromEntries((options?.fields ?? []).map((f) => {
    const v = (values[f.name] ?? '').trim();
    if (f.required && !v) return [f.name, 'Required'];
    if (f.type === 'number' && v && !(Number(v) > 0)) return [f.name, 'Enter a positive number'];
    return [f.name, null];
  }));
  const fieldsInvalid = Object.values(fieldErrors).some(Boolean);
  const tone = TONES[options?.tone ?? 'danger'];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (noteInvalid || otpInvalid || fieldsInvalid) return;
    close({
      note: options?.requireNote || options?.optionalNote ? trimmed || undefined : undefined,
      otp: needsOtp ? otp : undefined,
      values: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])),
    });
  };

  const border = (bad: boolean) => ({ borderColor: touched && bad ? '#b91c1c' : 'var(--ad-border-strong)', background: 'var(--ad-bg-elev)', color: 'var(--ad-fg-strong)' });

  const dialog = (
    <Dialog open={!!options} onOpenChange={(open) => !open && close(null)}>
      <DialogContent
        className="admin-portal sm:max-w-md"
        style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)', color: 'var(--ad-fg)' }}
      >
        {options && (
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--ad-fg-strong)' }}>{options.title}</DialogTitle>
              <DialogDescription asChild>
                <div className="text-sm" style={{ color: 'var(--ad-muted)' }}>{options.description}</div>
              </DialogDescription>
            </DialogHeader>

            {(options.fields ?? []).map((f, i) => (
              <div key={f.name} className="space-y-1.5">
                <label htmlFor={`confirm-field-${f.name}`} className="text-xs font-semibold" style={{ color: 'var(--ad-fg-strong)' }}>
                  {f.label}{f.required && <span style={{ color: '#b91c1c' }}> *</span>}
                </label>
                {f.type === 'select' ? (
                  <select
                    id={`confirm-field-${f.name}`}
                    autoFocus={i === 0}
                    value={values[f.name] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    className={`${INPUT} h-9`}
                    style={border(!!fieldErrors[f.name])}
                  >
                    <option value="">Choose…</option>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input
                    id={`confirm-field-${f.name}`}
                    autoFocus={i === 0}
                    type={f.type === 'number' ? 'number' : 'text'}
                    inputMode={f.type === 'number' ? 'decimal' : undefined}
                    step={f.type === 'number' ? '0.01' : undefined}
                    value={values[f.name] ?? ''}
                    placeholder={f.placeholder}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    className={`${INPUT} h-9`}
                    style={border(!!fieldErrors[f.name])}
                  />
                )}
                {touched && fieldErrors[f.name] ? (
                  <p className="text-xs" style={{ color: '#b91c1c' }}>{fieldErrors[f.name]}</p>
                ) : f.hint ? <p className="text-xs" style={{ color: 'var(--ad-muted)' }}>{f.hint}</p> : null}
              </div>
            ))}

            {(options.requireNote || options.optionalNote) && (
              <div className="space-y-1.5">
                <label htmlFor="confirm-action-note" className="text-xs font-semibold" style={{ color: 'var(--ad-fg-strong)' }}>
                  {options.noteLabel ?? 'Reason'} {options.requireNote ? <span style={{ color: '#b91c1c' }}>*</span> : <span style={{ color: 'var(--ad-muted)' }}>(optional)</span>}
                </label>
                <textarea
                  id="confirm-action-note"
                  autoFocus={!options.fields?.length}
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder={options.notePlaceholder ?? 'Explain why. This is saved to the audit log.'}
                  className={`${INPUT} resize-none py-2.5`}
                  style={border(noteInvalid)}
                />
                {touched && noteInvalid && (
                  <p className="text-xs font-medium" style={{ color: '#b91c1c' }}>
                    Please add a reason (at least {MIN_NOTE_LENGTH} characters).
                  </p>
                )}
              </div>
            )}

            {needsOtp && (
              <div className="space-y-1.5">
                <label htmlFor="confirm-action-otp" className="text-xs font-semibold" style={{ color: 'var(--ad-fg-strong)' }}>
                  Authenticator code <span style={{ color: '#b91c1c' }}>*</span>
                </label>
                <input
                  id="confirm-action-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  className={`${INPUT} h-9 font-mono tracking-[0.3em]`}
                  style={border(otpInvalid)}
                />
                <p className="text-xs" style={{ color: 'var(--ad-muted)' }}>High-risk action: confirm it’s you.</p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <button
                type="button"
                onClick={() => close(null)}
                className="h-9 rounded-lg px-4 text-sm font-semibold transition-colors hover:bg-[var(--ad-card-hover)]"
                style={{ border: '1px solid var(--ad-border-strong)', color: 'var(--ad-fg-strong)', background: 'var(--ad-card)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={touched && (noteInvalid || otpInvalid || fieldsInvalid)}
                className="h-9 rounded-lg px-4 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ background: tone.bg }}
                onMouseEnter={(e) => (e.currentTarget.style.background = tone.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = tone.bg)}
              >
                {options.confirmLabel}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );

  return { confirm, dialog };
}
