

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/useWalletStore';
import { useToast } from '@/hooks/useToast';

export function AddBankModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const { addBankAccount } = useWalletStore();
  const { showSuccess, showError } = useToast();

  const handleVerify = async () => {
    if (accountNumber.length !== 10) {
      showError('Account number must be 10 digits');
      return;
    }
    if (!bankName) {
      showError('Please enter a bank name');
      return;
    }

    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsVerifying(false);
    
    // Mock successful lookup
    setAccountName('ADETOLA ADEBAYO');
    showSuccess('Account verified');
  };

  const handleAdd = async () => {
    if (!accountName) {
      showError('Please verify the account first');
      return;
    }

    setIsAdding(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsAdding(false);

    addBankAccount(bankName, accountNumber, accountName);
    showSuccess('Bank account linked successfully');
    
    // Reset states
    setBankName('');
    setAccountNumber('');
    setAccountName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Link Bank Account">
      <div className="space-y-5">
        <Input
          label="Bank Name"
          placeholder="e.g. GTBank"
          value={bankName}
          onChange={(e) => {
            setBankName(e.target.value);
            setAccountName('');
          }}
        />

        <div className="relative">
          <Input
            label="Account Number"
            placeholder="0123456789"
            maxLength={10}
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value.replace(/[^0-9]/g, ''));
              setAccountName('');
            }}
          />
          {accountNumber.length === 10 && !accountName && (
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={handleVerify} isLoading={isVerifying}>
                Verify Account
              </Button>
            </div>
          )}
        </div>

        {accountName && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl mt-2 animate-in fade-in slide-in-from-top-1">
            <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-1">Verified Name</p>
            <p className="font-bold text-gray-900 text-lg">{accountName}</p>
          </div>
        )}

        <Button 
          onClick={handleAdd} 
          fullWidth 
          isLoading={isAdding} 
          size="lg" 
          disabled={!accountName}
          className="mt-6"
        >
          Save Bank Account
        </Button>
      </div>
    </Modal>
  );
}
