/**
 * Admin portal design system. Every admin page builds from these so spacing, colour, states and
 * keyboard behaviour stay consistent. Colours come from the --ad-* tokens in index.css.
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'wouter';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { humanize } from '@/lib/adminFormat';

import { cn } from '@/lib/utils';

/** Class merge that lets a caller's classes override the defaults (e.g. w-auto over w-full). */
const cx = cn;

// ─── Layout ────────────────────────────────────────────────────────────────────

export function PageHeader({
  eyebrow, title, description, actions,
}: { eyebrow?: string; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ad-muted)]">{eyebrow}</p>}
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[var(--ad-fg-strong)]">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-[var(--ad-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title, description, actions, children, className, bodyClassName, id,
}: {
  title?: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; children?: React.ReactNode;
  className?: string; bodyClassName?: string; id?: string;
}) {
  return (
    <section id={id} className={cx('ad-card overflow-hidden', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--ad-border)] px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-[var(--ad-fg-strong)]">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-[var(--ad-muted)]">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx(bodyClassName ?? 'p-4')}>{children}</div>
    </section>
  );
}

const TONES = {
  neutral: 'bg-[rgba(15,23,42,0.06)] text-[#374151]',
  success: 'bg-[rgba(4,120,87,0.10)] text-[#047857]',
  warning: 'bg-[rgba(180,83,9,0.10)] text-[#b45309]',
  danger: 'bg-[rgba(185,28,28,0.10)] text-[#b91c1c]',
  info: 'bg-[rgba(29,78,216,0.10)] text-[#1d4ed8]',
  accent: 'bg-[rgba(15,118,110,0.10)] text-[#0f766e]',
  violet: 'bg-[rgba(109,40,217,0.10)] text-[#6d28d9]',
} as const;
export type Tone = keyof typeof TONES;

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', TONES[tone], className)}>
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  success: 'success', successful: 'success', approved: 'success', verified: 'success', active: 'success', executed: 'success',
  resolved: 'success', completed: 'success', delivered: 'success', paid: 'success', clear: 'success', met: 'success', published: 'success',
  pending: 'warning', open: 'warning', review: 'warning', under_review: 'warning', held: 'warning', unverified: 'neutral',
  processing: 'info', queued: 'info', running: 'info', in_progress: 'info', draft: 'neutral',
  failed: 'danger', failure: 'danger', rejected: 'danger', suspended: 'danger', reversed: 'violet', denied: 'danger',
  locked: 'danger', hit: 'danger', overdue: 'danger', breached: 'danger', disabled: 'danger',
  cancelled: 'neutral', closed: 'neutral', revoked: 'neutral', used: 'neutral', unavailable: 'neutral',
};

/** One badge style per status across the whole portal. */
export function StatusBadge({ status, label }: { status: string | null | undefined; label?: string }) {
  const key = (status ?? '').toLowerCase();
  return <Badge tone={STATUS_TONE[key] ?? 'neutral'}>{label ?? humanize(status)}</Badge>;
}

// ─── Controls ──────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
const BUTTON: Record<ButtonVariant, string> = {
  primary: 'bg-[#0f766e] text-white hover:bg-[#115e59] border border-[#0f766e]',
  success: 'bg-[#047857] text-white hover:bg-[#065f46] border border-[#047857]',
  danger: 'bg-[#b91c1c] text-white hover:bg-[#991b1b] border border-[#b91c1c]',
  secondary: 'bg-[var(--ad-card)] text-[var(--ad-fg-strong)] hover:bg-[var(--ad-card-hover)] border border-[var(--ad-border-strong)]',
  ghost: 'bg-transparent text-[var(--ad-fg)] hover:bg-[rgba(15,23,42,0.05)] border border-transparent',
};

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant; size?: 'sm' | 'md'; loading?: boolean; icon?: React.ReactNode;
}>(function Button({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)] focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
        BUTTON[variant], className,
      )}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
});

const FIELD = 'w-full rounded-lg border border-[var(--ad-border-strong)] bg-[var(--ad-card)] px-3 text-sm text-[var(--ad-fg-strong)] placeholder:text-[var(--ad-muted-soft)] focus:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[var(--ad-accent-ring)] disabled:opacity-60';

export function Field({ label, hint, error, children, required }: {
  label: string; hint?: React.ReactNode; error?: string | null; children: (id: string) => React.ReactNode; required?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-semibold text-[var(--ad-fg-strong)]">
        {label}{required && <span className="text-[#b91c1c]"> *</span>}
      </label>
      {children(id)}
      {error ? <p className="text-xs text-[#b91c1c]">{error}</p> : hint ? <p className="text-xs text-[var(--ad-muted)]">{hint}</p> : null}
    </div>
  );
}

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cx(FIELD, 'h-9', className)} {...rest} />;
  },
);

export function TextArea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(FIELD, 'py-2', className)} {...rest} />;
}

