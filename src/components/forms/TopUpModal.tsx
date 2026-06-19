
// FRONTEND-ONLY MODE: TopUpModal uses mock deposit — no real Stripe payment.
import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/useWalletStore';
import { useToast } from '@/hooks/useToast';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (balance: number) => void;
}

const quickAmounts = ['1000', '2000', '5000', '10000', '20000', '50000'];
const MIN_TOPUP = 100;

export function TopUpModal({ isOpen, onClose, onSuccess }: TopUpModalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { deposit, getBalance } = useWalletStore();
  const balance = getBalance();
  const { showSuccess, showError } = useToast();

  const reset = () => {
    setAmount('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount < MIN_TOPUP) {
      showError(`Minimum top-up is ₦${MIN_TOPUP.toLocaleString()}`);
      return;
    }
    setIsLoading(true);
    // Simulate a brief loading delay for realism
    await new Promise((r) => setTimeout(r, 800));
    deposit(numAmount);
    const newBalance = balance + numAmount;
    showSuccess(`₦${numAmount.toLocaleString()} added to your wallet`);
    onSuccess?.(newBalance);
    reset();
    onClose();
    setIsLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Top Up Wallet">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Quick Amounts</label>
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  amount === amt
                    ? 'bg-[var(--color-primary)] text-[var(--color-accent)] shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ₦{parseInt(amt).toLocaleString()}
              </button>
            ))}
          </div>
        </div>
        <Input
          label="Custom Amount (₦)"
          type="number"
          min={MIN_TOPUP}
          placeholder={`Min ₦${MIN_TOPUP}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Minimum top-up: ₦{MIN_TOPUP.toLocaleString()} — <span className="text-amber-600 font-semibold">Frontend Design Mode: No real payment processed.</span>
        </p>
        <Button onClick={handleTopUp} fullWidth isLoading={isLoading} size="lg">
          Add ₦{amount ? parseInt(amount.replace(/,/g, '')).toLocaleString() : '0'} to Wallet
        </Button>
      </div>
    </Modal>
  );
}
