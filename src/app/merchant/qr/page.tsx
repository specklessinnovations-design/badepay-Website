import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Copy, Check, Share2, QrCode, Store, Zap, Plus, X, Loader2, ArrowLeft, Download, Printer, ArrowUpRight, Sparkles, ChevronRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { buildMerchantQrPayload } from '@/types/merchant';
import { merchantService } from '@/services/merchantService';
import { useMerchantStore } from '@/store/useMerchantStore';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

export default function MerchantQrPage() {
  const profile = useAuthStore((s) => s.user?.merchantProfile);
  const payments = useMerchantStore((s) => s.payments);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'static' | 'dynamic'>('static');
  const [showNewQR, setShowNewQR] = useState(false);
  const [showFullscreenQR, setShowFullscreenQR] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [loadingDynamicQr, setLoadingDynamicQr] = useState(false);
  const [dynamicQrPayload, setDynamicQrPayload] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(true);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState<string>('');

  const businessName = profile?.tradingName || profile?.businessName || 'My Business';
  const tradingSlug = profile?.qrSlug || (profile?.tradingName || businessName).toLowerCase().replace(/[^a-z0-9]/g, '');
  const shareUrl = `badepay.ng/pay/${tradingSlug}`;

  // Real stats from payments
  const collections = payments.filter(p => p.status === 'success');
  const totalScans = collections.length;
  const totalCollected = collections.reduce((s, p) => s + p.amount, 0);
  const avgTicket = collections.length > 0 ? Math.round(totalCollected / collections.length) : 0;

  // Fetch static QR from backend
  useEffect(() => {
    async function fetchQr() {
      try {
        const data = await merchantService.generateQrCode();
        const payload = data?.qrCode || (profile ? buildMerchantQrPayload(profile) : '');
        setQrPayload(payload);
      } catch {
        if (profile) {
          setQrPayload(buildMerchantQrPayload(profile));
        }
      } finally {
        setLoadingQr(false);
      }
    }
    if (profile?.onboardingComplete) {
      fetchQr();
    }
  }, [profile]);

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

  // Generate dynamic QR code image from payload
  useEffect(() => {
    if (!dynamicQrPayload) return;

    QRCode.toDataURL(dynamicQrPayload, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0a0a0a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setDynamicQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Dynamic QR Code generation error:', err);
      });
  }, [dynamicQrPayload]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleGenerateDynamicQr = async () => {
    if (!newAmount || Number(newAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoadingDynamicQr(true);
    try {
      const data = await merchantService.generateDynamicQrCode(Number(newAmount));
      const payload = data?.qrCode || '';
      if (payload) {
        setDynamicQrPayload(payload);
        setShowNewQR(false);
        setShowFullscreenQR(true);
        toast.success('Dynamic QR code generated!');
        setNewLabel('');
        setNewAmount('');
      } else {
        toast.error('Failed to generate QR code');
      }
    } catch {
      toast.error('Failed to generate QR code');
    } finally {
      setLoadingDynamicQr(false);
    }
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
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/merchant" className="h-9 w-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
          <ArrowLeft size={16} style={{ color: 'var(--text-secondary)' }} />
        </Link>
        <div className="flex flex-col items-center">
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>QR Codes</div>
          <div className="text-[10px] font-medium" style={{ color: 'var(--accent-text)' }}>Merchant Terminal</div>
        </div>
        <button onClick={() => setShowNewQR(true)} className="h-9 w-9 rounded-full flex items-center justify-center" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          <Plus size={16} />
        </button>
      </div>

      {/* Primary QR card */}
      <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #081a18 0%, #0d2e2a 60%, #081a18 100%)', border: '1px solid rgba(111,232,214,0.2)' }}>
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full pointer-events-none" style={{ background: 'rgba(111,232,214,0.1)', filter: 'blur(48px)' }} />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full pointer-events-none" style={{ background: 'rgba(111,232,214,0.05)', filter: 'blur(32px)' }} />

        {/* Business name + badge */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(111,232,214,0.6)' }}>Primary QR</div>
            <div className="text-sm font-semibold mt-0.5 truncate max-w-[200px]" style={{ color: '#ffffff' }}>{businessName}</div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
            ● Active
          </span>
        </div>

        {/* QR + stats side by side */}
        <div className="relative z-10 flex items-stretch gap-5">
          {/* QR code visual */}
          <div className="shrink-0 rounded-2xl flex items-center justify-center" style={{ width: 148, height: 148, background: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}>
            {loadingQr ? (
              <Loader2 size={32} className="animate-spin" style={{ color: '#6fe8d6' }} />
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
              <QrPattern size={128} />
            )}
          </div>

          {/* Live stats */}
          <div className="flex-1 flex flex-col justify-between py-1">
            {collections.length > 0 ? (
              <>
                <Stat label="Payments received" value={String(totalScans)} />
                <div className="h-px" style={{ background: 'rgba(111,232,214,0.2)' }} />
                <Stat label="Total collected" value={`₦${(totalCollected / 1000).toFixed(1)}k`} />
                <div className="h-px" style={{ background: 'rgba(111,232,214,0.2)' }} />
                <Stat label="Average ticket" value={`₦${avgTicket.toLocaleString()}`} />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                <Sparkles size={24} style={{ color: 'rgba(111,232,214,0.5)' }} />
                <div className="text-xs font-medium leading-snug" style={{ color: 'rgba(111,232,214,0.6)' }}>
                  Share your QR to start receiving payments
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shareable link pill */}
        <button onClick={handleCopy} className="relative z-10 mt-4 w-full h-11 rounded-xl inline-flex items-center justify-between px-4 gap-2 cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(111,232,214,0.15)' }}>
          <span className="font-mono text-xs tracking-wider truncate" style={{ color: 'rgba(111,232,214,0.6)' }}>{shareUrl}</span>
          <span className="shrink-0">
            {copied ? <Check size={14} style={{ color: '#6fe8d6' }} /> : <Copy size={14} style={{ color: 'rgba(111,232,214,0.6)' }} />}
          </span>
        </button>
        {copied && (
          <div className="relative z-10 mt-2 text-center text-xs font-semibold" style={{ color: '#6fe8d6' }}>
            Link copied to clipboard ✓
          </div>
        )}

        {/* Action buttons */}
        <div className="relative z-10 mt-3 grid grid-cols-4 gap-2">
          {[
            { icon: Download, label: 'Download' },
            { icon: Share2, label: 'Share' },
            { icon: Printer, label: 'Print' },
            { icon: QrCode, label: 'Display', action: () => setShowFullscreenQR(true) },
          ].map((a) => (
            <button key={a.label} onClick={a.action || undefined} className="h-11 rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(111,232,214,0.15)', color: 'rgba(111,232,214,0.8)' }}>
              <a.icon size={14} /> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* QR Type Selection Cards */}
      <div>
        <div className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-tertiary)' }}>QR Code Types</div>
        <div className="space-y-3">
          {/* Static QR Card */}
          <button onClick={() => setTab('static')} className={`w-full rounded-2xl p-4 flex items-start gap-4 text-left transition-all ${tab === 'static' ? 'ring-2 ring-[#6fe8d6]/20' : ''}`} style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(111,232,214,0.1)' }}>
              <QrCode size={20} style={{ color: '#6fe8d6' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Static QR</div>
                {tab === 'static' && <div className="h-2 w-2 rounded-full bg-[#6fe8d6]" />}
              </div>
              <div className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Customer scans QR — funds land in your wallet instantly
              </div>
              {collections.length > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#34d399' }}>
                  <ArrowUpRight size={14} />
                  {totalScans} payment{totalScans !== 1 ? 's' : ''} collected
                </div>
              )}
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
          </button>

          {/* Dynamic QR Card */}
          <button onClick={() => setTab('dynamic')} className={`w-full rounded-2xl p-4 flex items-start gap-4 text-left transition-all ${tab === 'dynamic' ? 'ring-2 ring-[#8A2BE2]/20' : ''}`} style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(138,43,226,0.1)' }}>
              <Zap size={20} style={{ color: '#8A2BE2' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Dynamic QR</div>
                {tab === 'dynamic' && <div className="h-2 w-2 rounded-full bg-[#8A2BE2]" />}
              </div>
              <div className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Set exact invoice amount for each transaction
              </div>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
          </button>

          {/* Printable QR Card */}
          <button onClick={() => setShowFullscreenQR(true)} className="w-full rounded-2xl p-4 flex items-start gap-4 text-left transition-all" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(52,211,153,0.1)' }}>
              <Printer size={20} style={{ color: '#34d399' }} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Printable QR</div>
              <div className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Download & print for your counter or storefront
              </div>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
          </button>
        </div>
      </div>

      {/* Dynamic QR Generation */}
      {tab === 'dynamic' && (
        <button onClick={() => setShowNewQR(true)} className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          <Plus size={18} /> Generate New Dynamic QR
        </button>
      )}

      {/* How it works */}
      <div>
        <div className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-tertiary)' }}>How it works</div>
        <div className="space-y-2.5">
          {[
            { n: '1', title: 'Display your QR', desc: 'Show it on screen or print it for your counter or storefront.' },
            { n: '2', title: 'Customer scans', desc: 'They scan with any banking app — Bade Pay, Kuda, Moniepoint, GTB and more.' },
            { n: '3', title: 'Instant settlement', desc: 'Funds land in your Bade Pay wallet immediately, with SMS confirmation.' },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-3.5 rounded-2xl px-4 py-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
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
      <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(111,232,214,0.05)', border: '1px solid rgba(111,232,214,0.15)' }}>
        <Lock size={16} style={{ color: '#6fe8d6' }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          All QR payments are <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>end-to-end encrypted</span> and verified by Bade Pay's fraud engine in real time.
        </p>
      </div>

      {/* Generate new dynamic QR drawer */}
      {showNewQR && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={() => setShowNewQR(false)}>
          <div className="rounded-t-3xl p-6" style={{ background: 'var(--background)' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full mx-auto mb-5" style={{ background: 'var(--border)' }} />
            <div className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>New Dynamic QR</div>
            <div className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>Generate a one-time QR for a specific amount.</div>

            <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Label / Purpose</label>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Table 4 order, Invoice #001" className="w-full h-12 rounded-2xl px-4 text-sm outline-none mb-4" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />

            <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Amount (₦)</label>
            <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Enter exact amount" className="w-full h-12 rounded-2xl px-4 text-sm font-mono outline-none mb-5" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />

            <button onClick={handleGenerateDynamicQr} disabled={!newLabel.trim() || !newAmount || loadingDynamicQr} className="w-full h-13 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
              {loadingDynamicQr ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><QrCode size={18} /> Generate QR Code</>}
            </button>
            <button onClick={() => setShowNewQR(false)} className="w-full mt-3 h-11 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen QR display */}
      {showFullscreenQR && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--background)' }}>
          <div className="px-6 pt-2 flex items-center justify-between">
            <button onClick={() => setShowFullscreenQR(false)} className="h-9 w-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
              <X size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Display QR Code</div>
            <div className="w-9" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center mb-8">
              <div className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{businessName}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Scan to pay</div>
            </div>

            <div className="rounded-3xl p-6" style={{ background: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}>
              {loadingQr ? (
                <Loader2 size={128} className="animate-spin" style={{ color: '#6fe8d6' }} />
              ) : dynamicQrDataUrl ? (
                <img src={dynamicQrDataUrl} alt="QR Code" className="w-64 h-64 object-contain" />
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 object-contain" />
              ) : (
                <QrPattern size={256} />
              )}
            </div>

            <div className="mt-8 text-center">
              <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Share this link</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-11 rounded-xl px-4 flex items-center justify-center" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                  <span className="font-mono text-xs tracking-wider truncate" style={{ color: 'var(--text-tertiary)' }}>{shareUrl}</span>
                </div>
                <button onClick={handleCopy} className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              {copied && (
                <div className="mt-2 text-xs font-semibold" style={{ color: '#6fe8d6' }}>
                  Link copied to clipboard ✓
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'rgba(111,232,214,0.6)' }}>{label}</div>
      <div className="text-lg font-bold tabular mt-0.5" style={{ color: '#ffffff' }}>{value}</div>
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
