/**
 * BadePay Notification Service
 * Connects to the real backend API for notifications.
 */
import apiClient from '@/lib/apiClient';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type?: 'transaction' | 'security' | 'system' | 'merchant';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const notificationService = {
  list: async (params?: { page?: number; limit?: number }): Promise<NotificationsResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    const resp = await apiClient.get(`/notifications${qs ? '?' + qs : ''}`);
    return resp?.data || { notifications: [], unreadCount: 0, pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};

export default notificationService;
