import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle2, Clock, AlertCircle, X, Info, TrendingUp } from 'lucide-react';
import { formatNGN, formatDate } from '@/utils/formatting';
import { useMerchantStore } from '@/store/useMerchantStore';
import { useAuthStore } from '@/store/useAuthStore';

const STATUS_CONFIG = {
  completed:  { label: 'Settled',    color: '#34d399', bg: 'rgba(52,211,153,0.1)',  icon: CheckCircle2 },
  processing: { label: 'Processing', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: Clock },
  pending:    { label: 'Pending',    color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: AlertCircle },
};

export default function SettlementsPage() {
  const storeSettlements = useMerchantStore((s) => s.settlements);
  const payoutPreference = useAuthStore((s) => s.user?.merchantProfile?.payoutPreference);

  const settlements = useMemo(() =>
    storeSettlements.map((s) => ({
      id: s.id, amount: s.amount, date: new Date(s.createdAt),
      status: s.status as 'completed' | 'pending' | 'processing',
      reference: s.reference, period: formatDate(s.createdAt, 'short'),
    })), [storeSettlements]);

  const [selected, setSelected] = useState<typeof settlements[0] | null>(null);

  const totalSettled = settlements.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.amount, 0);
  const pending = settlements.filter(s => s.status !== 'completed').reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-5">

      {/* ── Balance hero ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl p-6"
        style={{ background: 'linear-gradient(135deg, #001a0f 0%, #002a18 50%, #001a0f 100%)', border: '1px solid rgba(52,211,153,0.2)' }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} style={{ color: 'rgba(52,211,153,0.7)' }} />
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(52,211,153,0.7)' }}>
              {payoutPreference === 'daily' ? 'Daily Settlements · 6:00 PM' : 'Instant Settlement'}
            </p>
          </div>
          <p className="text-3xl font-black tracking-tight mb-1" style={{ color: '#ffffff' }}>
            {formatNGN(totalSettled)}
          </p>
          <p className="text-sm" style={{ color: 'rgba(52,211,153,0.6)' }}>Total settled to bank</p>
          {pending > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Clock size={11} style={{ color: '#f59e0b' }} />
              <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>
                {formatNGN(pending)} pending
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Summary cards ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
        className="grid grid-cols-3 gap-3">
        {[
          { label: 'Settled', value: settlements.filter(s => s.status === 'completed').length, color: '#34d399' },
          { label: 'Processing', value: settlements.filter(s => s.status === 'processing').length, color: '#f59e0b' },
          { label: 'Cycle', value: 'Weekly', color: 'var(--text-primary)', sub: 'Mon 9 AM' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            {s.sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.sub}</p>}
          </div>
        ))}
      </motion.div>

      {/* ── Toolbar ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center justify-between">
        <h2 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
          Settlement History
        </h2>
        <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <Download size={13} /> Export
        </button>
      </motion.div>

      {/* ── List ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}
        className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {settlements.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>No settlements yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {settlements.map((s) => {
              const sc = STATUS_CONFIG[s.status];
              const SIcon = sc.icon;
              return (
                <div key={s.id} onClick={() => setSelected(s)}
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: sc.bg }}>
                    <SIcon size={16} style={{ color: sc.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{s.period}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                      {s.reference} · {formatDate(s.date)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black" style={{ color: '#34d399' }}>{formatNGN(s.amount)}</p>
                    <span className="text-[10px] font-bold rounded-full px-2 py-0.5 inline-block mt-0.5"
                      style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Detail drawer ── */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Settlement Details</h3>
              <button onClick={() => setSelected(null)}
                className="h-7 w-7 flex items-center justify-center rounded-lg"
                style={{ background: 'var(--surface-secondary)', color: 'var(--text-tertiary)' }}>
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Period', value: selected.period },
                { label: 'Reference', value: selected.reference },
                { label: 'Amount', value: formatNGN(selected.amount), accent: true },
                { label: 'Date', value: formatDate(selected.date) },
                { label: 'Status', value: STATUS_CONFIG[selected.status].label },
              ].map(({ label, value, accent }) => (
                <div key={label} className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
                  style={{ background: 'var(--surface-secondary)' }}>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                  <span className="text-xs font-black" style={{ color: accent ? 'var(--accent-text)' : 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Info banner ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="rounded-2xl p-4" style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
        <div className="flex items-start gap-3">
          <Info size={14} style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: 1 }} />
          <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <p><strong style={{ color: 'var(--text-primary)' }}>Cycle:</strong> Every Monday at 9 AM</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>Processing:</strong> Within 24 hours of settlement</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>Fee:</strong> 2.5% transaction fee applies</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
