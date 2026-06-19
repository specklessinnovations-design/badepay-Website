import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, X, ArrowUpRight, ArrowDownLeft, Zap, FileText, TrendingUp, TrendingDown, ChevronRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useTransactionStore } from '@/store/useTransactionStore';
import type { Transaction } from '@/mock/transactions';
import { formatNGN, formatTimeAgo } from '@/utils/formatting';
import { filterTransactions, getTransactionTotals, type ActivityFilter } from '@/lib/personalHelpers';
import { exportTransactionsCsv } from '@/lib/exportStatements';
import { ResponsivePageHeader } from '@/components/ui/responsive-page-header';
import { bpToast } from '@/lib/bpToast';

const FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'credit', label: 'Money In' },
  { id: 'debit', label: 'Money Out' },
  { id: 'bills', label: 'Bills' },
  { id: 'transfer', label: 'Transfers' },
];

const CATEGORY_LABELS: Record<Transaction['category'], string> = {
  transfer: 'Transfer', bills: 'Bill payment', deposit: 'Deposit', withdrawal: 'Withdrawal',
};

const CATEGORY_ICONS: Record<Transaction['category'], React.ElementType> = {
  transfer: ArrowUpRight, bills: Zap, deposit: ArrowDownLeft, withdrawal: ArrowUpRight,
};

function TxIcon({ tx }: { tx: Transaction }) {
  const Icon = CATEGORY_ICONS[tx.category] ?? FileText;
  const isCredit = tx.type === 'credit';
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors"
      style={{
        background: isCredit ? 'rgba(16,185,129,0.1)' : 'rgba(111,232,214,0.07)',
        border: isCredit ? '1px solid rgba(16,185,129,0.18)' : '1px solid rgba(111,232,214,0.12)',
      }}>
      <Icon size={16} style={{ color: isCredit ? '#10B981' : '#6fe8d6' }} strokeWidth={2.5} />
    </div>
  );
}

