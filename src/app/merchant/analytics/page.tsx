/**
 * Merchant analytics (mobile app: Analytics): money collected over 30 days by day and by channel,
 * payouts, and store sales. GET /merchants/payouts/collections and /merchants/store/analytics.
 */
import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

interface Report {
  from: string; to: string; totalCollected: number;
  byChannel: { channel: string; label: string; count: number; amount: number }[];
  byDay: { day: string; count: number; amount: number }[];
  payouts: { count: number; amount: number; fees: number };
}
interface StoreStats { totalOrders: number; totalRevenue: number; products?: { id: string; name: string; totalSold: number }[] }

const naira = (n: number) => `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
const dayLabel = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
/** One bar per day from `from` to `to`, so quiet days show as gaps rather than disappearing. */
function everyDay(r: Report) {
  const byKey = new Map(r.byDay.map((d) => [d.day.slice(0, 10), d]));
  const out: Report['byDay'] = [];
  const end = new Date(r.to);
  for (let d = new Date(r.from); d <= end && out.length < 92; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    out.push(byKey.get(key) ?? { day: key, count: 0, amount: 0 });
  }
  return out.length ? out : r.byDay;
}
const card = { background: 'var(--card)', border: '1px solid var(--border)' } as const;

export default function MerchantAnalyticsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [store, setStore] = useState<StoreStats | null>(null);
  const [error, setError] = useState('');
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    apiClient.get('/merchants/payouts/collections').then((r) => setReport(r?.data ?? r)).catch((e) => setError(e?.message || 'Could not load analytics'));
    apiClient.get('/merchants/store/analytics').then((r) => setStore(r?.data ?? r)).catch(() => setStore(null));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!report) return <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>;
  const days = everyDay(report);
  const maxDay = Math.max(1, ...days.map((d) => d.amount));
  const maxChannel = Math.max(1, ...report.byChannel.map((c) => c.amount));
  const top = [...(store?.products ?? [])].filter((p) => p.totalSold > 0).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);
  const h = hover !== null ? days[hover] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={card}>
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Collected · 30 days</p>
          <p className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{naira(report.totalCollected)}</p>
        </div>
        <div className="rounded-2xl p-4" style={card}>
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Paid out</p>
          <p className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{naira(report.payouts.amount)}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{report.payouts.count} payouts{report.payouts.fees ? ` · fees ${naira(report.payouts.fees)}` : ''}</p>
        </div>
      </div>

      <section className="rounded-2xl p-4" style={card} aria-label="Daily collections">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Daily collections</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{h ? `${dayLabel(h.day)} · ${naira(h.amount)} · ${h.count} payment${h.count === 1 ? '' : 's'}` : 'Hover a day for details'}</p>
        </div>
        {report.totalCollected === 0 && report.byDay.length === 0 ? <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No collections yet.</p> : (
          <>
            <div className="mt-3 flex h-44 items-end gap-[2px]" style={{ borderBottom: '1px solid var(--border)' }}>
              {days.map((d, i) => (
                <div key={d.day} className="flex h-full flex-1 items-end" tabIndex={0} aria-label={`${dayLabel(d.day)}: ${naira(d.amount)}`}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                  <div className="w-full rounded-t-[4px]" style={{ height: `${Math.max(d.amount ? 2 : 0, (d.amount / maxDay) * 100)}%`, background: '#4dd4c0', opacity: hover === null || hover === i ? 1 : 0.45 }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              <span>{dayLabel(days[0].day)}</span><span>{dayLabel(days[days.length - 1].day)}</span>
            </div>
          </>
        )}
      </section>

      {report.byChannel.length > 0 && (
        <section className="rounded-2xl p-4" style={card} aria-label="By channel">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>By channel</p>
          <ul className="mt-3 space-y-2.5">
            {report.byChannel.map((c) => (
              <li key={c.channel}>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text-primary)' }}>{c.label} <span style={{ color: 'var(--text-tertiary)' }}>· {c.count}</span></span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{naira(c.amount)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-secondary)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(c.amount / maxChannel) * 100}%`, background: '#4dd4c0' }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {store && (
        <section className="rounded-2xl p-4" style={card} aria-label="Store">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Store</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{store.totalOrders} paid orders · {naira(Number(store.totalRevenue) || 0)}</p>
          </div>
          {top.length ? (
            <ul className="mt-3 space-y-2">
              {top.map((p) => <li key={p.id} className="flex justify-between text-sm"><span className="truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</span><span style={{ color: 'var(--text-tertiary)' }}>{p.totalSold} sold</span></li>)}
            </ul>
          ) : <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>No store sales yet.</p>}
        </section>
      )}
    </div>
  );
}