export function Select({ className, options, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
}) {
  return (
    <select className={cx(FIELD, 'h-9 pr-8', className)} {...rest}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)] disabled:opacity-50',
        checked ? 'bg-[#0f766e]' : 'bg-[#cbd5e1]',
      )}
    >
      <span className={cx('inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
}

export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function SearchInput({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={cx('relative min-w-[200px] flex-1', className)}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ad-muted-soft)]" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        aria-label={placeholder ?? 'Search'}
        className={cx(FIELD, 'h-9 pl-9')}
      />
    </div>
  );
}

/** Segmented filter (status tabs) with optional counts. */
export function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: NoInfer<T>) => void; options: { value: NoInfer<T>; label: string; count?: number }[];
}) {
  return (
    <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-lg border border-[var(--ad-border)] bg-[var(--ad-bg-elev)] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)]',
            value === o.value ? 'bg-[var(--ad-card)] text-[var(--ad-fg-strong)] shadow-sm' : 'text-[var(--ad-muted)] hover:text-[var(--ad-fg-strong)]',
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="rounded bg-[rgba(15,23,42,0.06)] px-1.5 text-[10px]">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs }: {
  value: T; onChange: (v: NoInfer<T>) => void; tabs: { value: NoInfer<T>; label: string; count?: number; hidden?: boolean }[];
}) {
  return (
    <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-[var(--ad-border)]">
      {tabs.filter((t) => !t.hidden).map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)]',
            value === t.value ? 'border-[#0f766e] text-[#0f766e]' : 'border-transparent text-[var(--ad-muted)] hover:text-[var(--ad-fg-strong)]',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-xs text-[var(--ad-muted)]">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ─── Data display ──────────────────────────────────────────────────────────────

export function StatCard({ label, value, hint, href, tone = 'neutral', icon, definition }: {
  label: string; value: React.ReactNode; hint?: React.ReactNode; href?: string; tone?: Tone; icon?: React.ReactNode;
  /** What exactly is counted (shown as a tooltip) */
  definition?: string;
}) {
  const body = (
    <div className="flex h-full flex-col gap-1 p-4" title={definition}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[var(--ad-muted)]">{label}</p>
        {icon && <span className={cx('flex h-7 w-7 items-center justify-center rounded-md', TONES[tone])}>{icon}</span>}
      </div>
      <p className="text-2xl font-bold tracking-tight text-[var(--ad-fg-strong)] tabular-nums">{value}</p>
      {hint && <p className="text-xs text-[var(--ad-muted)]">{hint}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="ad-card block transition-colors hover:border-[#0f766e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)]">
      {body}
    </Link>
  ) : <div className="ad-card">{body}</div>;
}

export function KeyValue({ items, columns = 2 }: { items: { label: string; value: React.ReactNode; hidden?: boolean }[]; columns?: 1 | 2 | 3 }) {
  return (
    <dl className={cx('grid gap-x-6 gap-y-3', columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
      {items.filter((i) => !i.hidden).map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ad-muted)]">{i.label}</dt>
          <dd className="mt-0.5 break-words text-sm text-[var(--ad-fg-strong)]">{i.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({ title = 'Nothing here', description, icon }: { title?: string; description?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(15,23,42,0.05)] text-[var(--ad-muted)]">
        {icon ?? <Inbox size={18} />}
      </div>
      <p className="text-sm font-semibold text-[var(--ad-fg-strong)]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-[var(--ad-muted)]">{description}</p>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong';
  const forbidden = (error as { status?: number })?.status === 403;
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(185,28,28,0.08)] text-[#b91c1c]">
        <AlertTriangle size={18} />
      </div>
      <p className="text-sm font-semibold text-[var(--ad-fg-strong)]">{forbidden ? 'You don’t have access to this' : 'Couldn’t load this'}</p>
      <p className="mt-1 max-w-md text-xs text-[var(--ad-muted)]">{message}</p>
      {onRetry && !forbidden && <Button size="sm" className="mt-3" icon={<RefreshCw size={13} />} onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
  /** Hide on small screens */
  hideOnMobile?: boolean;
}

/** Table with loading, empty and error states. Rows are clickable/keyboard-accessible when onRowClick is set. */
export function DataTable<T>({
  columns, rows, rowKey, onRowClick, loading, error, onRetry, empty, footer, dense,
}: {
  columns: Column<NoInfer<T>>[]; rows: T[] | undefined; rowKey: (row: NoInfer<T>) => string; onRowClick?: (row: NoInfer<T>) => void;
  loading?: boolean; error?: unknown; onRetry?: () => void; empty?: React.ReactNode; footer?: React.ReactNode; dense?: boolean;
}) {
  const pad = dense ? 'px-3 py-2' : 'px-4 py-3';
  return (
    <div className="ad-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-[var(--ad-bg-elev)]">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cx(pad, 'whitespace-nowrap border-b border-[var(--ad-border)] text-[11px] font-semibold uppercase tracking-wide text-[var(--ad-muted)]',
                    c.align === 'right' && 'text-right', c.hideOnMobile && 'hidden md:table-cell')}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !rows?.length ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--ad-border)] last:border-0">
                  {columns.map((c) => (
                    <td key={c.key} className={cx(pad, c.hideOnMobile && 'hidden md:table-cell')}>
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-[rgba(15,23,42,0.07)]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr><td colSpan={columns.length}><ErrorState error={error} onRetry={onRetry} /></td></tr>
            ) : !rows?.length ? (
              <tr><td colSpan={columns.length}>{empty ?? <EmptyState />}</td></tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(row); } : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cx(
                    'border-b border-[var(--ad-border)] last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-[var(--ad-card-hover)] focus:bg-[var(--ad-card-hover)] focus:outline-none',
                    loading && 'opacity-60',
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cx(pad, 'align-middle text-[var(--ad-fg)]', c.align === 'right' && 'text-right tabular-nums', c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}

export function Pagination({ page, pages, total, onPage, label = 'records' }: {
  page: number; pages: number; total?: number; onPage: (p: number) => void; label?: string;
}) {
  if (!pages || pages < 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ad-border)] bg-[var(--ad-bg-elev)] px-4 py-2.5">
      <p className="text-xs text-[var(--ad-muted)]">
        Page {page} of {pages}{total !== undefined && <> · {total.toLocaleString('en-NG')} {label}</>}
      </p>
      <div className="flex gap-1.5">
        <Button size="sm" icon={<ChevronLeft size={14} />} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">Prev</Button>
        <Button size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">Next <ChevronRight size={14} /></Button>
      </div>
    </div>
  );
}

export interface TimelineItem { id: string; at: string | Date; title: React.ReactNode; detail?: React.ReactNode; actor?: React.ReactNode; tone?: Tone }

const DOT: Record<Tone, string> = {
  neutral: 'bg-[#94a3b8]', success: 'bg-[#047857]', warning: 'bg-[#b45309]', danger: 'bg-[#b91c1c]',
  info: 'bg-[#1d4ed8]', accent: 'bg-[#0f766e]', violet: 'bg-[#6d28d9]',
};

export function Timeline({ items, formatTime }: { items: TimelineItem[]; formatTime: (d: string | Date) => string }) {
  if (!items.length) return <EmptyState title="No events yet" />;
  return (
    <ol className="relative space-y-4 border-l border-[var(--ad-border-strong)] pl-5">
      {items.map((i) => (
        <li key={i.id} className="relative">
          <span className={cx('absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--ad-card)]', DOT[i.tone ?? 'neutral'])} />
          <p className="text-sm font-medium text-[var(--ad-fg-strong)]">{i.title}</p>
          {i.detail && <p className="mt-0.5 whitespace-pre-wrap text-xs text-[var(--ad-fg)]">{i.detail}</p>}
          <p className="mt-0.5 text-[11px] text-[var(--ad-muted)]">{formatTime(i.at)}{i.actor && <> · {i.actor}</>}</p>
        </li>
      ))}
    </ol>
  );
}

/** Right-hand panel for record details without leaving the list. */
export function Drawer({ open, onClose, title, children, footer, width = 'max-w-xl' }: {
  open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; width?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // A confirmation dialog on top handles its own Escape.
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"][data-state="open"]')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="admin-portal fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[rgba(15,23,42,0.35)]" onClick={onClose} />
      <div ref={panel} tabIndex={-1} className={cx('relative flex h-full w-full flex-col bg-[var(--ad-card)] shadow-2xl focus:outline-none', width)}>
        <div className="flex items-center justify-between gap-2 border-b border-[var(--ad-border)] px-5 py-3.5">
          <h2 className="min-w-0 truncate text-base font-semibold text-[var(--ad-fg-strong)]">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close"><X size={16} /></Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--ad-border)] px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Renders children only for admins holding the permission (UI only — the API enforces it). */
export function Can({ perm, any, children, fallback = null }: { perm?: string; any?: string[]; children: React.ReactNode; fallback?: React.ReactNode }) {
  const perms = useAdminAuthStore((s) => s.admin?.permissions ?? []);
  const ok = perm ? perms.includes(perm) : any ? any.some((p) => perms.includes(p)) : true;
  return <>{ok ? children : fallback}</>;
}

export function NoAccess() {
  return (
    <Card>
      <EmptyState title="You don’t have access to this page" description="Ask a super administrator if you need this permission." icon={<AlertTriangle size={18} />} />
    </Card>
  );
}

export function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[12px] text-[var(--ad-fg-strong)]">{children}</span>;
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--ad-muted)]" role="status">
      <Loader2 size={16} className="animate-spin" /> {label}
    </div>
  );
}
