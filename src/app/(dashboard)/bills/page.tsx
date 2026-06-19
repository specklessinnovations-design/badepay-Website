

import React, { Suspense, useEffect, useState } from 'react';
import { Zap, Smartphone, Wifi, Tv, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWalletStore } from '@/store/useWalletStore';
import { formatNGN } from '@/utils/formatting';
import toast from 'react-hot-toast';
import { AIRTIME_PROVIDERS, DATA_PROVIDERS, ELECTRICITY_PROVIDERS, CABLE_TV_PROVIDERS, BETTING_PROVIDERS } from '@/data/providers';
import { TransactionPinModal } from '@/components/auth/TransactionPinModal';

type BillType = 'airtime' | 'data' | 'electricity' | 'cable' | 'betting';

const CATEGORIES: { id: BillType; label: string; icon: React.ElementType }[] = [
  { id: 'airtime', label: 'Airtime', icon: Smartphone },
  { id: 'data', label: 'Data', icon: Wifi },
  { id: 'electricity', label: 'Electricity', icon: Zap },
  { id: 'cable', label: 'Cable TV', icon: Tv },
  { id: 'betting', label: 'Betting', icon: Zap },
];

const PROVIDERS: Record<BillType, readonly string[]> = {
  airtime: AIRTIME_PROVIDERS,
  data: DATA_PROVIDERS,
  electricity: ELECTRICITY_PROVIDERS,
  cable: CABLE_TV_PROVIDERS,
  betting: BETTING_PROVIDERS,
};

const QUICK_AMOUNTS: Record<BillType, number[]> = {
  airtime: [100, 200, 500, 1000, 2000, 5000],
  data: [500, 1000, 2000, 5000],
  electricity: [2000, 5000, 10000, 20000],
  cable: [2500, 5000, 9000, 15000],
  betting: [500, 1000, 2000, 5000, 10000],
};

function BillsContent() {
  const searchParams = new URLSearchParams(window.location.search);
  const typeParam = searchParams.get('type') as BillType | null;
  const [category, setCategory] = useState<BillType | null>(null);
  const [provider, setProvider] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const balance = useAuthStore((s) => s.user?.balance ?? 0);
  const userPhone = useAuthStore((s) => s.user?.phone ?? '');
  const payBill = useWalletStore((s) => s.payBill);

  useEffect(() => {
    if (typeParam && PROVIDERS[typeParam]) {
      setCategory(typeParam);
    }
  }, [typeParam]);

  useEffect(() => {
    if (category && (category === 'airtime' || category === 'data') && userPhone && !reference) {
      setReference(userPhone.replace(/\D/g, '').slice(-11));
    }
  }, [category, userPhone, reference]);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !provider) {
      toast.error('Select a category and provider');
      return;
    }
    if (!reference.trim()) {
      if (category === 'electricity' || category === 'cable' || category === 'betting') {
        toast.error('Enter meter/smartcard/customer ID');
      } else {
        toast.error('Enter phone number');
      }
      return;
    }
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (value > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setShowPinModal(true);
  };

  const handlePay = async () => {
    const value = parseFloat(amount);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const label = `${provider} ${category}`;
    const ok = payBill(label, value, 'bills', `${category} · ${reference}`);
    setLoading(false);

    if (ok) {
      toast.success(`${label} paid successfully`);
      setAmount('');
      if (category !== 'airtime' && category !== 'data') setReference('');
    } else {
      toast.error('Payment failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-[#6fe8d6]/20 bg-gradient-to-br from-[#6fe8d6]/10 to-[#6fe8d6]/5 p-6">
        <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Available balance</p>
        <p className="mt-2 text-3xl font-black text-[var(--text-primary)]">{formatNGN(balance)}</p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-black text-[var(--text-primary)]">Select category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setCategory(id);
                setProvider('');
              }}
              className="group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-300 hover:scale-105"
              style={{
                background: category === id ? 'var(--accent-bg)' : 'var(--card)',
                borderColor: category === id ? 'var(--accent-text)' : 'var(--border)',
                boxShadow: category === id ? 'var(--shadow-glow)' : 'none',
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 accent-icon-wrap">
                <Icon size={24} style={{ color: 'var(--accent-text)' }} />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {category && (
        <form onSubmit={handleConfirm} className="space-y-6">
          <div>
            <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Provider</label>
            <div className="relative">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full appearance-none rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-base font-medium text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200 cursor-pointer"
              >
                <option value="">Select a provider</option>
                {PROVIDERS[category].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]" />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">
              {category === 'electricity' || category === 'cable' || category === 'betting' ? 'Meter / Smartcard / Customer ID' : 'Phone number'}
            </label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={category === 'electricity' ? 'Meter number' : category === 'betting' ? 'Customer ID' : '08012345678'}
              className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-base font-medium text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Quick amounts</label>
            <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_AMOUNTS[category].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(String(amt))}
                  className={`rounded-2xl px-4 py-3 text-sm font-black transition-all duration-300 hover:scale-105 ${
                    amount === String(amt)
                      ? 'bg-[#6fe8d6] text-[#1a1a1a] shadow-[var(--shadow-glow)]'
                      : 'border-2 border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:border-[#6fe8d6]/50'
                  }`}
                >
                  {formatNGN(amt)}
                </button>
              ))}
            </div>
            <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Amount (₦)</label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-lg font-bold text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !provider}
            className="w-full rounded-2xl bg-[#6fe8d6] py-4 text-base font-black text-[#1a1a1a] shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[var(--shadow-glow-strong)] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Processing…' : `Pay ${category}`}
          </button>
        </form>
      )}

      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePay}
      />
    </div>
  );
}

export default function BillsPage() {
  return (
    <Suspense fallback={<p className="text-[var(--text-secondary)]">Loading…</p>}>
      <BillsContent />
    </Suspense>
  );
}
