import React, { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Clock, XCircle, Copy, ArrowUpRight, ArrowDownLeft,
  Zap, FileText, RefreshCw, Home, Download,
} from 'lucide-react';
import { useTransactionStore } from '@/store/useTransactionStore';
import type { Transaction } from '@/store/useTransactionStore';
import { formatNGN, formatDate } from '@/utils/formatting';
import { bpToast } from '@/lib/bpToast';

const STATUS_CONFIG = {
  success: { label: 'Successful', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', Icon: CheckCircle2 },
  completed: { label: 'Completed', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', Icon: CheckCircle2 },
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', Icon: Clock },
  failed: { label: 'Failed', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', Icon: XCircle },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  transfer: ArrowUpRight, bills: Zap, deposit: ArrowDownLeft, withdrawal: ArrowUpRight,
};

const CATEGORY_LABELS: Record<string, string> = {
  transfer: 'Transfer', bills: 'Bill Payment', deposit: 'Deposit', withdrawal: 'Withdrawal',
};

const getCategoryIcon = (category?: string): React.ElementType => {
  return CATEGORY_ICONS[category || 'transfer'] ?? FileText;
};

const getCategoryLabel = (category?: string): string => {
  return CATEGORY_LABELS[category || 'transfer'] ?? 'Transfer';
};

function DetailRow({ label, value, mono, copy, onCopy }: {
  label: string; value: string; mono?: boolean; copy?: boolean; onCopy?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5 border-b last:border-0"
      style={{ borderColor: 'var(--border)' }}>
      <span className="text-xs shrink-0 pt-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`text-xs font-bold text-right break-all ${mono ? 'font-mono' : ''}`}
          style={{ color: 'var(--text-primary)' }}>{value || '—'}</span>
        {copy && (
          <button onClick={onCopy} className="flex-shrink-0 p-1 rounded-lg"
            style={{ color: 'var(--text-tertiary)' }}>
            <Copy size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function TransactionDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const txId = params.get('id') || '';

  const transactions = useTransactionStore(s => s.transactions);
  const [copied, setCopied] = useState(false);

  const tx: Transaction | undefined = transactions.find(t => t.id === txId);

  const copy = (text: string, label = 'Copied!') => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    bpToast.success(label);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!tx) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--surface-secondary)' }}>
          <FileText size={28} style={{ color: 'var(--text-tertiary)' }} />
        </div>
        <div>
          <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>Transaction not found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            This transaction may no longer be available.
          </p>
        </div>
        <Link href="/activity"
          className="rounded-2xl px-5 py-2.5 text-sm font-black"
          style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          View Activity
        </Link>
      </div>
    );
  }

  const statusKey = (tx.status as string === 'completed' ? 'completed' : tx.status) as keyof typeof STATUS_CONFIG;
  const sc = STATUS_CONFIG[statusKey] || STATUS_CONFIG.success;
  const StatusIcon = sc.Icon;
  const CategoryIcon = getCategoryIcon(tx.category);
  const isCredit = tx.type === 'credit';

  return (
    <div className="max-w-sm mx-auto py-4 space-y-4">

      {/* Amount hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl overflow-hidden"
        style={{
          background: isCredit
            ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)'
            : 'linear-gradient(135deg, var(--card) 0%, var(--surface-secondary) 100%)',
          border: isCredit ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border)',
        }}
      >
        <div className="p-6 text-center space-y-3">
          {/* Category icon + status */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: isCredit ? 'rgba(16,185,129,0.1)' : 'rgba(111,232,214,0.07)' }}>
              <CategoryIcon size={18} style={{ color: isCredit ? '#10B981' : '#6fe8d6' }} />
            </div>
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
              style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
              <StatusIcon size={12} style={{ color: sc.color }} />
              <span className="text-[11px] font-black" style={{ color: sc.color }}>{sc.label}</span>
            </div>
          </div>

          <div>
            <p className={`text-4xl font-black tracking-tight ${isCredit ? 'text-[#10B981]' : ''}`}
              style={{ color: isCredit ? '#10B981' : 'var(--text-primary)' }}>
              {isCredit ? '+' : '−'}{formatNGN(tx.amount)}
            </p>
            <p className="text-sm mt-2 font-bold" style={{ color: 'var(--text-primary)' }}>{tx.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{tx.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
            Transaction Details
          </p>
        </div>
        <DetailRow label="Type" value={getCategoryLabel(tx.category)} />
        <DetailRow label="Direction" value={isCredit ? 'Money received' : 'Money sent'} />
        <DetailRow label="Date & time" value={formatDate(tx.date || tx.createdAt || '', 'full')} />
        <DetailRow label="Transaction fee" value="Free" />
        <DetailRow label="Status" value={sc.label} />
      </motion.div>

      {/* Reference */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
            Reference
          </p>
        </div>
        <DetailRow
          label="Transaction ID"
          value={tx.id}
          mono
          copy
          onCopy={() => copy(tx.id, 'Transaction ID copied!')}
        />
        {tx.reference && (
          <DetailRow
            label="Reference"
            value={tx.reference}
            mono
            copy
            onCopy={() => copy(tx.reference!, 'Reference copied!')}
          />
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.38 }}
        className="grid grid-cols-2 gap-2.5"
      >
        <Link href="/activity"
          className="flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black transition-all active:scale-97"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          <FileText size={13} /> All Activity
        </Link>
        <Link href="/dashboard"
          className="flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black transition-all active:scale-97"
          style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          <Home size={13} /> Home
        </Link>
      </motion.div>

      {tx.status === 'failed' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <Link href="/transfer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black transition-all active:scale-97"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <RefreshCw size={13} /> Retry Transfer
          </Link>
        </motion.div>
      )}
    </div>
  );
}
