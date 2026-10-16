
import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import apiClient from '@/lib/apiClient';
import { formatTimeAgo } from '@/utils/formatting';
import { Bell, Check, Trash2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
  } = useNotificationStore();

  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (showPreferences) {
    return <NotificationPreferences onBack={() => setShowPreferences(false)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </h2>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-sm text-[#6fe8d6] hover:underline"
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPreferences(true)}
            className="p-2 rounded-full hover:bg-[var(--surface-secondary)]"
            title="Notification preferences"
          >
            <Settings size={18} className="text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6fe8d6] border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'var(--surface-tertiary)' }}>
            <Bell size={24} className="text-[var(--text-tertiary)]" />
          </div>
          <p className="text-[var(--text-secondary)]">No notifications yet</p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            We'll notify you about important updates
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={() => handleMarkRead(notification.id)}
              onDelete={() => handleDelete(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: any;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const isUnread = !notification.read && !notification.isRead;

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        isUnread
          ? 'bg-[var(--card)] border-[#6fe8d6]/30'
          : 'bg-[var(--surface-secondary)] border-[var(--border)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${isUnread ? 'bg-[#6fe8d6]' : 'bg-transparent'}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm ${isUnread ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
            {notification.title}
          </p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">{notification.body}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            {formatTimeAgo(notification.date || notification.createdAt)}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {isUnread && (
            <button
              type="button"
              onClick={onMarkRead}
              className="p-1.5 rounded-full hover:bg-[var(--surface-tertiary)] text-[var(--text-tertiary)] hover:text-[#6fe8d6]"
              title="Mark as read"
            >
              <Check size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-full hover:bg-[var(--surface-tertiary)] text-[var(--text-tertiary)] hover:text-[#EF4444]"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** The one notification setting the backend keeps (same as the app): SMS alerts. In-app and email alerts are always on. */
function NotificationPreferences({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState<{ smsAlerts: boolean; hasPhone: boolean } | null>(null);
  useEffect(() => {
    apiClient.get('/users/me/notification-preferences').then((r) => setPrefs(r?.data ?? null)).catch(() => toast.error('Could not load your preferences'));
  }, []);

  const toggleSms = async () => {
    if (!prefs) return;
    try {
      const r = await apiClient.patch('/users/me/notification-preferences', { smsAlerts: !prefs.smsAlerts });
      setPrefs({ ...prefs, smsAlerts: !!r?.data?.smsAlerts });
      toast.success('SMS alerts updated');
    } catch (e: any) {
      toast.error(e?.message || 'Could not update SMS alerts');
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Back to notifications
      </button>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notification preferences</h2>
      <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {prefs?.hasPhone === false ? (
          <p className="px-4 py-4 text-sm text-[var(--text-secondary)]">Add a phone number to your profile to get SMS alerts.</p>
        ) : (
          <Toggle
            title="SMS alerts"
            subtitle="A text for every debit and credit"
            enabled={!!prefs?.smsAlerts}
            onToggle={toggleSms}
          />
        )}
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">In-app and email alerts are always on, so you never miss money moving in or out.</p>
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
