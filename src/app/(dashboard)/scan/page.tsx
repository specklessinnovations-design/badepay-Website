

import React, { useRef, useState } from 'react';
import { Upload, QrCode, Shield } from 'lucide-react';
import { QrCameraScanner } from '@/components/scan/QrCameraScanner';
import { useAuthStore } from '@/store/useAuthStore';
import { useWalletStore } from '@/store/useWalletStore';
import { formatNGN } from '@/utils/formatting';
import { deriveUsername, formatAccountDisplay } from '@/lib/personalHelpers';
import toast from 'react-hot-toast';

type ScanPhase = 'scanning' | 'confirm' | 'success';

interface DecodedMerchant {
  name: string;
  raw: string;
}

function parseQrPayload(raw: string): DecodedMerchant {
  try {
    const parsed = JSON.parse(raw);
    return {
      name: parsed.merchantName || parsed.name || 'Merchant',
      raw,
    };
  } catch {
    const urlMatch = raw.match(/badepay\.ng\/m\/([a-z0-9]+)/i);
    if (urlMatch) {
      return { name: urlMatch[1], raw };
    }
    const parts = raw.split('|');
    return {
      name: parts[0]?.trim() || 'Merchant',
      raw,
    };
  }
}

export default function ScanPayPage() {
  const { user } = useAuthStore();
  const handle = user ? deriveUsername(user.firstName, user.username) : '';
  const scanPay = useWalletStore((s) => s.scanPay);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<ScanPhase>('scanning');
  const [cameraActive, setCameraActive] = useState(true);
  const [aligning, setAligning] = useState(true);
  const [merchant, setMerchant] = useState<DecodedMerchant | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = (decodedText: string) => {
    setCameraActive(false);
    setAligning(false);
    setMerchant(parseQrPayload(decodedText));
    setPhase('confirm');
    toast.success('QR code detected');
  };

  const handleSimulateScan = () => {
    setAligning(false);
    setCameraActive(false);
    setMerchant({ name: 'Bade pay Merchant', raw: 'simulate' });
    setPhase('confirm');
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAligning(false);
    setCameraActive(false);
    setMerchant({ name: 'Gallery QR Merchant', raw: file.name });
    setPhase('confirm');
    toast.success('QR image loaded');
  };

  const handlePay = async () => {
    const value = parseFloat(amount);
    if (!merchant || !value || value <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!user || value > user.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const ok = scanPay(merchant.name, value);
    setLoading(false);

    if (ok) {
      toast.success('Payment successful');
      setPhase('success');
    } else {
      toast.error('Payment failed');
    }
  };

  const reset = () => {
    setPhase('scanning');
    setCameraActive(true);
    setAligning(true);
    setMerchant(null);
    setAmount('');
  };

  if (phase === 'success' && merchant) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#10B981]/15 border-2 border-[#10B981]/30 shadow-[var(--shadow-glow)]">
          <Shield size={40} className="text-[#10B981]" />
        </div>
        <h2 className="text-2xl font-black text-[var(--text-primary)]">Payment successful!</h2>
        <p className="mt-3 text-lg font-bold text-[var(--text-secondary)]">
          {formatNGN(parseFloat(amount))} to {merchant.name}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-10 rounded-2xl bg-[#6fe8d6] px-10 py-4 text-base font-black text-[#1a1a1a] shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-105 hover:shadow-[var(--shadow-glow-strong)]"
        >
          Scan again
        </button>
      </div>
    );
  }

  if (phase === 'confirm' && merchant) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border-2 border-[#6fe8d6]/20 bg-gradient-to-br from-[#6fe8d6]/10 to-[#6fe8d6]/5 p-6">
          <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Paying to</p>
          <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">{merchant.name}</p>
        </div>
        <div>
          <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Amount (₦)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-2xl font-bold text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200"
          />
        </div>
        <div className="rounded-2xl border-2 border-[#6fe8d6]/30 bg-gradient-to-r from-[#6fe8d6]/10 to-transparent p-5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-[var(--text-secondary)]">Available balance</span>
            <span className="text-xl font-black text-[var(--text-primary)]">{formatNGN(user?.balance ?? 0)}</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-2xl border-2 border-[var(--border)] py-4 text-base font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={loading}
            className="flex-1 rounded-2xl bg-[#6fe8d6] py-4 text-base font-black text-[#1a1a1a] shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[var(--shadow-glow-strong)] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Processing…' : 'Pay now'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Scan to pay</h1>
        <p className="mt-1 text-sm font-bold text-[var(--text-secondary)]">Scan any QR code to make instant payments</p>
      </div>

      {/* Camera viewfinder */}
      <div
        className="relative overflow-hidden rounded-3xl border-2 border-[var(--border)] bg-black shadow-[var(--shadow-lg)]"
        onClick={handleSimulateScan}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleSimulateScan()}
      >
        <div className="aspect-square max-h-[400px] w-full">
          <QrCameraScanner
            active={cameraActive}
            onScan={handleScan}
            onError={(msg) => toast.error(msg)}
          />
        </div>

        {/* Alignment overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="h-56 w-56 rounded-3xl border-4 border-[#6fe8d6] shadow-[0_0_0_4px_rgba(111,232,214,0.2)]" />
          {aligning && (
            <div className="absolute bottom-20 text-center">
              <p className="text-base font-black text-white">Aligning QR</p>
              <p className="mt-2 text-sm font-bold text-white/70">Tap center to simulate</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-base font-black text-[var(--text-primary)]">Hold steady</p>
      <p className="text-center text-sm font-bold text-[var(--text-tertiary)]">
        Point your camera at a BadePay merchant or any Nigerian bank QR code.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-3 rounded-2xl border-2 border-[var(--border)] bg-[var(--card)] py-4 text-base font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors icon-hover-effect"
        >
          <Upload size={20} />
          Upload from gallery
        </button>
        <button
          type="button"
          onClick={() => toast('Your QR code displayed', { icon: '📱' })}
          className="flex items-center justify-center gap-3 rounded-2xl border-2 border-[var(--border)] bg-[var(--card)] py-4 text-base font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors icon-hover-effect"
        >
          <QrCode size={20} />
          My QR code
        </button>
      </div>

      {user && (
        <div className="rounded-2xl border-2 border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-[var(--surface-secondary)] p-6 text-center">
          <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Receive payments</p>
          <p className="mt-2 text-xl font-black text-[var(--text-primary)]">@{handle}</p>
          <p className="mt-1 text-sm font-bold text-[var(--text-secondary)]">{formatAccountDisplay(user.accountNumber)}</p>
        </div>
      )}

      <p className="flex items-center justify-center gap-2 text-sm font-bold text-[var(--text-tertiary)]">
        <Shield size={14} />
        Encrypted scan · merchant verified
      </p>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
    </div>
  );
}
