import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Download, Share2, QrCode, Copy, Check, Lock,
  X, Loader2, UserCircle2
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

export default function MyQRPage() {
  const [, navigate] = useLocation();
  const user = useAuthStore(s => s.user);
  const [copied, setCopied] = useState(false);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(true);
  const [showFullscreenQR, setShowFullscreenQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'My Account';
  const shareUrl = `badepay.ng/pay/${user?.accountNumber || 'me'}`;

  // Fetch personal QR code from backend
  useEffect(() => {
    async function fetchQrCode() {
      try {
        setLoadingQr(true);
        const data = await authService.generatePersonalQrCode();
        const payload = data.payload || user?.accountNumber || 'test-12345';
        setQrPayload(payload);
      } catch (error) {
        console.error('Failed to fetch QR code:', error);
        const fallbackPayload = user?.accountNumber || 'test-12345';
        setQrPayload(fallbackPayload);
      } finally {
        setLoadingQr(false);
      }
    }
    
    fetchQrCode();
  }, [user]);

  // Generate QR code image from payload
  useEffect(() => {
    if (!qrPayload) return;

    QRCode.toDataURL(qrPayload, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0a0a0a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR Code generation error:', err);
      });
  }, [qrPayload]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(`https://${shareUrl}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    toast.success('Link copied to clipboard!');
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `badepay-qr-${user?.accountNumber || 'personal'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My BadePay QR Code',
          text: `Scan to pay ${displayName} on BadePay`,
          url: `https://${shareUrl}`,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  if (!user) return null;

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/profile" className="h-9 w-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
          <ArrowLeft size={16} style={{ color: 'var(--text-secondary)' }} />
        </Link>
        <div className="flex flex-col items-center">
          <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>My QR Code</div>
          <div className="text-xs font-medium" style={{ color: '#6fe8d6' }}>Receive Money</div>
        </div>
        <div className="w-9" />
      </div>

      {/* Primary QR card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 relative overflow-hidden mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(111,232,214,0.1) 0%, rgba(77,212,192,0.05) 100%)', border: '1px solid var(--border)' }}>
        {/* Decorative orbs */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle, rgba(111,232,214,0.5) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full pointer-events-none opacity-10" style={{ background: 'radial-gradient(circle, rgba(111,232,214,0.4) 0%, transparent 65%)' }} />

        {/* User name + badge */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-tertiary)' }}>Personal QR</div>
            <div className="text-sm font-semibold mt-0.5 truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{displayName}</div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
            ● Active
          </span>
        </div>

        {/* QR + info side by side */}
        <div className="relative z-10 flex items-stretch gap-5">
          {/* QR code visual */}
          <div className="shrink-0 rounded-2xl bg-white p-3 shadow-sm flex items-center justify-center" style={{ width: 148, height: 148, border: '1px solid var(--border)' }}>
            {loadingQr ? (
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center">
                <QrCode size={40} style={{ color: 'var(--text-tertiary)' }} />
                <div className="text-xs mt-1" style={{ color: '#EF4444' }}>No payload</div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-tertiary)' }}>Account Number</div>
              <div className="text-lg font-bold mt-0.5 tabular" style={{ color: 'var(--text-primary)' }}>{user?.accountNumber || 'N/A'}</div>
            </div>
            <div className="h-px" style={{ background: 'var(--border)' }} />
            <div>
              <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-tertiary)' }}>Share link</div>
              <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{shareUrl}</div>
            </div>
          </div>
        </div>

        {/* Shareable link pill */}
        <button
          onClick={handleCopy}
          className="relative z-10 mt-4 w-full h-11 rounded-xl flex items-center justify-between px-4 gap-2 transition-colors active:scale-95"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
          <span className="font-mono text-xs tracking-wider truncate" style={{ color: 'var(--text-tertiary)' }}>{shareUrl}</span>
          <span className="shrink-0">
            {copied
              ? <Check size={14} style={{ color: '#6fe8d6' }} />
              : <Copy size={14} style={{ color: 'var(--text-tertiary)' }} />
            }
          </span>
        </button>

        {/* Action buttons */}
        <div className="relative z-10 mt-3 grid grid-cols-3 gap-2">
          <button
            onClick={handleDownload}
            className="h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <Download size={14} /> Download
          </button>
          <button
            onClick={handleShare}
            className="h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={() => setShowFullscreenQR(true)}
            className="h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <QrCode size={14} /> Display
          </button>
        </div>
      </motion.div>

      {/* How it works */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-tertiary)' }}>How it works</div>
        <div className="space-y-2.5">
          {[
            { n: '1', title: 'Share your QR', desc: 'Send the link or show your QR code to anyone who wants to pay you.' },
            { n: '2', title: 'They scan & pay', desc: 'They scan with any banking app — Bade Pay, Kuda, Moniepoint, GTB and more.' },
            { n: '3', title: 'Instant credit', desc: 'Money lands in your wallet immediately, with SMS confirmation.' },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-3.5 rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                {s.n}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.title}</div>
                <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security note */}
      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(111,232,214,0.05)', border: '1px solid rgba(111,232,214,0.15)' }}>
        <Lock size={16} style={{ color: '#6fe8d6' }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          All QR payments are <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>end-to-end encrypted</span> and verified by Bade Pay's fraud engine in real time.
        </p>
      </div>

      {/* Fullscreen QR display */}
      <AnimatePresence>
        {showFullscreenQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: 'var(--background)' }}>
            <div className="flex items-center justify-between p-6">
              <button
                onClick={() => setShowFullscreenQR(false)}
                className="h-9 w-9 rounded-full flex items-center justify-center"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                <X size={16} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Display QR Code</div>
              <div className="w-9" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="text-center mb-8">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(111,232,214,0.1)' }}>
                  <UserCircle2 size={32} style={{ color: '#6fe8d6' }} />
                </div>
                <div className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{displayName}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Scan to pay</div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-lg" style={{ border: '1px solid var(--border)' }}>
                {loadingQr ? (
                  <Loader2 className="h-32 w-32 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 object-contain" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <QrCode size={64} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                )}
              </div>

              <div className="mt-8 text-center w-full max-w-sm">
                <div className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Share this link</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-11 rounded-xl px-4 flex items-center justify-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <span className="font-mono text-xs tracking-wider truncate" style={{ color: 'var(--text-tertiary)' }}>{shareUrl}</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="h-11 w-11 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
