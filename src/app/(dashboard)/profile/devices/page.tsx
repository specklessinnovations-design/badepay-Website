

import React, { useEffect } from 'react';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { formatTimeAgo } from '@/utils/formatting';
import toast from 'react-hot-toast';

export default function DevicesPage() {
  const { trustedDevices, ensureCurrentDevice, removeDevice } = usePreferencesStore();

  useEffect(() => {
    ensureCurrentDevice();
  }, [ensureCurrentDevice]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-secondary)]">
        Devices that can access your BadePay account without extra verification.
      </p>
      <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {trustedDevices.map((device) => (
          <div key={device.id} className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="font-medium text-[var(--text-primary)]">
                {device.name}
                {device.isCurrent && (
                  <span className="ml-2 text-xs" style={{ color: 'var(--accent-text)' }}>· this device</span>
                )}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">Last active {formatTimeAgo(device.lastActive)}</p>
            </div>
            {!device.isCurrent && (
              <button
                type="button"
                onClick={() => {
                  removeDevice(device.id);
                  toast.success('Device removed');
                }}
                className="text-sm text-[#EF4444]"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
