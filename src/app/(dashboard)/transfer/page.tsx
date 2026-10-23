import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatNGN } from '@/utils/formatting';
import { ArrowLeft, ChevronDown, Check, Star, AlertCircle, X } from 'lucide-react';
import { TransactionPinModal } from '@/components/auth/TransactionPinModal';
import transferService, { type Bank } from '@/services/transferService';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';

type TransferType = 'badepay' | 'bank';

/** A saved recipient (GET /beneficiaries), same list as the mobile app. */
interface Beneficiary {
  id: string; type: 'badepay' | 'bank'; accountNumber: string; bankCode: string; bankName: string;
  accountName: string; nickname?: string | null;
}

/** Pseudo bank code the backend treats as an internal BadePay account. */
const BADEPAY = 'badepay';

export default function TransferPage() {
  const [, navigate] = useLocation();
  const balance = useAuthStore((s) => s.user?.balance ?? 0);
  const user = useAuthStore((s) => s.user);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const [transferType, setTransferType] = useState<TransferType>('badepay');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [fee, setFee] = useState(0);
  const [bankCode, setBankCode] = useState(BADEPAY);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('5000');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [resolvingName, setResolvingName] = useState(false);
  const [resolvedName, setResolvedName] = useState('');
  const [error, setError] = useState('');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [saveBeneficiary, setSaveBeneficiary] = useState(true);

  useEffect(() => {
    apiClient.get('/transfers/banks').then((r) => {
      setBanks(r?.data?.banks ?? []);
      setFee(Number(r?.data?.transferFee) || 0);
    }).catch(() => setBanks([]));
    apiClient.get('/beneficiaries').then((r) => setBeneficiaries(r?.data?.beneficiaries ?? [])).catch(() => setBeneficiaries([]));
  }, []);

  const bankName = bankCode === BADEPAY ? 'RCCGPay' : banks.find((b) => b.code === bankCode)?.name ?? '';
  const alreadySaved = beneficiaries.some((b) => b.accountNumber === accountNumber && b.bankCode === bankCode);
  const chargedFee = transferType === 'bank' ? fee : 0;

  const getCleanAmount = () => parseFloat(amount.replace(/,/g, '')) || 0;

  const handleQuickAdd = (val: number) => setAmount(String(val));

  const resolve = async (acct: string, code: string) => {
    setError(''); setResolvedName('');
    if (acct.length !== 10) return;
    if (!code) { setError('Choose a bank first.'); return; }
    if (code === BADEPAY && acct === user?.accountNumber) { setError('You cannot send money to yourself.'); return; }
    setResolvingName(true);
    try {
      const result = await transferService.resolveAccount(acct, code);
      if (result?.accountName) setResolvedName(result.accountName);
      else setError('Account not found. Please check the account details.');
    } catch {
      setError('Could not resolve account. Please check the number and try again.');
    } finally {
      setResolvingName(false);
    }
  };

  const handleAccountNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(clean);
    void resolve(clean, bankCode);
  };

  const switchType = (t: TransferType) => {
    setTransferType(t);
    const code = t === 'badepay' ? BADEPAY : '';
    setBankCode(code);
    setResolvedName(''); setError('');
    if (t === 'badepay') void resolve(accountNumber, code);
  };

  const handleSelectBeneficiary = (b: Beneficiary) => {
    setTransferType(b.type === 'badepay' ? 'badepay' : 'bank');
    setBankCode(b.type === 'badepay' ? BADEPAY : b.bankCode);
    setAccountNumber(b.accountNumber);
    setResolvedName(b.accountName);
    setError('');
  };

  const removeBeneficiary = async (b: Beneficiary) => {
    if (!window.confirm(`Remove ${b.nickname || b.accountName} from saved recipients?`)) return;
    try {
      await apiClient.delete(`/beneficiaries/${b.id}`);
      setBeneficiaries((list) => list.filter((x) => x.id !== b.id));
    } catch (e: any) {
      toast.error(e?.message || 'Could not remove it');
    }
  };

  const handleReview = () => {
    setError('');
    const value = getCleanAmount();
    if (value <= 0) { setError('Please enter a valid amount.'); return; }
    if (value + chargedFee > balance) { setError(chargedFee ? `Insufficient balance (includes the ${formatNGN(chargedFee)} fee).` : 'Insufficient balance.'); return; }
    if (accountNumber.length < 10) { setError('Enter a valid 10-digit account number.'); return; }
    if (!resolvedName) { setError('Recipient name could not be resolved. Check the account details.'); return; }
    setShowPinModal(true);
  };

  const submit = async (pin: string) => {
    const value = getCleanAmount();
    setLoading(true);
    try {
      const res: any = await transferService.initiateTransfer({
        type: transferType === 'badepay' ? 'p2p' : 'bank',
        amount: value,
        pin,
        recipientAccountNumber: transferType === 'badepay' ? accountNumber : undefined,
        accountNumber: transferType === 'bank' ? accountNumber : undefined,
        bankCode: transferType === 'bank' ? bankCode : undefined,
        bankName: transferType === 'bank' ? bankName : undefined,
        narration: note || `Transfer to ${resolvedName}`,
        saveBeneficiary: saveBeneficiary && !alreadySaved,
      });
      await fetchTransactions();
      if (res?.status === 'held') toast('For your security, this transfer is being reviewed. We will notify you when it is sent.', { duration: 6000 });
      else if (res?.status === 'pending' || res?.status === 'processing') toast.success('Transfer sent. It will show as complete once the bank confirms.');
      else toast.success('Transfer successful');
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
            onClick={() => switchType('badepay')}
            className={`h-8 rounded-lg text-[12px] font-semibold transition-all ${transferType === 'badepay' ? 'bg-[#6fe8d6] text-[#081a18]' : 'text-[var(--text-secondary)]'}`}
          >
            RCCGPay user
          </button>
          <button
            type="button"
            onClick={() => switchType('bank')}
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
              value={bankCode}
              onChange={(e) => { setBankCode(e.target.value); void resolve(accountNumber, e.target.value); }}
              className="w-full appearance-none rounded-2xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-6 py-4 text-base font-medium text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/20 transition-all duration-200 cursor-pointer"
            >
              <option value="" disabled>{banks.length ? 'Choose a bank' : 'Loading banks…'}</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>{bank.name}</option>
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

      {/* Saved recipients */}
      {beneficiaries.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-3 flex items-center gap-1.5">
            <Star size={12} className="text-[#6fe8d6]" /> Saved recipients
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {beneficiaries.map((b) => {
              const name = b.nickname || b.accountName;
              const selected = b.accountNumber === accountNumber && (b.type === 'badepay' ? bankCode === BADEPAY : bankCode === b.bankCode);
              return (
                <div key={b.id} className="group relative shrink-0 w-[72px]">
                  <button type="button" onClick={() => handleSelectBeneficiary(b)} title={`${b.accountName} · ${b.bankName} ${b.accountNumber}`}
                    className="flex w-full flex-col items-center gap-1.5">
                    <div className="h-11 w-11 rounded-full flex items-center justify-center font-semibold text-[12px] text-[var(--text-primary)]"
                      style={{ background: 'var(--surface-secondary)', boxShadow: selected ? '0 0 0 2px #6fe8d6' : undefined }}>
                      {name.split(' ').slice(0, 2).map((x) => x[0]).join('').toUpperCase()}
                    </div>
                    <div className="text-[10px] font-medium leading-tight text-center truncate w-full text-[var(--text-primary)]">{name.split(' ')[0]}</div>
                    <div className="text-[9px] text-[var(--text-tertiary)] truncate w-full text-center">{b.type === 'badepay' ? 'RCCGPay' : b.bankName}</div>
                  </button>
                  <button type="button" onClick={() => removeBeneficiary(b)} aria-label={`Remove ${name}`}
                    className="absolute right-1 top-0 hidden h-5 w-5 items-center justify-center rounded-full group-hover:flex focus:flex"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
                    <X size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {resolvedName && !alreadySaved && (
        <label className="flex items-center gap-2.5 text-sm text-[var(--text-primary)] cursor-pointer">
          <input type="checkbox" checked={saveBeneficiary} onChange={(e) => setSaveBeneficiary(e.target.checked)} className="h-4 w-4 accent-[#0b7367]" />
          Save {resolvedName.split(' ')[0]} as a recipient
        </label>
      )}

      {chargedFee > 0 && (
        <p className="text-[12px] text-[var(--text-secondary)]">
          Bank transfer fee: {formatNGN(chargedFee)} · total {formatNGN(getCleanAmount() + chargedFee)}
        </p>
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
