/** Merchant customers (mobile app: Customers): who pays you, how often and how much. GET /merchants/store/customers */
import React, { useEffect, useMemo, useState } from 'react';
import { Crown, Search, Users } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface Customer { id: string; name: string; email: string | null; avatarUrl: string | null; totalSpent: number; transactionCount: number; lastPaidAt: string; firstPaidAt: string; isVip: boolean; isRepeat: boolean }
interface Data { customers: Customer[]; summary: { totalCustomers: number; repeatRate: number; averageLifetimeValue: number; vipCount: number; totalCollected: number } }

const naira = (n: number) => `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
const ago = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 30 ? `${d} days ago` : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
const card = { background: 'var(--card)', border: '1px solid var(--border)' } as const;

export default function MerchantCustomersPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    apiClient.get('/merchants/store/customers').then((r) => setData(r?.data ?? r)).catch((e) => setError(e?.message || 'Could not load customers'));
  }, []);
  const shown = useMemo(() => (data?.customers ?? []).filter((c) => !q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase())), [data, q]);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-3xl p-5" style={card}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(111,232,214,0.15)' }}><Users size={20} style={{ color: 'var(--accent-text)' }} /></div>
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.summary.totalCustomers}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Paying customer{data.summary.totalCustomers === 1 ? '' : 's'}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[['Repeat', `${data.summary.repeatRate}%`], ['Avg spend', naira(data.summary.averageLifetimeValue)], ['VIPs', String(data.summary.vipCount)]].map(([l, v]) => (
            <div key={l} className="rounded-xl p-2.5" style={{ background: 'var(--surface-secondary)' }}>
              <div className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>{l}</div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <label className="flex h-11 items-center gap-2 rounded-2xl px-4" style={card}>
        <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers" aria-label="Search customers" className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }} />
      </label>
      {!shown.length ? (
        <p className="rounded-2xl p-8 text-center text-sm" style={{ ...card, color: 'var(--text-secondary)' }}>Customers who pay you on RCCGPay appear here.</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl" style={card}>
          {shown.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                : <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }}>{c.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span>}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.name} {c.isVip && <Crown size={13} style={{ color: 'var(--warning-text)' }} aria-label="VIP" />}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{c.transactionCount} payment{c.transactionCount === 1 ? '' : 's'} · last {ago(c.lastPaidAt)}</p>
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{naira(c.totalSpent)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
