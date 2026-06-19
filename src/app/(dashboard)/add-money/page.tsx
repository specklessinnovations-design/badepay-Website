

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useWalletStore } from '@/store/useWalletStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatNGN } from '@/utils/formatting';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export default function AddMoneyPage() {
  const [, navigate] = useLocation();
  const deposit = useWalletStore((s) => s.deposit);
  const balance = useAuthStore((s) => s.user?.balance ?? 0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const value = parseFloat(amount);
    if (!value || value < 100) {
      toast.error('Minimum top-up is ₦100');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const ok = deposit(value);
    setLoading(false);
    if (ok) {
      toast.success(`${formatNGN(value)} added to your wallet`);
      navigate('/dashboard');
    } else {
      toast.error('Could not add money');
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={18} />
        Back to dashboard
      </button>

      <div>
        <h1 className="text-3xl font-black text-[var(--text-primary)]">Add money</h1>
        <p className="mt-2 text-sm font-bold text-[var(--text-secondary)]">Top up your wallet instantly</p>
      </div>

      <div className="rounded-2xl border-2 border-[#6fe8d6]/20 bg-gradient-to-br from-[#6fe8d6]/10 to-[#6fe8d6]/5 p-6">
        <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Current balance</p>
        <p className="mt-2 text-3xl font-black text-[var(--text-primary)]">{formatNGN(balance)}</p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-black text-[var(--text-primary)]">Quick amount</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setAmount(String(amt))}
              className={`rounded-xl px-4 py-3 text-sm font-black transition-all duration-300 hover:scale-105 ${
                amount === String(amt)
                  ? 'bg-[#6fe8d6] text-[#1a1a1a] shadow-[var(--shadow-glow)]'
                  : 'border-2 border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:border-[#6fe8d6]/50'
              }`}
            >
              {formatNGN(amt)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Amount (₦)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-lg font-bold text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200"
        />
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full rounded-2xl bg-[#6fe8d6] py-4 text-base font-black text-[#1a1a1a] shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[var(--shadow-glow-strong)] disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? 'Processing…' : 'Add money'}
      </button>
    </div>
  );
}

