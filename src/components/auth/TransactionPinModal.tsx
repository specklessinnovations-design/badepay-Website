import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TransactionPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function TransactionPinModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Enter Transaction PIN",
  description = "Please enter your 4-digit transaction PIN to confirm this action."
}: TransactionPinModalProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const verifyPin = useAuthStore((s) => s.verifyPin);

  const handleSubmit = async (value: string) => {
    if (value.length !== 4) return;
    
    setLoading(true);
    try {
      const isValid = await verifyPin(value);
      if (isValid) {
        onSuccess();
        setPin('');
        onClose();
      } else {
        toast.error('Invalid transaction PIN');
        setPin('');
      }
    } catch (error) {
      toast.error('Failed to verify PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center justify-center space-y-6 py-4">
        <p className="text-center text-sm font-medium text-gray-500">
          {description}
        </p>
        
        <div className="flex justify-center">
          <InputOTP
            maxLength={4}
            value={pin}
            onChange={(val) => {
              setPin(val);
              if (val.length === 4) {
                handleSubmit(val);
              }
            }}
            disabled={loading}
            autoFocus
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="h-12 w-12 rounded-xl border-2 border-gray-200 text-lg font-bold text-gray-900 focus:border-[#6fe8d6] focus:ring-0"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm font-bold text-[#6fe8d6]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying PIN...
          </div>
        )}

        <button
          onClick={onClose}
          className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
