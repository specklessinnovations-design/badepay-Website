import React, { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Copy, Check, Share2, QrCode, Store, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { buildMerchantQrPayload } from '@/types/merchant';
import toast from 'react-hot-toast';

export default function MerchantQrPage() {
  const profile = useAuthStore((s) => s.user?.merchantProfile);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const qrPayload = useMemo(() => {
    if (!profile?.onboardingComplete) return '';
    return buildMerchantQrPayload(profile);
  }, [profile]);

  const qrUrl = profile?.qrSlug ? `https://badepay.ng/m/${profile.qrSlug}` : '';

  const copyLink = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    setCopiedLink(true);
    toast.success('Payment link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyPayload = () => {
    if (!qrPayload) return;
    navigator.clipboard.writeText(qrPayload);
    setCopiedPayload(true);
    toast.success('QR payload copied!');
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  if (!profile?.onboardingComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5 accent-icon-wrap">
          <QrCode size={28} style={{ color: 'var(--accent-text)' }} />
        </div>
        <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
          Set up your QR code
        </h2>
        <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
          Complete merchant onboarding to get your personal payment QR code.
        </p>
        <Link href="/merchant/onboarding"
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition-all active:scale-95"
          style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          Complete onboarding <Zap size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">

      {/* ── QR hero card ── */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: "easeOut" as const }}
        className="relative overflow-hidden rounded-3xl p-8 text-center"
        style={{ background: 'linear-gradient(135deg, #081a18 0%, #0d2e2a 60%, #081a18 100%)', border: '1px solid rgba(111,232,214,0.2)' }}>
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-64 w-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(111,232,214,0.12) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Store size={13} style={{ color: 'rgba(111,232,214,0.6)' }} />
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(111,232,214,0.6)' }}>
              Scan to pay
            </p>
          </div>
          <p className="text-lg font-black mb-6" style={{ color: '#ffffff' }}>{profile.tradingName}</p>

          {/* QR code */}
          <div className="mx-auto rounded-2xl p-4 shadow-[0_0_40px_rgba(111,232,214,0.15),0_0_80px_rgba(111,232,214,0.08)]"
            style={{ background: '#ffffff', width: 'fit-content' }}>
            <QrPattern size={200} />
          </div>

          <p className="mt-5 font-mono text-xs" style={{ color: 'rgba(111,232,214,0.5)' }}>
            {qrUrl.replace('https://', '')}
          </p>

          {/* Merchant ID */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(111,232,214,0.08)', border: '1px solid rgba(111,232,214,0.15)' }}>
            <div className="h-1.5 w-1.5 rounded-full bg-[#6fe8d6] animate-pulse" />
            <span className="text-[10px] font-bold font-mono" style={{ color: '#6fe8d6' }}>
              {profile.merchantId}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Actions ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 gap-3">
        <button onClick={copyLink}
          className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black transition-all active:scale-95"
          style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          <AnimatePresence mode="wait">
            {copiedLink
              ? <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2"><Check size={15} /> Copied!</motion.span>
              : <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2"><Copy size={15} /> Copy Link</motion.span>
            }
          </AnimatePresence>
        </button>
        <button onClick={copyPayload}
          className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black transition-all active:scale-95"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          <AnimatePresence mode="wait">
            {copiedPayload
              ? <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2"><Check size={15} /> Copied!</motion.span>
              : <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2"><QrCode size={15} /> QR Data</motion.span>
            }
          </AnimatePresence>
        </button>
      </motion.div>

      {/* ── Info card ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h3 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
          How it works
        </h3>
        <div className="space-y-3">
          {[
            { n: '1', text: 'Customer opens BadePay and taps Scan' },
            { n: '2', text: 'They point the camera at your QR code' },
            { n: '3', text: 'Payment is instant — funds hit your wallet' },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 accent-icon-wrap"
                style={{ color: 'var(--accent-text)' }}>{n}</div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function QrPattern({ size = 200 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
      <rect width="100" height="100" fill="#fff" />
      {Array.from({ length: 14 * 14 }).map((_, i) => {
        const x = (i % 14) * 7 + 1;
        const y = Math.floor(i / 14) * 7 + 1;
        const on = ((i * 13 + 7) % 5) > 2;
        return on ? <rect key={i} x={x} y={y} width="6" height="6" fill="#0a0a0a" rx="1" /> : null;
      })}
      {[[2, 2], [76, 2], [2, 76]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="22" height="22" fill="#0a0a0a" rx="3" />
          <rect x={x + 4} y={y + 4} width="14" height="14" fill="#fff" rx="2" />
          <rect x={x + 7} y={y + 7} width="8" height="8" fill="#0a0a0a" rx="1" />
        </g>
      ))}
    </svg>
  );
}
