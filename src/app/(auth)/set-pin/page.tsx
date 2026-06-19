import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { PremiumButton } from '@/components/ui/premium-button';
import { bpToast } from '@/lib/bpToast';

const PinDots = ({ value, show }: { value: string; show: boolean }) => (
  <div className="flex gap-3 justify-center">
    {Array.from({ length: 4 }).map((_, i) => (
      <motion.div key={i}
        animate={{ scale: value.length > i ? 1.15 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="w-4 h-4 rounded-full transition-all duration-200"
        style={{
          background: value.length > i ? '#6fe8d6' : 'var(--surface-tertiary)',
          border: value.length > i ? 'none' : '2px solid var(--border)',
          boxShadow: value.length > i ? '0 0 12px rgba(111,232,214,0.5)' : 'none',
        }}>
        {show && value[i] && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-[#1a1a1a]">{value[i]}</span>
        )}
      </motion.div>
    ))}
  </div>
);

const numpad = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function SetPINPage() {
  const [, navigate] = useLocation();
  const { setPin, isLoading } = useAuthStore();

  const [step, setStep] = useState<'enter'|'confirm'>('enter');
  const [pin, setLocalPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const current = step === 'enter' ? pin : confirmPin;
  const setter = step === 'enter' ? setLocalPin : setConfirmPin;

  const handleKey = (key: string) => {
    setError('');
    if (key === '⌫') {
      setter(p => p.slice(0, -1));
    } else if (current.length < 4 && key !== '') {
      const next = current + key;
      setter(next);
      if (next.length === 4) {
        if (step === 'enter') {
          setTimeout(() => setStep('confirm'), 300);
        } else {
          handleSubmit(next);
        }
      }
    }
  };

  const handleSubmit = async (confirmValue: string) => {
    if (pin !== confirmValue) {
      setError('PINs don\'t match — let\'s try again');
      setConfirmPin('');
      setTimeout(() => { setStep('enter'); setLocalPin(''); setError(''); }, 1800);
      return;
    }
    try {
      await setPin(pin);
      setIsSuccess(true);
      bpToast.success('PIN set successfully!');
      setTimeout(() => navigate('/profile'), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set PIN');
      setConfirmPin('');
      setStep('enter');
      setLocalPin('');
    }
  };

  if (isSuccess) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-full flex flex-col items-center justify-center py-12 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 250 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)' }}>
          <CheckCircle2 size={36} className="text-[#10B981]" />
        </motion.div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">PIN set!</h1>
        <p className="text-[var(--text-secondary)] text-sm">Your account is now fully secured</p>
        <div className="mt-6 h-1 w-32 rounded-full overflow-hidden bg-[var(--surface-secondary)]">
          <motion.div className="h-full bg-[#6fe8d6]" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2 }} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" as const }} className="w-full">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(111,232,214,0.08)', border: '1px solid rgba(111,232,214,0.2)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6fe8d6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] mb-1.5">
              {step === 'enter' ? 'Create your PIN' : 'Confirm your PIN'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {step === 'enter' ? 'Choose a secure 4-digit transaction PIN' : 'Enter your PIN once more to confirm'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* PIN dots */}
      <div className="mb-8 relative">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PinDots value={current} show={showPin} />
          </motion.div>
        </AnimatePresence>
        <button type="button" onClick={() => setShowPin(!showPin)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors p-2">
          {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 text-sm font-semibold text-[#EF4444] text-center">{error}</motion.p>
        )}
      </AnimatePresence>

      {/* Step indicator */}
      <div className="flex gap-2 justify-center mb-8">
        {[0, 1].map(i => (
          <div key={i} className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: (step === 'enter' ? i === 0 : i === 1) ? '2rem' : '0.75rem',
              background: (step === 'enter' ? i === 0 : i === 1) ? '#6fe8d6' : 'var(--border)',
            }} />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3">
        {numpad.map((key, idx) => (
          <button key={idx} type="button" onClick={() => handleKey(key)}
            disabled={key === ''}
            className={`h-16 rounded-2xl text-xl font-black transition-all duration-150 active:scale-95 ${
              key === '' ? 'cursor-default opacity-0'
              : key === '⌫'
              ? 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]'
              : 'text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
            }`}
            style={key !== '' && key !== '⌫' ? { background: 'var(--surface-secondary)', border: '1px solid var(--border)' } : {}}>
            {key}
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
        🔒 Your PIN authorizes all transactions. Never share it with anyone.
      </p>
    </motion.div>
  );
}
