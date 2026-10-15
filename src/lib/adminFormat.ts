/**
 * Formatting for the admin portal. The API returns UTC; everything is shown in Lagos time
 * (West Africa Time, UTC+1, no daylight saving) and labelled "WAT".
 */

export const ADMIN_TIMEZONE = 'Africa/Lagos';

const dateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: ADMIN_TIMEZONE, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
});
const dateOnly = new Intl.DateTimeFormat('en-GB', { timeZone: ADMIN_TIMEZONE, day: '2-digit', month: 'short', year: 'numeric' });
const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 });
const nairaShort = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 });

type DateLike = string | number | Date | null | undefined;
const toDate = (d: DateLike): Date | null => {
  if (d === null || d === undefined || d === '') return null;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "14 Oct 2026, 18:05 WAT" */
export function formatDateTime(d: DateLike): string {
  const date = toDate(d);
  return date ? `${dateTime.format(date)} WAT` : '—';
}

export function formatDate(d: DateLike): string {
  const date = toDate(d);
  return date ? dateOnly.format(date) : '—';
}

/** "3h ago", "in 20m", "2d ago" */
export function formatRelative(d: DateLike, now = Date.now()): string {
  const date = toDate(d);
  if (!date) return '—';
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  const units: [number, string][] = [[86_400_000, 'd'], [3_600_000, 'h'], [60_000, 'm']];
  for (const [ms, label] of units) {
    if (abs >= ms) {
      const n = Math.floor(abs / ms);
      return diff < 0 ? `${n}${label} ago` : `in ${n}${label}`;
    }
  }
  return 'just now';
}

export function formatMoney(amount: number | string | null | undefined, opts: { compact?: boolean } = {}): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return '—';
  return (opts.compact && Math.abs(n) >= 100_000 ? nairaShort : naira).format(n);
}

export const formatNumber = (n: number | null | undefined): string =>
  n === null || n === undefined ? '—' : new Intl.NumberFormat('en-NG').format(n);

/** "bill_payment" → "Bill payment" */
export const humanize = (s: string | null | undefined): string =>
  s ? s.replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase()) : '—';

/** Start of the Lagos day containing `d`, as a UTC Date (Lagos is UTC+1 all year). */
export function lagosDayStart(d = new Date()): Date {
  const lagos = new Date(d.getTime() + 3_600_000);
  return new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate()) - 3_600_000);
}

/** "YYYY-MM-DD" (a Lagos date from an <input type=date>) → UTC instant of that Lagos midnight */
export function lagosDateToUtc(ymd: string, endOfDay = false): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined;
  const [y, m, d] = ymd.split('-').map(Number);
  const start = Date.UTC(y, m - 1, d) - 3_600_000;
  return new Date(endOfDay ? start + 86_400_000 : start).toISOString();
}

export const fullName = (u: { firstName?: string | null; lastName?: string | null; email?: string | null } | null | undefined): string =>
  u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || '—' : '—';
