
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { ShieldCheck, Server, AlertCircle, Save } from 'lucide-react';
import platformDataService, { type PlatformSettings } from '@/services/platformDataService';

const A_CARD = {
  background: 'var(--ad-card)',
  border: '1px solid #e5e5e5',
  borderRadius: '1rem',
  boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
  padding: '2rem',
} as const;

const A_INPUT = {
  background: 'rgba(111,232,214,0.05)',
  border: '1px solid rgba(111,232,214,0.12)',
  borderRadius: '0.75rem',
  color: 'var(--ad-fg-strong)',
  padding: '0.75rem 1rem',
  width: '100%',
  fontSize: '0.875rem',
  fontWeight: 700,
  outline: 'none',
} as const;

const A_LABEL = {
  display: 'block',
  color: 'var(--ad-muted)',
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: '0.5rem',
};

function AdminInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label style={A_LABEL}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        style={A_INPUT}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(111,232,214,0.35)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(111,232,214,0.08)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(111,232,214,0.12)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const { showSuccess } = useToast();

  useEffect(() => {
    setSettings(platformDataService.getPlatformSettings());
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsLoading(true);
    await platformDataService.savePlatformSettings(settings);
    await new Promise((r) => setTimeout(r, 400));
    setIsLoading(false);
    showSuccess('Platform settings saved.');
  };

  if (!settings) return null;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ad-muted-soft)' }}>
          System Configuration
        </p>
        <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--ad-fg-strong)' }}>
          Platform Settings
        </h2>
        <p className="mt-1 text-sm font-medium" style={{ color: 'var(--ad-muted)' }}>
          Applies to web and mobile clients from a single configuration store.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General */}
        <div style={A_CARD}>
          <div
            className="mb-6 flex items-center gap-3 pb-4"
            style={{ borderBottom: '1px solid rgba(111,232,214,0.1)' }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(111,232,214,0.1)', color: '#6fe8d6' }}
            >
              <Server size={20} />
            </div>
            <h3 className="text-lg font-black" style={{ color: 'var(--ad-fg-strong)' }}>
              General Information
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AdminInput
              label="Platform Name"
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
            />
            <AdminInput
              label="Support Email Address"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
            />
            <AdminInput
              label="Customer Care Hotline"
              value={settings.supportPhone}
              onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
            />
            <AdminInput
              label="Corporate Address"
              value={settings.corporateAddress}
              onChange={(e) => setSettings({ ...settings, corporateAddress: e.target.value })}
            />
          </div>
        </div>

        {/* Security */}
        <div style={A_CARD}>
          <div
            className="mb-6 flex items-center gap-3 pb-4"
            style={{ borderBottom: '1px solid rgba(111,232,214,0.1)' }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(111,232,214,0.1)', color: '#6fe8d6' }}
            >
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-lg font-black" style={{ color: 'var(--ad-fg-strong)' }}>
              Security &amp; Limits
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AdminInput
              label="Maximum Daily Transfer Limit (NGN)"
              type="number"
              value={String(settings.maxDailyTransferLimit)}
              onChange={(e) => setSettings({ ...settings, maxDailyTransferLimit: Number(e.target.value) })}
            />
            <AdminInput
              label="KYC Requirement Threshold (NGN)"
              type="number"
              value={String(settings.kycThreshold)}
              onChange={(e) => setSettings({ ...settings, kycThreshold: Number(e.target.value) })}
            />

            {/* Toggle: Auto-Approve BVN */}
            <div
              className="col-span-1 flex items-center justify-between rounded-2xl p-5 md:col-span-2"
              style={{
                background: 'rgba(52,211,153,0.05)',
                border: '1px solid rgba(52,211,153,0.12)',
              }}
            >
              <div>
                <p className="font-black" style={{ color: 'var(--ad-fg-strong)' }}>
                  Auto-Approve BVN Users
                </p>
                <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--ad-muted)' }}>
                  Automatically verify KYC for users with a matching BVN identity.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={settings.autoApproveBvn}
                  onChange={(e) => setSettings({ ...settings, autoApproveBvn: e.target.checked })}
                />
                <div className="peer h-7 w-14 rounded-full bg-gray-700 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-600 after:bg-[var(--ad-card)] after:transition-all after:content-[''] peer-checked:bg-[#6fe8d6] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>

            {/* Toggle: Maintenance Mode */}
            <div
              className="col-span-1 flex items-center justify-between rounded-2xl p-5 md:col-span-2"
              style={{
                background: 'rgba(248,113,113,0.05)',
                border: '1px solid rgba(248,113,113,0.15)',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}
                >
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="font-black" style={{ color: '#f87171' }}>
                    Maintenance Mode
                  </p>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--ad-muted)' }}>
                    Block new consumer and merchant logins platform-wide.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                />
                <div className="peer h-7 w-14 rounded-full bg-gray-700 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-600 after:bg-[var(--ad-card)] after:transition-all after:content-[''] peer-checked:bg-red-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-black transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{
              background: '#6fe8d6',
              color: '#030f0d',
              boxShadow: '0 4px 16px rgba(111,232,214,0.3)',
            }}
          >
            <Save size={16} />
            {isLoading ? 'Saving…' : 'Save System Configurations'}
          </button>
        </div>
      </form>
    </div>
  );
}
