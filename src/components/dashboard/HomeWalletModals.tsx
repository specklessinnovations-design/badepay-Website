

import React, { useState } from 'react';
import { PremiumModal } from '@/components/ui/premium-modal';
import { useWalletStore } from '@/store/useWalletStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatNGN } from '@/utils/formatting';
import toast from 'react-hot-toast';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export type HomeModalType = 'add' | 'transfer' | null;

interface HomeWalletModalsProps {
  type: HomeModalType;
  onClose: () => void;
}

export function HomeWalletModals({ type, onClose }: HomeWalletModalsProps) {
  if (!type) return null;

  if (type === 'add') return <AddMoneyModal onClose={onClose} />;
  return <TransferModal onClose={onClose} />;
}

function AddMoneyModal({ onClose }: { onClose: () => void }) {
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
      onClose();
    } else {
      toast.error('Could not add money');
    }
  };

  return (
    <PremiumModal isOpen title="Add money" onClose={onClose} size="full">
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#6fe8d6]/10 to-[#6fe8d6]/5 border border-[#6fe8d6]/20 p-6">
        <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Current balance</p>
        <p className="mt-2 text-3xl font-black text-[var(--text-primary)]">{formatNGN(balance)}</p>
      </div>
      <p className="mb-4 text-sm font-bold text-[var(--text-primary)]">Quick amount</p>
      <div className="mb-6 grid grid-cols-3 sm:grid-cols-6 gap-3">
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
      <Field label="Amount (₦)" value={amount} onChange={setAmount} type="number" placeholder="Enter amount" />
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-[#6fe8d6] py-4 text-base font-black text-[#1a1a1a] shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[var(--shadow-glow-strong)] disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? 'Processing…' : 'Add money'}
      </button>
    </PremiumModal>
  );
}



function TransferModal({ onClose }: { onClose: () => void }) {
  const transferToBank = useWalletStore((s) => s.transferToBank);
  const balance = useAuthStore((s) => s.user?.balance ?? 0);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const value = parseFloat(amount);
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast.error('Fill in all bank details');
      return;
    }
    if (accountNumber.replace(/\D/g, '').length < 10) {
      toast.error('Enter a valid 10-digit account number');
      return;
    }
    if (!value || value <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (value > balance) {
      toast.error('Insufficient balance');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const ok = transferToBank(bankName.trim(), accountNumber.trim(), accountName.trim(), value);
    setLoading(false);
    if (ok) {
      toast.success(`Transferred ${formatNGN(value)} to ${accountName}`);
      onClose();
    } else {
      toast.error('Transfer failed');
    }
  };

  return (
    <PremiumModal isOpen title="Bank transfer" onClose={onClose} size="full">
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#6fe8d6]/10 to-[#6fe8d6]/5 border border-[#6fe8d6]/20 p-6">
        <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Available balance</p>
        <p className="mt-2 text-3xl font-black text-[var(--text-primary)]">{formatNGN(balance)}</p>
      </div>
      <div className="space-y-5">
        <Field label="Bank name" value={bankName} onChange={setBankName} placeholder="e.g. GTBank, Access Bank" />
        <Field label="Account number" value={accountNumber} onChange={setAccountNumber} placeholder="10-digit account number" />
        <Field label="Account name" value={accountName} onChange={setAccountName} placeholder="Recipient's account name" />
        <Field label="Amount (₦)" value={amount} onChange={setAmount} type="number" placeholder="Enter amount" />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-[#6fe8d6] py-4 text-base font-black text-[#1a1a1a] shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[var(--shadow-glow-strong)] disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? 'Processing…' : 'Transfer'}
      </button>
    </PremiumModal>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[var(--text-primary)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-5 py-4 text-base font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200"
      />
    </div>
  );
}
