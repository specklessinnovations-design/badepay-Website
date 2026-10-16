/**
 * Money received through the merchant QR, per item (tithe, offering, building fund…) and the
 * payments behind each total with the payer's note. From GET /merchants/store/collections.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { HandHeart, Wallet, CreditCard } from 'lucide-react';
import { merchantService } from '@/services/merchantService';

interface ItemTotal { productId: string; name: string; type: string | null; count: number; total: number }
interface Payment { id: string; reference: string; amount: number; item: string | null; productId: string | null; note: string | null; payerName: string | null; channel: 'wallet' | 'card'; createdAt: string }
interface Data { total: number; count: number; byItem: ItemTotal[]; payments: Payment[] }

const naira = (n: number) => `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
const PERIODS = [
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: 'year', label: '12 months', days: 365 },
  { key: 'all', label: 'All time', days: 0 },
] as const;

export function CollectionsByItem() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['key']>('30d');
  const [item, setItem] = useState<string>('');
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const from = useMemo(() => {
    const days = PERIODS.find((p) => p.key === period)!.days;
    return days ? new Date(Date.now() - days * 86_400_000).toISOString() : undefined;
  }, [period]);

  useEffect(() => {
    let live = true;
    setError('');
    merchantService.getCollections({ from, productId: item || undefined, limit: 20 })
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e?.message || 'Could not load collections'));
    return () => { live = false; };
  }, [from, item]);

  const max = Math.max(1, ...(data?.byItem ?? []).map((i) => i.total));

  return (
    <section className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }} aria-label="Collections by item">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HandHeart size={18} style={{ color: '#6fe8d6' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Collections by item</h2>
        </div>
        <select aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </div>
      <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>Paid by scanning your QR code — in the BadePay app or by card. Choose an item to see who gave.</p>

      {error ? <p className="mt-4 text-xs text-red-400">{error}</p> : !data ? (
        <p className="mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>
      ) : (
        <>
          <p className="mt-4 text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{naira(data.total)}
            <span className="ml-2 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{data.count} payment{data.count === 1 ? '' : 's'}</span>
          </p>
          <ul className="mt-3 space-y-2">
            {data.byItem.map((i) => (
              <li key={i.productId}>
                <button type="button" onClick={() => setItem(item === i.productId ? '' : i.productId)} className="w-full text-left" aria-pressed={item === i.productId}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: item === i.productId ? '#6fe8d6' : 'var(--text-primary)' }}>{i.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{naira(i.total)} · {i.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-secondary)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(i.total / max) * 100}%`, background: '#6fe8d6' }} />
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {data.payments.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {item ? `Recent — ${data.byItem.find((i) => i.productId === item)?.name ?? ''}` : 'Recent'}
              </p>
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {data.payments.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.payerName ?? 'Someone'} <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>· {p.item ?? 'General'}</span></p>
                      {p.note && <p className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>“{p.note}”</p>}
                      <p className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {p.channel === 'card' ? <CreditCard size={11} /> : <Wallet size={11} />}
                        {p.channel === 'card' ? 'Card / transfer' : 'BadePay app'} · {new Date(p.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold" style={{ color: '#34d399' }}>{naira(p.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
