/**
 * BadePay Notifications Service
 * Connects to the real backend API for notifications.
 */
import apiClient from '@/lib/apiClient';

export const notificationsService = {
  list: async () => apiClient.get('/notifications'),
  markRead: async (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: async () => apiClient.patch('/notifications/read-all'),
  delete: async (id: string) => apiClient.delete(`/notifications/${id}`),
};

export default notificationsService;
