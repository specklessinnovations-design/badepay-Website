

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/useWalletStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatCurrency';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, Building } from 'lucide-react';

export function WithdrawModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [bankId, setBankId] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { getBalance, linkedBanks, withdraw } = useWalletStore();
  const balance = getBalance();
  const { verifyPin } = useAuthStore();
  const { showSuccess, showError } = useToast();

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    
    if (isNaN(numAmount) || numAmount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (numAmount > balance) {
      showError('Insufficient funds for this withdrawal');
      return;
    }

    if (!bankId && linkedBanks.length > 0) {
      showError('Please select a destination bank');
      return;
    }

    if (!verifyPin(pin)) {
      showError('Incorrect PIN. Please try again.');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);

    const result = await withdraw(numAmount, bankId, pin);
    if (result.success) {
      showSuccess(`Successfully withdrew ₦${numAmount.toLocaleString()}`);
      setAmount('');
      setPin('');
      onClose();
    } else {
      showError(result.error || 'Withdrawal failed. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Funds">
      <div className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Amount (₦)</label>
            <span className="text-xs font-bold text-[var(--color-primary)]">
              Available: {formatCurrency(balance)}
            </span>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination Bank</label>
          {linkedBanks.length === 0 ? (
            <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
              Please add a bank account first.
            </div>
          ) : (
            <Select.Root value={bankId} onValueChange={setBankId}>
              <Select.Trigger className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow">
                <Select.Value placeholder="Select a bank account" />
                <Select.Icon>
                  <ChevronDown size={16} className="text-gray-500" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-[60]">
                  <Select.Viewport className="p-1">
                    {linkedBanks.map((bank) => (
                      <Select.Item 
                        key={bank.id} 
                        value={bank.id}
                        className="relative flex items-center px-8 py-3 text-sm font-medium text-gray-800 hover:bg-blue-50 outline-none cursor-pointer rounded-md transition-colors"
                      >
                        <Select.ItemText>
                          <div className="flex items-center gap-2">
                            <Building size={14} className="text-[var(--color-primary)]" />
                            {bank.bankName} - {bank.accountNumber}
                          </div>
                        </Select.ItemText>
                        <Select.ItemIndicator className="absolute left-2 flex items-center justify-center text-[var(--color-primary)]">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction PIN</label>
          <Input
            type="password"
            placeholder="••••"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1 font-medium">Enter your 4-digit security PIN (default is 1234)</p>
        </div>

        <Button 
          onClick={handleWithdraw} 
          fullWidth 
          isLoading={isLoading} 
          size="lg" 
          className="mt-2"
          disabled={linkedBanks.length === 0}
        >
          Confirm Withdrawal
        </Button>
      </div>
    </Modal>
  );
}
