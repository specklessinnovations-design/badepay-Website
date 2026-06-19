import apiClient from '@/lib/apiClient';

export const notificationsService = {
  list: async () => apiClient.get('/notifications'),
  markRead: async (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: async () => apiClient.patch('/notifications/read-all'),
};

export default notificationsService;
