import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, Home, Wifi, AlertTriangle, Ban, HelpCircle, ArrowRight } from 'lucide-react';
import { formatNGN } from '@/utils/formatting';

const FAILURE_REASONS: Record<string, { title: string; description: string; icon: React.ElementType; color: string; bg: string }> = {
  insufficient_balance: {
    title: 'Insufficient Balance',
    description: 'Your wallet balance is too low for this transaction. Add money and try again.',
    icon: Ban,
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
  },
  network_error: {
    title: 'Network Error',
    description: 'We couldn\'t reach our servers. Please check your internet connection and retry.',
    icon: Wifi,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  limit_exceeded: {
    title: 'Transfer Limit Exceeded',
    description: 'This amount exceeds your daily transfer limit. You can increase limits in your profile settings.',
    icon: AlertTriangle,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  invalid_recipient: {
    title: 'Invalid Recipient',
    description: 'The recipient account could not be found or is inactive. Please double-check the details.',
    icon: HelpCircle,
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
  },
  timeout: {
    title: 'Transaction Timed Out',
    description: 'The transaction took too long and was cancelled. Your money was not debited.',
    icon: Wifi,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
};

const DEFAULT_REASON = {
  title: 'Transaction Failed',
  description: 'Something went wrong and the transaction could not be completed. Your money was not debited.',
  icon: XCircle,
  color: '#f87171',
  bg: 'rgba(248,113,113,0.1)',
};

export default function TransactionFailedPage() {
  const params = new URLSearchParams(window.location.search);
  const amount = parseFloat(params.get('amount') || '0');
  const recipient = params.get('recipient') || '';
  const reasonKey = params.get('reason') || 'unknown';
  const retryPath = params.get('retry') || '/transfer';

  const reason = FAILURE_REASONS[reasonKey] || DEFAULT_REASON;
  const Icon = reason.icon;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-sm space-y-5">

        {/* Failed icon + heading */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: reason.bg, border: `2px solid ${reason.color}33` }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.15 }}
            >
              <Icon size={40} style={{ color: reason.color }} strokeWidth={1.8} />
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-1.5"
              style={{ color: reason.color }}>{reason.title}</p>
            {amount > 0 && (
              <p className="text-4xl font-black tracking-tight line-through"
                style={{ color: 'var(--text-tertiary)' }}>
                {formatNGN(amount)}
              </p>
            )}
            {recipient && (
              <p className="text-sm mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                To: <strong style={{ color: 'var(--text-secondary)' }}>{recipient}</strong>
              </p>
            )}
          </motion.div>
        </div>

        {/* Reason card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="rounded-2xl p-4"
          style={{ background: reason.bg, border: `1px solid ${reason.color}33` }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: reason.color }}>{reason.title}</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {reason.description}
          </p>
        </motion.div>

        {/* Reassurance note */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="rounded-2xl px-4 py-3.5"
          style={{ background: 'rgba(111,232,214,0.06)', border: '1px solid rgba(111,232,214,0.15)' }}
        >
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: '#6fe8d6' }}>Your money is safe.</strong> No funds were deducted from your wallet. If you believe this is an error, contact support.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="space-y-2.5">
          <Link href={retryPath}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black transition-all active:scale-97"
            style={{ background: '#6fe8d6', color: '#1a1a1a', boxShadow: '0 4px 20px rgba(111,232,214,0.25)' }}>
            <RefreshCw size={15} /> Try Again
          </Link>
          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/dashboard"
              className="flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black transition-all active:scale-97"
              style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <Home size={13} /> Home
            </Link>
            <Link href="/profile/support"
              className="flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black transition-all active:scale-97"
              style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              Get Help <ArrowRight size={13} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