export default function ActivityPage() {
  const transactions = useTransactionStore((s) => s.transactions);
  const [, navigate] = useLocation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filtered = useMemo(() => filterTransactions(transactions, filter, query), [transactions, filter, query]);
  const { totalIn, totalOut } = useMemo(() => getTransactionTotals(filtered), [filtered]);

  const hasTransactions = transactions.length > 0;
  const noResults = hasTransactions && filtered.length === 0;

  const handleExport = () => {
    if (filtered.length === 0) { bpToast.error('Nothing to export'); return; }
    exportTransactionsCsv(filtered, `badepay-activity-${filter}.csv`);
    bpToast.success('Export downloaded');
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <ResponsivePageHeader
        title="Activity"
        description={`${transactions.length} transactions`}
        action={
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            type="button" onClick={handleExport} disabled={filtered.length === 0}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)] disabled:opacity-40 sm:w-auto transition-colors hover:border-[#6fe8d6] hover:text-[#6fe8d6]">
            <Download size={14} /> Export CSV
          </motion.button>
        }
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-6">
        {/* Left — filters & summary */}
        <div className="space-y-4">
          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input type="search" placeholder="Search transactions…" value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 pl-10 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[#6fe8d6] focus:outline-none transition-colors" />
            <AnimatePresence>
              {query && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  type="button" onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  <X size={15} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Money in', value: totalIn, isIn: true },
              { label: 'Money out', value: totalOut, isIn: false },
            ].map(({ label, value, isIn }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 + 0.1 }}
                className="relative overflow-hidden rounded-xl p-4"
                style={{
                  background: isIn ? 'rgba(16,185,129,0.06)' : 'var(--card)',
                  border: isIn ? '1px solid rgba(16,185,129,0.15)' : '1px solid var(--border)',
                }}>
                <div className="flex items-center gap-1.5 mb-2">
                  {isIn ? <TrendingUp size={13} color="#10B981" /> : <TrendingDown size={13} style={{ color: 'var(--text-tertiary)' }} />}
                  <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{label}</p>
                </div>
                <motion.p className={`text-lg font-black ${isIn ? 'text-[#10B981]' : 'text-[var(--text-primary)]'}`}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 + 0.2 }}>
                  {isIn ? '+' : '−'}{formatNGN(value)}
                </motion.p>
              </motion.div>
            ))}
          </div>

          {/* Filter pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map(({ id, label }, i) => (
              <motion.button key={id} type="button" onClick={() => setFilter(id)}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 + 0.15 }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  filter === id
                    ? 'bg-[#6fe8d6] text-[#1a1a1a] shadow-[0_2px_12px_rgba(111,232,214,0.25)]'
                    : 'border border-[var(--border)] text-[var(--text-secondary)] hover:border-[#6fe8d6]/40'
                }`}>
                {label}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Right — transaction list */}
        <div className="mt-5 space-y-3 lg:mt-0">
          <AnimatePresence mode="wait">
            {!hasTransactions ? (
              <EmptyState key="empty" title="No transactions yet"
                description="Make a transfer or pay a bill to see your history here."
                action={<Link href="/dashboard" className="rounded-full bg-[#6fe8d6] px-5 py-2 text-sm font-semibold text-[#1a1a1a]">Go to Home</Link>} />
            ) : noResults ? (
              <EmptyState key="no-results" title="No matches" description="Try a different search or filter."
                action={
                  <button type="button" onClick={() => { setQuery(''); setFilter('all'); }}
                    className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--text-secondary)]">
                    Clear filters
                  </button>
                } />
            ) : (
              <motion.div key={`${filter}-${query}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                {filtered.map((tx, i) => (
                  <TxRow key={tx.id} tx={tx} index={i} onClick={() => navigate(`/transaction/detail?id=${tx.id}`)} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}

const STATUS_BADGE: Record<string, { color: string; bg: string; Icon: React.ElementType }> = {
  success: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', Icon: CheckCircle2 },
  completed: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', Icon: CheckCircle2 },
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', Icon: Clock },
  failed: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', Icon: XCircle },
};

function TxRow({ tx, index, onClick }: { tx: Transaction; index: number; onClick: () => void }) {
  const badge = STATUS_BADGE[tx.status] ?? STATUS_BADGE.success;
  const BadgeIcon = badge.Icon;
  return (
    <motion.button type="button" onClick={onClick}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.3 }}
      whileHover={{ backgroundColor: 'rgba(111,232,214,0.03)', x: 2 }}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-[var(--border)] last:border-0">
      <TxIcon tx={tx} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-sm text-[var(--text-primary)]">{tx.name}</p>
        <p className="truncate text-xs text-[var(--text-tertiary)] mt-0.5">{tx.description}</p>
        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{formatTimeAgo(tx.date)}</p>
      </div>
      <div className="ml-2 shrink-0 text-right space-y-1">
        <p className={`font-black text-sm ${tx.type === 'credit' ? 'text-[#10B981]' : 'text-[var(--text-primary)]'}`}>
          {tx.type === 'credit' ? '+' : '−'}{formatNGN(tx.amount)}
        </p>
        <div className="flex items-center justify-end gap-0.5 rounded-full px-1.5 py-0.5"
          style={{ background: badge.bg }}>
          <BadgeIcon size={9} style={{ color: badge.color }} />
          <span className="text-[9px] font-black capitalize" style={{ color: badge.color }}>{tx.status}</span>
        </div>
      </div>
      <ChevronRight size={14} className="shrink-0 text-[var(--text-tertiary)] ml-1" />
    </motion.button>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(111,232,214,0.07)', border: '1px solid rgba(111,232,214,0.12)' }}>
        <FileText size={24} style={{ color: '#6fe8d6' }} />
      </motion.div>
      <p className="font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
      <div className="mt-5">{action}</div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--text-tertiary)] shrink-0">{label}</span>
      <span className="text-right text-sm font-medium text-[var(--text-primary)] break-all">{value}</span>
    </div>
  );
}
