import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Search, CheckCircle2, Clock, AlertCircle, QrCode, CreditCard, ArrowLeftRight, X } from 'lucide-react';
import { formatNGN, formatDate } from '@/utils/formatting';
import { useMerchantStore } from '@/store/useMerchantStore';

type Status = 'all' | 'completed' | 'pending' | 'failed';
type Method = 'qr' | 'transfer' | 'card';

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: '#34d399', bg: 'rgba(52,211,153,0.1)', icon: CheckCircle2 },
  pending:   { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: Clock },
  failed:    { label: 'Failed',    color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: AlertCircle },
};

const METHOD_CONFIG: Record<Method, { label: string; color: string; icon: React.ElementType }> = {
  qr:       { label: 'QR Code',   color: 'var(--accent-text)', icon: QrCode },
  transfer: { label: 'Transfer',  color: '#60a5fa', icon: ArrowLeftRight },
  card:     { label: 'Card',      color: '#a78bfa', icon: CreditCard },
};

export default function PaymentsPage() {
  const storePayments = useMerchantStore((s) => s.payments);
  const payments = useMemo(() =>
    storePayments.map((p) => ({
      id: p.id, customer: p.customerName, amount: p.amount, date: new Date(p.createdAt),
      status: (p.status === 'success' ? 'completed' : p.status) as 'completed' | 'pending' | 'failed',
      reference: p.reference, method: 'qr' as Method,
    })), [storePayments]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<Status>('all');
  const [selected, setSelected] = useState<typeof payments[0] | null>(null);

  const filtered = payments.filter((p) => {
    const matchSearch = p.customer.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0);
  const completedCount = filtered.filter((p) => p.status === 'completed').length;
  const pendingCount = filtered.filter((p) => p.status === 'pending').length;

  return (
    <div className="space-y-5">

      {/* ── Stats ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Received', value: formatNGN(totalAmount), color: '#34d399', sub: `${filtered.length} payments` },
          { label: 'Completed', value: completedCount.toString(), color: 'var(--text-primary)', sub: `${filtered.length ? ((completedCount / filtered.length) * 100).toFixed(0) : 0}% success` },
          { label: 'Pending', value: pendingCount.toString(), color: '#f59e0b', sub: 'Awaiting settlement' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
            <p className="text-2xl font-black tracking-tight" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
        className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <Search size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customer or reference…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }} />
        </div>
        {/* Status pills */}
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {(['all', 'completed', 'pending', 'failed'] as Status[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all"
              style={{
                background: filterStatus === s ? '#6fe8d6' : 'transparent',
                color: filterStatus === s ? '#1a1a1a' : 'var(--text-secondary)',
              }}>
              {s}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <Download size={14} /> Export
        </button>
      </motion.div>

      {/* ── Payments list ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Search size={24} className="mx-auto mb-3 opacity-25" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>No payments found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((p) => {
              const sc = STATUS_CONFIG[p.status];
              const mc = METHOD_CONFIG[p.method];
              const SIcon = sc.icon;
              const MIcon = mc.icon;
              return (
                <div key={p.id} onClick={() => setSelected(p)}
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {/* Status icon */}
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: sc.bg }}>
                    <SIcon size={16} style={{ color: sc.color }} />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>{p.customer}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MIcon size={10} style={{ color: mc.color }} />
                      <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                        {p.reference} · {formatDate(p.date)}
                      </p>
                    </div>
                  </div>
                  {/* Amount + badge */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black" style={{ color: '#34d399' }}>+{formatNGN(p.amount)}</p>
                    <span className="text-[10px] font-bold rounded-full px-2 py-0.5 inline-block mt-0.5"
                      style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Detail panel ── */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Payment Details</h3>
              <button onClick={() => setSelected(null)}
                className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--text-tertiary)', background: 'var(--surface-secondary)' }}>
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Customer', value: selected.customer },
                { label: 'Reference', value: selected.reference },
                { label: 'Amount', value: formatNGN(selected.amount), accent: true },
                { label: 'Method', value: METHOD_CONFIG[selected.method].label },
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
    </div>
  );
}
