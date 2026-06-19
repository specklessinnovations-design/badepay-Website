

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useWalletStore } from '@/store/useWalletStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatNGN } from '@/utils/formatting';
import { ArrowLeft, User, Building2, ChevronDown } from 'lucide-react';
import { NIGERIAN_BANKS } from '@/data/providers';
import { TransactionPinModal } from '@/components/auth/TransactionPinModal';

type TransferType = 'badepay' | 'bank';

export default function TransferPage() {
  const [, navigate] = useLocation();
  const transferToBank = useWalletStore((s) => s.transferToBank);
  const sendMoney = useWalletStore((s) => s.sendMoney);
  const balance = useAuthStore((s) => s.user?.balance ?? 0);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const [transferType, setTransferType] = useState<TransferType>('badepay');
  const [recipient, setRecipient] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const goToSuccess = (value: number, name: string, extra?: Record<string, string>) => {
    const tx = addTransaction({
      name,
      amount: value,
      type: 'debit',
      description: note || `Transfer to ${name}`,
      category: 'transfer',
      fee: 0,
      ...(extra?.bank ? { recipientName: name } : {}),
    });
    const q = new URLSearchParams({
      amount: String(value),
      recipient: name,
      reference: tx.reference || tx.id,
      type: transferType === 'bank' ? 'bank' : 'badepay',
      date: tx.date,
      fee: '0',
      ...(note ? { note } : {}),
      ...(extra?.bank ? { bank: extra.bank } : {}),
    });
    navigate(`/transaction/success?${q.toString()}`);
  };

  const goToFailed = (value: number, name: string, reason: string) => {
    const q = new URLSearchParams({
      amount: String(value),
      recipient: name,
      reason,
      retry: '/transfer',
    });
    navigate(`/transaction/failed?${q.toString()}`);
  };

  const handleConfirm = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      goToFailed(0, recipient || accountName || 'Unknown', 'unknown');
      return;
    }
    if (value > balance) {
      goToFailed(value, recipient || accountName, 'insufficient_balance');
      return;
    }

    if (transferType === 'badepay') {
      if (!recipient.trim()) {
        goToFailed(value, '', 'invalid_recipient');
        return;
      }
    } else {
      if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
        goToFailed(value, accountName || 'Unknown', 'invalid_recipient');
        return;
      }
      if (accountNumber.replace(/\D/g, '').length < 10) {
        goToFailed(value, accountName, 'invalid_recipient');
        return;
      }
    }

    setShowPinModal(true);
  };

  const submit = async () => {
    const value = parseFloat(amount);
    if (transferType === 'badepay') {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 900));
      const ok = sendMoney(recipient.trim(), value, note || undefined);
      setLoading(false);
      if (ok) {
        // useWalletStore.sendMoney already adds the transaction to the store
        const q = new URLSearchParams({
          amount: String(value),
          recipient: recipient.trim(),
          type: 'badepay',
          date: new Date().toISOString(),
          fee: '0',
          ...(note ? { note } : {}),
        });
        navigate(`/transaction/success?${q.toString()}`);
      } else {
        goToFailed(value, recipient.trim(), 'network_error');
      }
    } else {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      const ok = transferToBank(bankName.trim(), accountNumber.trim(), accountName.trim(), value);
      setLoading(false);
      if (ok) {
        // useWalletStore.transferToBank already adds the transaction to the store
        const q = new URLSearchParams({
          amount: String(value),
          recipient: accountName.trim(),
          type: 'bank',
          date: new Date().toISOString(),
          fee: '0',
          ...(note ? { note } : {}),
          bank: bankName.trim(),
        });
        navigate(`/transaction/success?${q.toString()}`);
      } else {
        goToFailed(value, accountName.trim(), 'network_error');
      }
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
        <h1 className="text-3xl font-black text-[var(--text-primary)]">Transfer</h1>
        <p className="mt-2 text-sm font-bold text-[var(--text-secondary)]">Send money to anyone</p>
      </div>

      <div className="rounded-2xl border-2 border-[#6fe8d6]/20 bg-gradient-to-br from-[#6fe8d6]/10 to-[#6fe8d6]/5 p-6">
        <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Available balance</p>
        <p className="mt-2 text-3xl font-black text-[var(--text-primary)]">{formatNGN(balance)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setTransferType('badepay')}
          className="flex items-center justify-center gap-3 rounded-2xl border-2 p-4 transition-all duration-300"
          style={{
            background: transferType === 'badepay' ? 'var(--accent-bg)' : 'var(--card)',
            borderColor: transferType === 'badepay' ? 'var(--accent-text)' : 'var(--border)',
            boxShadow: transferType === 'badepay' ? 'var(--shadow-glow)' : 'none',
          }}
        >
          <User size={24} style={{ color: transferType === 'badepay' ? 'var(--accent-text)' : 'var(--text-secondary)' }} />
          <span className="text-base font-black text-[var(--text-primary)]">BadePay</span>
        </button>
        <button
          type="button"
          onClick={() => setTransferType('bank')}
          className="flex items-center justify-center gap-3 rounded-2xl border-2 p-4 transition-all duration-300"
          style={{
            background: transferType === 'bank' ? 'var(--accent-bg)' : 'var(--card)',
            borderColor: transferType === 'bank' ? 'var(--accent-text)' : 'var(--border)',
            boxShadow: transferType === 'bank' ? 'var(--shadow-glow)' : 'none',
          }}
        >
          <Building2 size={24} style={{ color: transferType === 'bank' ? 'var(--accent-text)' : 'var(--text-secondary)' }} />
          <span className="text-base font-black text-[var(--text-primary)]">Bank</span>
        </button>
      </div>

      {transferType === 'badepay' ? (
        <div className="space-y-5">
          <div>
            <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Recipient (username or name)</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter recipient's username or name"
              className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-base font-medium text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200"
            />
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
          <div>
            <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this for?"
              className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-base font-medium text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Bank name</label>
            <div className="relative">
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full appearance-none rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-base font-medium text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200 cursor-pointer"
              >
                <option value="">Select a bank</option>
                {NIGERIAN_BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]" />
            </div>
          </div>
          <div>
            <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Account number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="10-digit account number"
              className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-base font-medium text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200"
            />
          </div>
          <div>
            <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Account name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Recipient's account name"
              className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-base font-medium text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200"
            />
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
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        className="w-full rounded-2xl bg-[#6fe8d6] py-4 text-base font-black text-[#1a1a1a] shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[var(--shadow-glow-strong)] disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? 'Processing…' : transferType === 'badepay' ? 'Send now' : 'Transfer now'}
      </button>

      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={submit}
      />
    </div>
  );
}
