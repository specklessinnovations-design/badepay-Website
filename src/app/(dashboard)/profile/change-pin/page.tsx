import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

export default function ChangePinPage() {
  const [, navigate] = useLocation();
  const { user, setPin, syncUserFromStorage } = useAuthStore();
  const [showPin, setShowPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSavePin = async () => {
    setError('');
    if (newPin.length !== 4 || confirmPin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    setLoading(true);
    try {
      await setPin(newPin);
      setSuccess(true);
      setNewPin('');
      setConfirmPin('');
      await syncUserFromStorage();
    } catch (err: any) {
      setError(err?.message || 'Failed to update PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)' }}>
          <CheckCircle2 size={36} className="text-[#10B981]" />
        </div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">PIN Updated</h1>
        <p className="text-[var(--text-secondary)] text-sm">Your transaction PIN has been saved securely.</p>
        <button
          onClick={() => navigate('/profile/security')}
          className="mt-8 rounded-full bg-[#6fe8d6] px-8 py-3 text-sm font-semibold text-[#1a1a1a]"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/profile/security')}
          className="h-9 w-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--text-primary)]">
          {user?.hasPinSet ? 'Change PIN' : 'Set PIN'}
        </h1>
      </div>

      <div>
        <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">
          {user?.hasPinSet ? 'Set a new PIN' : 'Create your PIN'}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          A 4-digit PIN is required to authorize every payment and transfer.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl p-4 flex gap-3"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Lock size={20} className="text-[#EF4444] shrink-0 mt-0.5" />
          <p className="text-sm text-[#EF4444]">{error}</p>
        </div>
      )}

      {/* PIN status card */}
      <div className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(111,232,214,0.1) 0%, var(--card) 60%)', border: '1px solid rgba(111,232,214,0.2)' }}>
        <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(111,232,214,0.15)' }}>
          <Lock size={24} className="text-[#6fe8d6]" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-[var(--text-primary)]">PIN Status</div>
          <div className="text-xs text-[var(--text-secondary)] mt-0.5">
            {user?.hasPinSet ? 'Active — PIN is set and encrypted' : 'Not set — please create a PIN'}
          </div>
        </div>
        {user?.hasPinSet ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#10B981]">
            <CheckCircle2 size={16} /> Active
          </span>
        ) : (
          <span className="text-xs text-[#EF4444] font-medium">Missing</span>
        )}
      </div>

      {/* New PIN */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
          {user?.hasPinSet ? 'New PIN' : 'Create PIN'}
        </label>
        <div className="mt-2 h-14 rounded-xl flex items-center px-4 gap-3"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
          <input
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
            className="flex-1 bg-transparent outline-none text-2xl tracking-widest font-semibold text-center placeholder:text-[var(--text-tertiary)]"
            placeholder="••••"
            autoFocus
          />
          <button onClick={() => setShowPin(!showPin)} className="text-[var(--text-secondary)]">
            {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Confirm PIN */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Confirm PIN</label>
        <div className="mt-2 h-14 rounded-xl flex items-center px-4"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={confirmPin}
            onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
            className="flex-1 bg-transparent outline-none text-2xl tracking-widest font-semibold text-center placeholder:text-[var(--text-tertiary)]"
            placeholder="••••"
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSavePin}
        disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
        className="w-full rounded-xl bg-[#6fe8d6] py-3.5 text-sm font-semibold text-[#1a1a1a] disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ boxShadow: '0 4px 20px rgba(111,232,214,0.3)' }}
      >
        {loading ? (
          <>
            <div className="h-4 w-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          'Save PIN'
        )}
      </button>

      {/* Security note */}
      <div className="flex items-start gap-2 text-xs text-[var(--text-tertiary)] leading-relaxed">
        <Lock size={14} className="text-[#6fe8d6] shrink-0 mt-0.5" />
        <span>
          Your PIN is hashed with bcrypt and never stored in readable form. BadePay staff will never ask for your PIN.
        </span>
      </div>
    </div>
  );
}
