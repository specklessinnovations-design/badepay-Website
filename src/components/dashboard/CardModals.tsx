

import React, { useState } from 'react';
import { PremiumModal } from '@/components/ui/premium-modal';
import type { VirtualCard, CardChannels } from '@/store/useCardStore';
import { formatNGN } from '@/utils/formatting';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

export type CardModalType = 'details' | 'fund' | 'spending' | 'pin' | null;

interface CardModalsProps {
  card: VirtualCard | null;
  type: CardModalType;
  onClose: () => void;
  onFund: (amount: number) => void;
  onSetLimit: (limit: number) => void;
  onSetPin: (pin: string) => void;
  onUpdateChannels: (channels: Partial<CardChannels>) => void;
}

export function CardModals({
  card,
  type,
  onClose,
  onFund,
  onSetLimit,
  onSetPin,
  onUpdateChannels,
}: CardModalsProps) {
  if (!card || !type) return null;

  if (type === 'details') return <DetailsModal card={card} onClose={onClose} />;
  if (type === 'fund') return <FundModal card={card} onClose={onClose} onFund={onFund} />;
  if (type === 'spending') {
    return (
      <SpendingModal
        card={card}
        onClose={onClose}
        onSetLimit={onSetLimit}
        onUpdateChannels={onUpdateChannels}
      />
    );
  }
  return <PinModal card={card} onClose={onClose} onSetPin={onSetPin} />;
}

function DetailsModal({ card, onClose }: { card: VirtualCard; onClose: () => void }) {
  const biometricEnabled = useAuthStore((s) => s.user?.biometricEnabled);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!biometricEnabled) {
      toast.error('Enable biometric in Profile → Security first');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setVerified(true);
    toast.success('Identity verified');
  };

  const formatPan = (pan: string) =>
    pan.replace(/(\d{4})(?=\d)/g, '$1 ').trim();

  return (
    <PremiumModal isOpen title="Card details" onClose={onClose} size="sm">
      {!verified ? (
        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Biometric verification is required to view your full card details.
          </p>
          <button
            type="button"
            onClick={verify}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-[#6fe8d6] py-3 text-sm font-semibold text-[#1a1a1a] disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify with biometrics'}
          </button>
        </div>
      ) : (
        <div className="space-y-3 font-mono text-sm">
          <DetailRow label="PAN" value={formatPan(card.pan)} />
          <DetailRow label="CVV" value={card.cvv} />
          <DetailRow label="Expiry" value={`${card.expiryMonth}/${card.expiryYear}`} />
          <DetailRow label="Status" value={card.status} />
        </div>
      )}
    </PremiumModal>
  );
}

function FundModal({
  card,
  onClose,
  onFund,
}: {
  card: VirtualCard;
  onClose: () => void;
  onFund: (amount: number) => void;
}) {
  const walletBalance = useAuthStore((s) => s.user?.balance ?? 0);
  const [amount, setAmount] = useState('');
  const quick = card.currency === 'NGN' ? [1000, 5000, 10000, 25000] : [10, 25, 50, 100];

  const submit = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (value > walletBalance) {
      toast.error('Insufficient wallet balance');
      return;
    }
    onFund(value);
    onClose();
  };

  return (
    <PremiumModal isOpen title="Fund card" onClose={onClose} size="sm">
      <p className="mb-3 text-sm text-[var(--text-secondary)]">
        Wallet balance: {card.currency === 'NGN' ? formatNGN(walletBalance) : `$${walletBalance.toFixed(2)}`}
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {quick.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => setAmount(String(amt))}
            className={`rounded-full px-3 py-1 text-sm ${
              amount === String(amt)
                ? 'bg-[#6fe8d6] font-medium text-[#1a1a1a]'
                : 'border border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            {card.currency === 'NGN' ? formatNGN(amt) : `$${amt}`}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none"
      />
      <button
        type="button"
        onClick={submit}
        className="mt-4 w-full rounded-xl bg-[#6fe8d6] py-3 text-sm font-semibold text-[#1a1a1a]"
      >
        Fund card
      </button>
    </PremiumModal>
  );
}

function SpendingModal({
  card,
  onClose,
  onSetLimit,
  onUpdateChannels,
}: {
  card: VirtualCard;
  onClose: () => void;
  onSetLimit: (limit: number) => void;
  onUpdateChannels: (channels: Partial<CardChannels>) => void;
}) {
  const [limit, setLimit] = useState(String(card.spendingLimit));
  const [channels, setChannels] = useState(card.channels);

  const save = () => {
    const value = parseFloat(limit);
    if (!value || value <= 0) {
      toast.error('Enter a valid limit');
      return;
    }
    onSetLimit(value);
    onUpdateChannels(channels);
    toast.success('Spending controls updated');
    onClose();
  };

  const toggleChannel = (key: keyof CardChannels) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <PremiumModal isOpen title="Spending controls" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-[var(--text-secondary)]">Monthly limit ({card.currency})</label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none"
          />
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Used this month: {card.currency === 'NGN' ? formatNGN(card.spendingUsed) : `$${card.spendingUsed}`}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">Allowed channels</p>
          {(['online', 'atm', 'pos'] as const).map((key) => (
            <label key={key} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
              <span className="capitalize text-sm text-[var(--text-secondary)]">{key}</span>
              <input
                type="checkbox"
                checked={channels[key]}
                onChange={() => toggleChannel(key)}
                className="h-4 w-4 accent-[#6fe8d6]"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={save}
          className="w-full rounded-xl bg-[#6fe8d6] py-3 text-sm font-semibold text-[#1a1a1a]"
        >
          Save controls
        </button>
      </div>
    </PremiumModal>
  );
}

function PinModal({
  card,
  onClose,
  onSetPin,
}: {
  card: VirtualCard;
  onClose: () => void;
  onSetPin: (pin: string) => void;
}) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');

  const save = () => {
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      toast.error('PIN must be 4 digits');
      return;
    }
    if (pin !== confirm) {
      toast.error('PINs do not match');
      return;
    }
    onSetPin(pin);
    toast.success('Card PIN updated');
    onClose();
  };

  return (
    <PremiumModal isOpen title="Reset card PIN" onClose={onClose} size="sm">
      <p className="mb-3 text-sm text-[var(--text-secondary)]">Set a 4-digit ATM PIN for •••• {card.last4}</p>
      <div className="space-y-3">
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="New PIN"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-center text-lg tracking-widest text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none"
        />
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="Confirm PIN"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-center text-lg tracking-widest text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={save}
        className="mt-4 w-full rounded-xl bg-[#6fe8d6] py-3 text-sm font-semibold text-[#1a1a1a]"
      >
        Save PIN
      </button>
    </PremiumModal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3">
      <span className="text-[var(--text-tertiary)]">{label}</span>
      <span className="font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
