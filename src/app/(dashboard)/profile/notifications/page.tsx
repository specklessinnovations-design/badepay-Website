

import React from 'react';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const {
    pushNotifications,
    smsNotifications,
    emailNotifications,
    setPushNotifications,
    setSmsNotifications,
    setEmailNotifications,
  } = usePreferencesStore();

  const save = (message: string) => toast.success(message);

  return (
    <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <Toggle
        title="Push notifications"
        subtitle="Alerts in the BadePay app"
        enabled={pushNotifications}
        onToggle={() => {
          setPushNotifications(!pushNotifications);
          save('Push preference saved');
        }}
      />
      <Toggle
        title="SMS notifications"
        subtitle="Texts for transfers and security"
        enabled={smsNotifications}
        onToggle={() => {
          setSmsNotifications(!smsNotifications);
          save('SMS preference saved');
        }}
      />
      <Toggle
        title="Email notifications"
        subtitle="Receipts and account updates"
        enabled={emailNotifications}
        onToggle={() => {
          setEmailNotifications(!emailNotifications);
          save('Email preference saved');
        }}
      />
    </div>
  );
}

function Toggle({
  title,
  subtitle,
  enabled,
  onToggle,
}: {
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <div className="flex-1">
        <p className="font-medium text-[var(--text-primary)]">{title}</p>
        <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${enabled ? 'bg-[#6fe8d6]' : 'bg-[var(--surface-tertiary)]'}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}
