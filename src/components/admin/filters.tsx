/**
 * Filter panel for every admin list: search + "Filters" toggle on top, labelled groups
 * (status, type, people, dates…) in a grid, and the applied filters as removable chips.
 * On small screens the groups fold behind the toggle.
 */
import React, { useEffect, useState } from 'react';
import { Calendar, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, SearchInput, useDebounced } from './ui';
import { lagosDayStart } from '@/lib/adminFormat';

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

export function FilterPanel({
  search, onSearch, searchPlaceholder, active, onClearAll, children, quick, defaultOpen = true,
}: {
  /** Current search text (applied); the input debounces before calling onSearch */
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  /** Applied filters, shown as chips (search excluded) */
  active: ActiveFilter[];
  onClearAll: () => void;
  /** The filter groups */
  children?: React.ReactNode;
  /** Always-visible quick toggles next to the search (e.g. "Mine", "Overdue") */
  quick?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  // Folded by default on phones so the list stays in view.
  const [open, setOpen] = useState(() => defaultOpen && (typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches));
  const [text, setText] = useState(search ?? '');
  const debounced = useDebounced(text);
  useEffect(() => { setText(search ?? ''); }, [search]);
  useEffect(() => { if (onSearch && debounced !== (search ?? '')) onSearch(debounced); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps
  const count = active.length;
  const anything = count > 0 || !!search;

  return (
    <section className="ad-card mb-4" aria-label="Filters">
      <div className="flex flex-wrap items-center gap-2 p-3">
        {onSearch && <SearchInput value={text} onChange={setText} placeholder={searchPlaceholder} className="min-w-[220px]" />}
        {quick && <div className="flex flex-wrap items-center gap-1.5">{quick}</div>}
        {children && (
          <Button
            variant={open ? 'secondary' : count ? 'primary' : 'secondary'}
            icon={<SlidersHorizontal size={14} />}
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="ml-auto"
          >
            Filters{count > 0 && <span className="rounded-full bg-[rgba(15,118,110,0.15)] px-1.5 text-[11px] text-[#0f766e]">{count}</span>}
          </Button>
        )}
        {anything && (
          <Button variant="ghost" onClick={() => { setText(''); onClearAll(); }} className={children ? '' : 'ml-auto'}>Clear all</Button>
        )}
      </div>

      {children && open && (
        <div className="grid grid-flow-row-dense grid-cols-1 gap-x-4 gap-y-3 border-t border-(--ad-border) bg-(--ad-bg-elev) p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {children}
        </div>
      )}

      {count > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-(--ad-border) px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-(--ad-muted)">Applied</span>
          {active.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={f.onRemove}
              className="inline-flex h-6 items-center gap-1 rounded-full border border-[rgba(15,118,110,0.3)] bg-[rgba(15,118,110,0.08)] pl-2.5 pr-1.5 text-xs font-medium text-[#0f766e] hover:bg-[rgba(15,118,110,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ad-accent-ring)"
              aria-label={`Remove filter ${f.label}`}
            >
              {f.label} <X size={12} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/** One labelled group inside the panel. `wide` spans two columns (e.g. date range). */
export function FilterGroup({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <fieldset className={cn('min-w-0', wide && 'sm:col-span-2')}>
      <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-(--ad-muted)">{label}</legend>
      {children}
    </fieldset>
  );
}

const CONTROL = 'h-9 w-full rounded-lg border border-(--ad-border-strong) bg-(--ad-card) px-3 text-sm text-(--ad-fg-strong) focus:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-(--ad-accent-ring)';

/** Single-choice dropdown for a filter group. The first option is "any". */
export function FilterSelect({ value, onChange, options, label, defaultValue = '' }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string; count?: number }[]; label: string;
  /** The page's default for this filter; the control is highlighted only when changed from it */
  defaultValue?: string;
}) {
  return (
    <select aria-label={label} className={cn(CONTROL, value !== defaultValue && 'border-[#0f766e] font-semibold')} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value || 'any'} value={o.value}>{o.count !== undefined ? `${o.label} (${o.count})` : o.label}</option>)}
    </select>
  );
}

export function FilterText({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder?: string; label: string }) {
  const [text, setText] = useState(value);
  const debounced = useDebounced(text);
  useEffect(() => { setText(value); }, [value]);
  useEffect(() => { if (debounced !== value) onChange(debounced.trim()); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps
  return <input aria-label={label} className={CONTROL} value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} />;
}

const ymd = (d: Date) => new Date(d.getTime() + 3_600_000).toISOString().slice(0, 10); // Lagos calendar date

/** From–to dates (Lagos calendar days) with quick presets. */
export function DateRangeFilter({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  // Lives in a two-column FilterGroup (see DateGroup) so both dates fit.
  const today = lagosDayStart();
  const daysAgo = (n: number) => ymd(new Date(today.getTime() - n * 86_400_000));
  const monthStart = (() => { const t = ymd(today); return `${t.slice(0, 8)}01`; })();
  const presets = [
    { label: 'Today', from: ymd(today), to: ymd(today) },
    { label: '7 days', from: daysAgo(6), to: ymd(today) },
    { label: '30 days', from: daysAgo(29), to: ymd(today) },
    { label: 'This month', from: monthStart, to: ymd(today) },
  ];
  const invalid = from && to && from > to;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <Calendar size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-(--ad-muted-soft)" />
          <input type="date" aria-label="From date" className={cn(CONTROL, 'pl-8')} value={from} max={to || undefined} onChange={(e) => onChange(e.target.value, to)} />
        </div>
        <span className="text-xs text-(--ad-muted)">to</span>
        <div className="relative min-w-0 flex-1">
          <Calendar size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-(--ad-muted-soft)" />
          <input type="date" aria-label="To date" className={cn(CONTROL, 'pl-8')} value={to} min={from || undefined} onChange={(e) => onChange(from, e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => {
          const on = from === p.from && to === p.to;
          return (
            <button key={p.label} type="button" onClick={() => onChange(p.from, p.to)}
              className={cn('h-6 rounded-md px-2 text-[11px] font-semibold', on ? 'bg-[#0f766e] text-white' : 'text-(--ad-muted) hover:bg-[rgba(15,23,42,0.06)] hover:text-(--ad-fg-strong)')}>
              {p.label}
            </button>
          );
        })}
      </div>
      {invalid && <p className="text-xs text-[#b91c1c]">The start date is after the end date.</p>}
    </div>
  );
}

/** Date range group: always two columns wide so both dates and the presets fit. */
export function DateGroup({ label = 'Date (Lagos)', from, to, onChange }: { label?: string; from: string; to: string; onChange: (from: string, to: string) => void }) {
  return (
    <FilterGroup label={label} wide>
      <DateRangeFilter from={from} to={to} onChange={onChange} />
    </FilterGroup>
  );
}

/** Chip label for a date range. */
export const dateRangeLabel = (from: string, to: string): string => {
  const f = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  if (from && to) return from === to ? f(from) : `${f(from)} – ${f(to)}`;
  return from ? `From ${f(from)}` : `Until ${f(to)}`;
};

/** Small quick toggle for the top row (e.g. "Mine", "Overdue"). */
export function QuickToggle({ on, onClick, children, tone = 'accent' }: { on: boolean; onClick: () => void; children: React.ReactNode; tone?: 'accent' | 'danger' }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ad-accent-ring)',
        on
          ? tone === 'danger' ? 'border-[#b91c1c] bg-[#b91c1c] text-white' : 'border-[#0f766e] bg-[#0f766e] text-white'
          : 'border-(--ad-border-strong) bg-(--ad-card) text-(--ad-fg) hover:border-[#0f766e]',
      )}
    >
      {children}
    </button>
  );
}
