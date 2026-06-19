

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import { getKycTierInfo } from '@/lib/personalHelpers';
import toast from 'react-hot-toast';

export default function KycPage() {
  const [, navigate] = useLocation();
  const { user, updateKycData, isLoading } = useAuthStore();
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');

  if (!user) return null;

  const kyc = getKycTierInfo(user.kycLevel);
  const canUpgrade = user.kycLevel < 2;

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bvn.replace(/\D/g, '').length !== 11) {
      toast.error('BVN must be 11 digits');
      return;
    }
    if (nin.replace(/\D/g, '').length !== 11) {
      toast.error('NIN must be 11 digits');
      return;
    }

    try {
      await updateKycData({
        bvnVerified: true,
        ninVerified: true,
        kycStatus: 'pending',
        kycSubmittedAt: new Date().toISOString(),
      } as Partial<typeof user>);
      toast.success('Documents submitted — awaiting admin review');
      navigate('/profile');
    } catch {
      toast.error('Verification failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-sm text-[var(--text-secondary)]">Current tier</p>
        <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Tier {user.kycLevel}</p>
        <p className="text-sm text-[var(--text-secondary)]">{kyc.label} · {kyc.access}</p>
      </div>

      {canUpgrade ? (
        <form onSubmit={handleUpgrade} className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">{kyc.nextBenefit}</p>
          <Field label="BVN" value={bvn} onChange={setBvn} placeholder="11-digit BVN" maxLength={11} />
          <Field label="NIN" value={nin} onChange={setNin} placeholder="11-digit NIN" maxLength={11} />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[#6fe8d6] py-3.5 text-sm font-semibold text-[#1a1a1a] disabled:opacity-50"
          >
            {isLoading ? 'Verifying…' : 'Submit for review'}
          </button>
        </form>
      ) : (
        <p className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/10 p-4 text-sm text-[#10B981]">
          You have full KYC access at your current tier.
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-[var(--text-secondary)]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none"
      />
    </div>
  );
}
