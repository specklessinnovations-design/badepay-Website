

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatNGN } from '@/utils/formatting';
import { ArrowLeft, User, Building2, ChevronDown, Check, Star, Search, AlertCircle } from 'lucide-react';
import { NIGERIAN_BANKS } from '@/data/providers';
import { TransactionPinModal } from '@/components/auth/TransactionPinModal';
import transferService from '@/services/transferService';
import toast from 'react-hot-toast';

const bankNameToCode: Record<string, string> = {
  "BadePay": "badepay",
  "Access Bank": "044",
  "GTBank": "058",
  "Zenith Bank": "057",
  "UBA": "033",
  "Wema Bank": "035",
  "First Bank": "011",
};

type TransferType = 'badepay' | 'bank';

export default function TransferPage() {
  const [, navigate] = useLocation();
  const balance = useAuthStore((s) => s.user?.balance ?? 0);
  const user = useAuthStore((s) => s.user);
  const transactions = useTransactionStore((s) => s.transactions);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const [transferType, setTransferType] = useState<TransferType>('badepay');
  const [recipient, setRecipient] = useState('');
  const [bankName, setBankName] = useState('BadePay');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('5000');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [resolvingName, setResolvingName] = useState(false);
  const [resolvedName, setResolvedName] = useState('');
  const [error, setError] = useState('');
  const [beneficiaries, setBeneficiaries] = useState<Array<{ n: string; bn: string; b: string; a: string }>>([]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const loadBeneficiaries = async () => {
      const seen = new Set<string>();
      const beneficiaryMap: Record<string, { n: string; bn: string; b: string; a: string }> = {};

      transactions.forEach((tx: any) => {
        const isRecipient = tx.recipientName && tx.recipientId !== user?.id;
        const isSender = tx.senderName && tx.senderId !== user?.id;

        if (isRecipient && tx.recipientName) {
          const key = `${tx.recipientName}-badepay`;
          if (!seen.has(key)) {
            beneficiaryMap[key] = {
              n: tx.recipientName,
              bn: "BadePay",
              b: "badepay",
              a: tx.recipientAccountNumber || tx.accountNumber || '',
            };
            seen.add(key);
          }
        }
        if (isSender && tx.senderName) {
          const key = `${tx.senderName}-${tx.bankCode || 'badepay'}`;
          if (!seen.has(key)) {
            beneficiaryMap[key] = {
              n: tx.senderName,
              bn: tx.bankName || "Bank Transfer",
              b: tx.bankCode || "badepay",
              a: tx.accountNumber || '',
            };
            seen.add(key);
          }
        }
      });

      setBeneficiaries(Object.values(beneficiaryMap).slice(0, 5));
    };

    loadBeneficiaries();
  }, [transactions, user?.id]);

  const getCleanAmount = () => {
    const clean = amount.replace(/,/g, "");
    return parseFloat(clean) || 0;
  };

  const handleQuickAdd = (val: number) => {
    const current = getCleanAmount();
    setAmount(String(current + val));
  };

  const handleAccountNumberChange = async (val: string) => {
    const cleanVal = val.replace(/\D/g, "").slice(0, 10);
    setAccountNumber(cleanVal);
    setError('');
    setResolvedName('');
    setAccountName('');
    if (cleanVal.length === 10) {
      setResolvingName(true);
      try {
        const bankCode = transferType === 'badepay' ? 'badepay' : (bankNameToCode[bankName] || bankName);

        if (transferType === 'badepay' && cleanVal === user?.accountNumber) {
          setError('You cannot send money to yourself.');
          setResolvingName(false);
          return;
        }

        const result = await transferService.resolveAccount(cleanVal, bankCode);
        const name = result?.accountName || '';
        if (name) {
          setResolvedName(name);
          setAccountName(name);
        } else {
          setError('Account not found. Please check the account details.');
        }
      } catch {
        setError('Could not resolve account. Please check the number and try again.');
      } finally {
        setResolvingName(false);
      }
    }
  };

  const handleSelectBeneficiary = (b: typeof beneficiaries[0]) => {
    setAccountNumber(b.a);
    setBankName(b.b);
    setRecipient(b.n);
    setResolvedName(b.n);
    setAccountName(b.n);
    setTransferType(b.b === "BadePay" ? 'badepay' : 'bank');
    setError('');
  };

  const handleReview = () => {
    setError('');
    const value = getCleanAmount();
    if (value <= 0) { setError("Please enter a valid amount."); return; }
    if (value > balance) { setError("Insufficient balance."); return; }
    if (accountNumber.length < 10) { setError("Enter a valid 10-digit account number."); return; }
    if (!resolvedName) { setError("Recipient name could not be resolved. Check the account details."); return; }

    setShowPinModal(true);
  };

  const submit = async (pin: string) => {
    const value = getCleanAmount();
    setLoading(true);
    try {
      const bankCode = transferType === 'badepay' ? 'badepay' : (bankNameToCode[bankName] || bankName);
      const result = await transferService.initiateTransfer({
        type: transferType === 'badepay' ? 'p2p' : 'bank',
        amount: value,
        pin,
        recipientAccountNumber: transferType === 'badepay' ? accountNumber : undefined,
        accountNumber: transferType === 'bank' ? accountNumber : undefined,
        bankCode: transferType === 'bank' ? bankCode : undefined,
        narration: note || `Transfer to ${resolvedName}`,
      });
      
      await fetchTransactions();
      toast.success('Transfer successful');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
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

      {/* Recipient type toggle */}
        <div className="p-1 rounded-xl grid grid-cols-2 gap-1" style={{ background: 'var(--surface-secondary)' }}>
          <button
            type="button"
            onClick={() => { setTransferType('badepay'); setBankName('BadePay'); setError(''); setResolvedName(''); setAccountName(''); }}
            className={`h-8 rounded-lg text-[12px] font-semibold transition-all ${transferType === 'badepay' ? 'bg-[#6fe8d6] text-[#081a18]' : 'text-[var(--text-secondary)]'}`}
          >
            BadePay user
          </button>
          <button
            type="button"
            onClick={() => { setTransferType('bank'); setBankName(NIGERIAN_BANKS[0]); setError(''); setResolvedName(''); setAccountName(''); }}
            className={`h-8 rounded-lg text-[12px] font-semibold transition-all ${transferType === 'bank' ? 'bg-[#6fe8d6] text-[#081a18]' : 'text-[var(--text-secondary)]'}`}
          >
            Nigerian bank
          </button>
        </div>

      {/* Bank selector */}
      {transferType === 'bank' && (
        <div>
          <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Bank</label>
          <div className="relative">
            <select
              value={bankName}
              onChange={(e) => { setBankName(e.target.value); setResolvedName(''); setAccountName(''); }}
              className="w-full appearance-none rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-base font-medium text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200 cursor-pointer"
            >
              {NIGERIAN_BANKS.map((bank) => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
            <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]" />
          </div>
        </div>
      )}

      {/* Account number */}
      <div>
        <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Account number</label>
        <div className="relative">
          <input
            type="text"
            maxLength={10}
            inputMode="numeric"
            placeholder="Enter 10-digit account number"
            value={accountNumber}
            onChange={(e) => handleAccountNumberChange(e.target.value)}
            className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-base font-medium text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200"
          />
          {resolvingName && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <div className="h-3.5 w-3.5 border-2 border-[#6fe8d6] border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-[var(--text-secondary)]">Verifying…</span>
            </div>
          )}
        </div>
        {resolvedName && (
          <div className="mt-1.5 px-1 text-[12px] text-[#6fe8d6] font-semibold flex items-center gap-1.5">
            <Check size={14} /> {resolvedName}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex gap-2.5">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Quick amount chips */}
      <div>
        <label className="mb-3 block text-sm font-bold text-[var(--text-primary)]">Quick amount</label>
        <div className="flex gap-2 flex-wrap">
          {[1000, 5000, 10000, 50000].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleQuickAdd(q)}
              className={`h-8 px-3 rounded-full text-[11.5px] font-medium transition-all ${
                amount === String(q) ? 'bg-[#6fe8d6] text-[#081a1a]' : 'border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-primary)]'
              }`}
            >
              ₦{q.toLocaleString()}
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

      {/* Recent beneficiaries */}
      {beneficiaries.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-3 flex items-center gap-1.5">
            <Star size={12} className="text-[#6fe8d6]" /> Recent beneficiaries
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {beneficiaries.map((b) => (
              <button
                key={b.a}
                type="button"
                onClick={() => handleSelectBeneficiary(b)}
                className="shrink-0 w-16 flex flex-col items-center gap-1.5 transition-transform hover:scale-105"
              >
                <div className="h-11 w-11 rounded-full flex items-center justify-center font-semibold text-[12px]" style={{ background: 'var(--surface-secondary)' }}>
                  {b.n.split(" ").map((x) => x[0]).join("")}
                </div>
                <div className="text-[10px] font-medium leading-tight text-center truncate w-full text-[var(--text-primary)]">{b.n.split(" ")[0]}</div>
                <div className="text-[9px] text-[var(--text-tertiary)] truncate w-full text-center">{b.bn}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleReview}
        disabled={loading}
        className="w-full rounded-2xl bg-[#6fe8d6] py-4 text-base font-black text-[#1a1a1a] shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[var(--shadow-glow-strong)] disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? 'Processing…' : 'Review transfer'}
      </button>

      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={submit}
      />
    </div>
  );
}
