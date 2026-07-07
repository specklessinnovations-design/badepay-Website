import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ShoppingBag, Utensils, Fuel, Wifi, Plane, BarChart3, Filter } from 'lucide-react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatNGN } from '@/utils/formatting';

const CAT_MAP = [
  { keywords: ['shop', 'merchant', 'konga', 'store', 'market', 'qr'], label: 'Shopping', icon: ShoppingBag, color: '#EC4899', bg: 'bg-[#EC4899]' },
  { keywords: ['food', 'restaurant', 'eat', 'dining', 'snack'], label: 'Food & dining', icon: Utensils, color: '#3B82F6', bg: 'bg-[#3B82F6]' },
  { keywords: ['airtime', 'data', 'mtn', 'airtel', 'glo', '9mobile', 'wifi', 'internet'], label: 'Airtime & data', icon: Wifi, color: '#F59E0B', bg: 'bg-[#F59E0B]' },
  { keywords: ['electricity', 'ikedc', 'ekedc', 'nepa', 'prepaid', 'cable', 'dstv', 'gotv'], label: 'Bills & utilities', icon: Fuel, color: '#EF4444', bg: 'bg-[#EF4444]' },
  { keywords: ['transfer', 'nip', 'bank', 'salary', 'inflow'], label: 'Transfers', icon: Plane, color: '#8B5CF6', bg: 'bg-[#8B5CF6]' },
];

function categorize(cat: string): number {
  const lower = cat.toLowerCase();
  for (let i = 0; i < CAT_MAP.length; i++) {
    if (CAT_MAP[i].keywords.some(k => lower.includes(k))) return i;
  }
  return CAT_MAP.length - 1; // default: Transfers bucket
}

export default function InsightsPage() {
  const user = useAuthStore(s => s.user);
  const transactions = useTransactionStore(s => s.transactions);

  const outbound = useMemo(() => transactions.filter(tx => tx.type === 'debit'), [transactions]);
  const inbound = useMemo(() => transactions.filter(tx => tx.type === 'credit'), [transactions]);

  const totalSpent = useMemo(() => outbound.reduce((s, tx) => s + tx.amount, 0), [outbound]);
  const totalIncome = useMemo(() => inbound.reduce((s, tx) => s + tx.amount, 0), [inbound]);

  const cats = useMemo(() => {
    const buckets = CAT_MAP.map(c => ({ ...c, v: 0 }));
    outbound.forEach(tx => {
      const idx = categorize(tx.category || '');
      buckets[idx].v += tx.amount;
    });
    const total = buckets.reduce((s, b) => s + b.v, 0) || 1;
    return buckets
      .map(b => ({ ...b, pct: Math.round((b.v / total) * 100) }))
      .filter(b => b.v > 0);
  }, [outbound]);

  const hasData = totalSpent > 0;

  const bars = useMemo(() => {
    const amts = outbound.slice(0, 13).map(tx => tx.amount);
    const max = Math.max(...amts, 1);
    return amts.map(a => Math.round((a / max) * 100));
  }, [outbound]);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: 'easeOut' as const },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Insights</h1>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Track your income and spending pattern</p>
        </div>
        <button className="h-10 w-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
          <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Spend overview card */}
      <motion.div {...fadeUp(0.04)} className="rounded-3xl p-6"
        style={{
          background: 'linear-gradient(135deg, #0b7367 0%, #085f55 100%)',
          boxShadow: '0 12px 40px -10px rgba(11,115,103,0.3)',
        }}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/70">Total spent</div>
            <div className="mt-1 font-black text-3xl tracking-tight text-white">
              {formatNGN(totalSpent)}
            </div>
            {hasData ? (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/80">
                <TrendingUp size={14} className="text-white" /> From {outbound.length} transaction{outbound.length !== 1 ? 's' : ''}
              </div>
            ) : (
              <div className="mt-2 text-xs text-white/60">No spending recorded yet</div>
            )}
          </div>
          <div className="sm:text-right border-t border-white/10 pt-4 sm:pt-0 sm:border-0">
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/70">Income</div>
            <div className="mt-1 font-black text-2xl tracking-tight text-[#10B981]">
              +{formatNGN(totalIncome)}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#10B981]">
              <TrendingDown size={14} className="rotate-180 text-[#10B981]" /> {inbound.length} inflow{inbound.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Sparkline chart */}
        <div className="mt-8 h-28 flex items-end gap-2">
          {bars.length > 0 ? (
            bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-white/20 to-white"
                  style={{ height: `${h}%`, opacity: 0.35 + i * 0.05 }}
                />
              </div>
            ))
          ) : (
            Array.from({ length: 13 }).map((_, i) => (
              <div key={i} className="flex-1 h-[8%] rounded-t-lg bg-white/10" />
            ))
          )}
        </div>
        <div className="mt-3 flex justify-between text-[10px] text-white/60 font-semibold uppercase tracking-wider">
          <span>Oldest</span><span>Recent</span>
        </div>
      </motion.div>

      {/* Category breakdown */}
      <motion.div {...fadeUp(0.08)} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>By category</h2>
          <span className="text-xs font-bold" style={{ color: '#0b7367' }}>Report</span>
        </div>

        {cats.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
            <BarChart3 size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>No spending data yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Make transfers or pay bills to see your spending breakdown.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stacked progress bar */}
            <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--surface-secondary)' }}>
              {cats.map(c => (
                <div key={c.label} className={c.bg} style={{ width: `${c.pct}%` }} />
              ))}
            </div>

            {/* Category list */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
              {cats.map((c, i) => (
                <div key={c.label} className="px-4 py-3.5 flex items-center gap-3"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                    <c.icon size={16} style={{ color: 'var(--text-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{c.label}</span>
                      <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{formatNGN(c.v)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
                        <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                      </div>
                      <span className="text-xs font-semibold text-right min-w-[30px]" style={{ color: 'var(--text-secondary)' }}>{c.pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Heads up smart tip */}
      {hasData && (
        <motion.div {...fadeUp(0.12)} className="rounded-2xl p-4 flex gap-3"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[rgba(11,115,103,0.1)] shrink-0">
            <TrendingUp size={20} style={{ color: '#0b7367' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Heads-up from BadePay AI</div>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {cats.length > 0
                ? `Your top spend category is ${cats[0].label} at ${cats[0].pct}% of total outflow. Set a budget to manage this category.`
                : 'Track your spending here as you make transfers and payments.'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
