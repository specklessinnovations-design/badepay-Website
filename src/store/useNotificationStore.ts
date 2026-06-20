/**
 * BadePay Notification Store
 * Fetches notifications from the real backend API.
 */
import { create } from 'zustand';
import apiClient from '@/lib/apiClient';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  date: string;
  read: boolean;
  createdAt?: string;
  isRead?: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

function mapNotification(n: any): NotificationItem {
  return {
    id: n.id || n._id || '',
    title: n.title || '',
    body: n.body || n.message || '',
    type: n.type || 'transaction',
    date: n.createdAt || n.date || new Date().toISOString(),
    read: n.isRead ?? n.read ?? false,
    createdAt: n.createdAt,
    isRead: n.isRead,
  };
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    if (!apiClient.getAccessToken()) return;
    set({ isLoading: true });
    try {
      const resp = await apiClient.get('/notifications');
      const raw = resp?.data?.notifications || resp?.data || [];
      const notifications = Array.isArray(raw) ? raw.map(mapNotification) : [];
      const unreadCount = resp?.data?.unreadCount ?? notifications.filter((n) => !n.read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // Optimistic update already applied
    }
  },

  markAsRead: async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // Silently fail
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    } catch {
      // Silently fail
    }
  },
}));

export default useNotificationStore;
