import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Copy, Share2, ArrowRight, Home, RefreshCw } from 'lucide-react';
import { formatNGN, formatDate } from '@/utils/formatting';
import { bpToast } from '@/lib/bpToast';

function Particle({ x, color, delay }: { x: number; color: string; delay: number }) {
  return (
    <motion.div
      className="absolute top-0 w-2 h-2 rounded-full pointer-events-none"
      style={{ left: `${x}%`, background: color }}
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -160, opacity: 0, scale: 0.4, x: (Math.random() - 0.5) * 80 }}
      transition={{ duration: 1.4, delay, ease: 'easeOut' }}
    />
  );
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: 10 + (i / 17) * 80,
  color: ['#6fe8d6', '#34d399', '#60a5fa', '#a78bfa', '#fbbf24'][i % 5],
  delay: (i / 17) * 0.4,
}));

export default function TransactionSuccessPage() {
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const [showParticles, setShowParticles] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const amount = parseFloat(params.get('amount') || '0');
  const recipient = params.get('recipient') || '';
  const reference = params.get('reference') || '';
  const type = params.get('type') || 'transfer';
  const bank = params.get('bank') || '';
  const note = params.get('note') || '';
  const date = params.get('date') || new Date().toISOString();
  const fee = parseFloat(params.get('fee') || '0');

  useEffect(() => {
    const t = setTimeout(() => setShowParticles(false), 2200);
    return () => clearTimeout(t);
  }, []);

  const copyRef = () => {
    if (!reference) return;
    navigator.clipboard.writeText(reference);
    setCopied(true);
    bpToast.success('Reference copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const typeLabel = type === 'bank' ? 'Bank Transfer' : type === 'bill' ? 'Bill Payment' : type === 'scan' ? 'QR Payment' : 'BadePay Transfer';

  const details = [
    { label: 'Recipient', value: recipient, show: !!recipient },
    { label: 'Bank', value: bank, show: !!bank },
    { label: 'Type', value: typeLabel, show: true },
    { label: 'Date & time', value: formatDate(date, 'full'), show: true },
    { label: 'Note', value: note, show: !!note },
    { label: 'Transaction fee', value: fee > 0 ? formatNGN(fee) : 'Free', show: true },
    { label: 'Reference', value: reference, show: !!reference, copy: true },
  ].filter(d => d.show);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-8 px-4">
      {/* Confetti particles */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <AnimatePresence>
          {showParticles && PARTICLES.map((p, i) => (
            <Particle key={i} {...p} />
          ))}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-sm space-y-5">
        {/* Success icon */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: 'rgba(52,211,153,0.12)', border: '2px solid rgba(52,211,153,0.3)' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.25 }}
            >
              <CheckCircle2 size={40} style={{ color: '#34d399' }} strokeWidth={2} />
            </motion.div>
            {/* Ring pulse */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: '2px solid #34d399' }}
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-1.5"
              style={{ color: '#34d399' }}>Transaction Successful</p>
            <p className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {formatNGN(amount)}
            </p>
            {recipient && (
              <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                Sent to <strong style={{ color: 'var(--text-primary)' }}>{recipient}</strong>
              </p>
            )}
          </motion.div>
        </div>

        {/* Details card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
              Receipt Details
            </p>
          </div>
          {details.map(({ label, value, copy }, i) => (
            <div key={label}
              className="flex items-center justify-between gap-4 px-4 py-3 border-b last:border-0"
              style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold text-right truncate" style={{ color: 'var(--text-primary)' }}>{value}</span>
                {copy && (
                  <button onClick={copyRef}
                    className="flex-shrink-0 p-1 rounded-lg transition-colors"
                    style={{ color: copied ? '#34d399' : 'var(--text-tertiary)' }}>
                    {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="space-y-2.5">
          <Link href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black transition-all active:scale-97"
            style={{ background: '#6fe8d6', color: '#1a1a1a', boxShadow: '0 4px 20px rgba(111,232,214,0.3)' }}>
            <Home size={16} /> Back to Home
          </Link>
          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/transfer"
              className="flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black transition-all active:scale-97"
              style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <RefreshCw size={13} /> New Transfer
            </Link>
            <Link href="/activity"
              className="flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black transition-all active:scale-97"
              style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              View History <ArrowRight size={13} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
