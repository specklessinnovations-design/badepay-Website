
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useWalletStore } from '@/store/useWalletStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatNGN } from '@/utils/formatting';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, Share2, Building2, CreditCard, QrCode, Check, ChevronRight, Sparkles, ShieldCheck, PhoneCall, ChevronDown } from 'lucide-react';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "*901*" },
  { name: "GTBank", code: "*737*2*" },
  { name: "Zenith Bank", code: "*966*" },
  { name: "UBA", code: "*919*" },
  { name: "Wema Bank", code: "*945*" },
  { name: "First Bank", code: "*894*" }
];

export default function AddMoneyPage() {
  const [, navigate] = useLocation();
  const deposit = useWalletStore((s) => s.deposit);
  const balance = useAuthStore((s) => s.user?.balance ?? 0);
  const user = useAuthStore((s) => s.user);
  const [amount, setAmount] = useState('5000');
  const [loading, setLoading] = useState(false);
  const [copiedNum, setCopiedNum] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  
  // Modal states
  const [modal, setModal] = useState<"card" | "ussd" | "qr" | null>(null);
  const [cardStep, setCardStep] = useState<"amount" | "loading" | "success">("amount");
  const [cardAmount, setCardAmount] = useState('5000');
  const [selectedBankIdx, setSelectedBankIdx] = useState(0);
  const [ussdAmount, setUssdAmount] = useState('5000');
  const [ussdCopied, setUssdCopied] = useState(false);

  const rawAccountNumber = user?.accountNumber || '';
  const accountName = user ? `${user.firstName} ${user.lastName}` : 'BadePay User';

  const formatAccountNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return num;
  };

  const handleCopyNum = () => {
    navigator.clipboard.writeText(rawAccountNumber);
    setCopiedNum(true);
    setTimeout(() => setCopiedNum(false), 2000);
  };

  const handleCopyAll = () => {
    const text = `Bank: BadePay\nAccount Number: ${formatAccountNumber(rawAccountNumber)}\nAccount Name: BadePay / ${accountName}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleShare = async () => {
    const text = `My BadePay account details:\nBank: BadePay\nAccount Number: ${formatAccountNumber(rawAccountNumber)}\nAccount Name: BadePay / ${accountName}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "BadePay Account Details",
          text: text,
        });
      } catch (err) {
        console.log("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Account details copied to clipboard!");
    }
  };

  const closeModal = () => {
    setModal(null);
    setCardStep("amount");
    setCardAmount("5000");
  };

  const handleCardFunding = async () => {
    const numAmt = parseFloat(cardAmount);
    if (isNaN(numAmt) || numAmt <= 0) return;
    setLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/paystack-callback`;
      const result = await deposit(numAmt);
      if (result.authorizationUrl) {
        try {
          sessionStorage.setItem("paystack_reference", result.reference || '');
        } catch { }
        window.location.href = result.authorizationUrl;
      } else {
        setCardStep("success");
        setTimeout(() => { closeModal(); }, 2000);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      closeModal();
      toast.error(err?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getUssdString = () => {
    const bank = NIGERIAN_BANKS[selectedBankIdx];
    const amountStr = ussdAmount || "0";
    if (bank.name === "GTBank") {
      return `*737*2*${amountStr}*${rawAccountNumber}#`;
    } else if (bank.name === "UBA") {
      return `*919*3*${rawAccountNumber}*${amountStr}#`;
    } else if (bank.name === "Access Bank") {
      return `*901*1*1*${amountStr}*${rawAccountNumber}#`;
    }
    return `${bank.code}${amountStr}*${rawAccountNumber}#`;
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

      {/* Bank Transfer Card */}
      <div className="rounded-3xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #081a18 0%, #0d2e2a 55%, #051210 100%)',
          border: '1px solid rgba(111,232,214,0.18)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(111,232,214,0.22) 0%,transparent 70%)' }} />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(111,232,214,0.55)]">Partner bank</div>
              <div className="text-[14px] font-semibold mt-0.5 text-white">BadePay</div>
            </div>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(111,232,214,0.15)' }}>
              <Building2 size={20} style={{ color: '#6fe8d6' }} />
            </div>
          </div>

          <div className="pt-5 border-t border-[rgba(111,232,214,0.2)]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(111,232,214,0.55)]">Account number</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-display text-[28px] font-semibold tracking-wide tabular text-white">{formatAccountNumber(rawAccountNumber) || '--- --- ----'}</span>
              <button
                onClick={handleCopyNum}
                className="h-9 w-9 rounded-xl flex items-center justify-center transition-all active:scale-[0.95]"
                style={{ background: 'rgba(111,232,214,0.1)', border: '1px solid rgba(111,232,214,0.2)' }}
                title="Copy account number"
              >
                {copiedNum ? <Check size={16} className="text-[#6fe8d6] animate-pulse" /> : <Copy size={16} className="text-[#6fe8d6]" />}
              </button>
            </div>
            <div className="mt-1 text-[12px] text-[rgba(111,232,214,0.55)]">{accountName} · BadePay</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyAll}
              className="h-11 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              style={{ background: '#6fe8d6', color: '#081a18' }}
            >
              {copiedAll ? (
                <>
                  <Check size={16} className="text-[#081a18] animate-pulse" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy details
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              className="h-11 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)' }}
            >
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Other Methods */}
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-2 px-1">Other methods</div>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {[
            { i: CreditCard, l: "Add via debit card", s: "Visa, Mastercard, Verve · 1.5% fee", k: "card" as const },
            { i: QrCode, l: "Receive payment via QR", s: "Show QR code · any banking app scanner", k: "qr" as const },
          ].map((m) => (
            <button
              key={m.l}
              onClick={() => {
                setModal(m.k);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--surface-secondary)]"
            >
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-secondary)' }}>
                <m.i size={16} className="text-[var(--text-secondary)]" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-[var(--text-primary)]">{m.l}</div>
                <div className="text-[11px] text-[var(--text-tertiary)]">{m.s}</div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
            </button>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="rounded-2xl p-4 flex gap-3" style={{ background: 'rgba(111,232,214,0.1)', border: '1px solid rgba(111,232,214,0.2)' }}>
        <Sparkles size={16} className="text-[#6fe8d6] shrink-0 mt-0.5" />
        <div>
          <div className="text-[12px] font-medium text-[var(--text-primary)]">Earn while you wait</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Idle balances above ₦50,000 automatically earn 10.5% APR in a Smart Vault.
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[10.5px] text-[var(--text-tertiary)]">
        <ShieldCheck size={14} className="text-[#6fe8d6] shrink-0 mt-0.5" />
        <span>Deposits are held in your name at a CBN-licensed partner bank. NDIC insured up to ₦5,000,000.</span>
      </div>

      {/* Card Funding Modal */}
      {modal === "card" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-[420px] rounded-t-3xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Add money via card</p>
              <button onClick={closeModal} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-secondary)' }}>
                <ChevronRight size={16} className="text-[var(--text-secondary)] rotate-180" />
              </button>
            </div>
            <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">
              {cardStep === "amount" && (
                <div className="flex flex-col gap-5">
                  <p className="text-[12.5px] text-[var(--text-secondary)]">Specify the amount you want to deposit into your wallet. You'll be redirected to our secure payment gateway.</p>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] block mb-2">Deposit Amount</label>
                    <div className="rounded-xl flex items-center px-4 gap-2 border border-[var(--border)]" style={{ background: 'var(--surface-secondary)' }}>
                      <span className="text-[15px] font-semibold text-[var(--text-secondary)]">₦</span>
                      <input
                        type="number"
                        value={cardAmount}
                        onChange={e => setCardAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="flex-1 bg-transparent py-3.5 text-[15px] font-semibold outline-none text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["1000", "5000", "10000", "20000"].map(preset => (
                      <button
                        key={preset}
                        onClick={() => setCardAmount(preset)}
                        className={`py-2 text-[12px] font-medium rounded-xl border transition-all ${cardAmount === preset ? "border-[#6fe8d6] bg-[rgba(111,232,214,0.1)] text-[#6fe8d6]" : "border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-primary)]"}`}
                      >
                        ₦{parseInt(preset).toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleCardFunding}
                    disabled={!cardAmount || parseFloat(cardAmount) <= 0}
                    className="w-full h-12 rounded-2xl py-4 text-[13.5px] font-semibold disabled:opacity-50"
                    style={{ background: '#6fe8d6', color: '#081a18' }}
                  >
                    Continue to Payment
                  </button>
                </div>
              )}

              {cardStep === "loading" && (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                  <div className="h-12 w-12 border-2 border-[#6fe8d6] border-t-transparent rounded-full animate-spin" />
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">Redirecting to payment gateway...</p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">Please do not refresh or close this modal.</p>
                  </div>
                </div>
              )}

              {cardStep === "success" && (
                <div className="flex flex-col items-center justify-center text-center py-6 gap-4">
                  <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.1)' }}>
                    <Check size={32} className="text-[#34d399]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#34d399]">Payment successful!</p>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-1">₦{parseFloat(cardAmount).toLocaleString()} added to your balance.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {modal === "qr" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-[420px] rounded-t-3xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Receive payment via QR</p>
              <button onClick={closeModal} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-secondary)' }}>
                <ChevronRight size={16} className="text-[var(--text-secondary)] rotate-180" />
              </button>
            </div>
            <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col items-center justify-center text-center gap-5 py-4">
                <p className="text-[12.5px] text-[var(--text-secondary)] px-4">Show this QR code to the sender. Any banking app scanner can scan to pay you.</p>
                <div className="relative h-[220px] w-[220px] rounded-3xl bg-white border-8 border-white shadow-xl flex items-center justify-center overflow-hidden">
                  <div className="text-[10px] text-[#1a1a1a]">QR Code Feature Coming Soon</div>
                </div>
                <div className="text-center">
                  <span className="font-display text-[15px] font-bold text-[var(--text-primary)]">{accountName}</span>
                  <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5">BadePay · {formatAccountNumber(rawAccountNumber)}</p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                  <button onClick={closeModal} className="flex-1 h-12 rounded-2xl text-[13.5px] font-medium" style={{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

