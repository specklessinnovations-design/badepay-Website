

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Briefcase,
  Store,
  Users,
  Landmark,
  Banknote,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRequireMerchant } from '@/hooks/useAuthProtection';
import {
  MERCHANT_BUSINESS_TYPES,
  MERCHANT_CATEGORIES,
  buildTradingSlug,
  type MerchantBusinessType,
  type PayoutPreference,
} from '@/types/merchant';
import { formatAccountForDisplay } from '@/lib/authRouting';
import { bpToast } from '@/lib/bpToast';

const STEPS = ['Business', 'Details', 'Category', 'Payout', 'QR'];

const BUSINESS_ICONS = {
  freelancer: Briefcase,
  informal: Store,
  small: Users,
  registered: Building2,
  ngo: Landmark,
} as const;

export default function MerchantOnboardingPage() {
  const [, navigate] = useLocation();
  const { user, completeMerchantOnboarding, isLoading } = useAuthStore();
  useRequireMerchant();

  const [step, setStep] = useState(0);
  const [type, setType] = useState<MerchantBusinessType | ''>('');
  const [businessName, setBusinessName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [supportPhone, setSupportPhone] = useState(user?.phone ?? '');
  const [category, setCategory] = useState('');
  const [payout, setPayout] = useState<PayoutPreference>('instant');

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const isStepValid = () => {
    if (step === 0) return !!type;
    if (step === 1) return !!businessName.trim() && !!businessAddress.trim() && !!supportPhone.trim();
    if (step === 2) return !!category;
    return true;
  };

  const handleComplete = async () => {
    if (!user || !type) return;
    try {
      await completeMerchantOnboarding({
        businessType: type,
        businessName: businessName.trim(),
        tradingName: tradingName.trim() || businessName.trim(),
        address: businessAddress.trim(),
        rcNumber: rcNumber.trim() || 'N/A',
        taxId: taxId.trim() || 'N/A',
        supportPhone: supportPhone.trim(),
        category,
        payoutPreference: payout,
      });
      bpToast.success('Merchant account ready!');
      navigate('/merchant');
    } catch {
      bpToast.error('Could not complete onboarding');
    }
  };

  const tradingSlug = buildTradingSlug(tradingName, businessName);
  const accountDisplay = formatAccountForDisplay(user?.accountNumber);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col">
      <div className="flex items-center justify-between px-1 pt-2">
        <button
          type="button"
          onClick={() => (step === 0 ? history.back() : back())}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
          Step {step + 1} of {STEPS.length}
        </div>
        <div className="w-9" />
      </div>

      <div className="mt-4 flex gap-1.5 px-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-[#6fe8d6]' : 'bg-[var(--border)]'}`}
          />
        ))}
      </div>

      <div className="mt-6 flex-1 px-1">
        {step === 0 && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              What kind of business
              <br />
              are you running?
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              We tailor your account, limits and settlement schedule based on your business profile.
            </p>
            <div className="mt-6 space-y-2">
              {MERCHANT_BUSINESS_TYPES.map((b) => {
                const Icon = BUSINESS_ICONS[b.id];
                const active = type === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setType(b.id)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                      active
                        ? 'border-[#6fe8d6]/40 bg-[#6fe8d6]/10'
                        : 'border-[var(--border)] bg-[var(--card)]'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        active ? 'bg-[#6fe8d6] text-[#1a1a1a]' : 'bg-[var(--surface-secondary)]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{b.label}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{b.desc}</div>
                    </div>
                    {active && <Check className="h-4 w-4" style={{ color: 'var(--accent-text)' }} />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Business details</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              This appears on receipts and payment confirmations.
            </p>
            <div className="mt-6 space-y-3">
              <Field label="Business name" placeholder="Adaeze Boutique Ltd" value={businessName} onChange={setBusinessName} />
              <Field label="Trading name (optional)" placeholder="Adaeze Boutique" value={tradingName} onChange={setTradingName} />
              <Field label="Business address" placeholder="12 Awolowo Road, Ikoyi, Lagos" value={businessAddress} onChange={setBusinessAddress} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="RC / BN number" placeholder="RC 1234567" value={rcNumber} onChange={setRcNumber} />
                <Field label="Tax ID (TIN)" placeholder="Optional" value={taxId} onChange={setTaxId} />
              </div>
              <Field label="Support phone" placeholder="+234 802 000 0000" value={supportPhone} onChange={setSupportPhone} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Pick a category</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              We use this to detect anomalies and route disputes correctly.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {MERCHANT_CATEGORIES.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`h-10 rounded-full px-4 text-sm font-medium ${
                      active
                        ? 'bg-[#6fe8d6] text-[#1a1a1a]'
                        : 'border border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)]'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" style={{ color: 'var(--accent-text)' }} />
                <div className="text-xs font-medium text-[var(--text-primary)]">Daily transaction limit</div>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Based on your tier and category, your limit will be ₦5,000,000/day. Upgrade verification any time.
              </p>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Payout preference</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Choose how often we settle your collections to your bank account.
            </p>
            <div className="mt-6 space-y-2.5">
              {[
                { id: 'instant' as const, title: 'Instant settlement', desc: 'Funds available in your wallet immediately. 0.5% fee.', chip: 'T+0' },
                { id: 'daily' as const, title: 'Daily settlement', desc: 'Auto payout at 6:00 PM to your bank. No fee.', chip: 'Free' },
              ].map((o) => {
                const active = payout === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setPayout(o.id)}
                    className={`w-full cursor-pointer rounded-2xl border p-4 text-left ${
                      active ? 'border-[#6fe8d6]/40 bg-[#6fe8d6]/10' : 'border-[var(--border)] bg-[var(--card)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          active ? 'bg-[#6fe8d6] text-[#1a1a1a]' : 'bg-[var(--surface-secondary)]'
                        }`}
                      >
                        <Banknote className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-[var(--text-primary)]">{o.title}</div>
                          <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>{o.chip}</span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-secondary)]">{o.desc}</div>
                      </div>
                      {active && <Check className="mt-1 h-4 w-4" style={{ color: 'var(--accent-text)' }} />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Payout account</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-secondary)]">
                  <Landmark className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--text-primary)]">BadePay · {accountDisplay}</div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {user?.firstName} {user?.lastName}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Your QR is ready</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Print it, share it digitally, or display in store. Customers scan to pay instantly.
            </p>
            <div className="mt-6 flex flex-col items-center rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface-secondary)] to-[var(--surface-tertiary)] p-6">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Scan to pay</div>
              <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{businessName}</div>
              <div className="mt-5 h-48 w-48 rounded-2xl bg-white p-3">
                <QrPattern />
              </div>
              <div className="mt-4 font-mono text-[11px] tracking-wider text-[var(--text-tertiary)]">
                badepay.ng/m/{tradingSlug}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-0 bg-[var(--background)]/80 py-5 backdrop-blur-md">
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            disabled={!isStepValid()}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#6fe8d6] text-sm font-semibold text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            disabled={isLoading}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#6fe8d6] text-sm font-semibold text-[#1a1a1a] disabled:opacity-50"
          >
            {isLoading ? 'Setting up…' : 'Go to merchant dashboard'}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{label}</div>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
      />
    </div>
  );
}

function QrPattern() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
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
