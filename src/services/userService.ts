/**
 * BadePay User Service
 * Connects to the real backend API for user profile, notifications, KYC, and QR.
 */

import apiClient from '@/lib/apiClient';

export const userService = {
  /**
   * Get the authenticated user's profile.
   * Backend: GET /users/me
   */
  getProfile: async () => {
    const resp = await apiClient.get('/users/me');
    return resp?.data?.user || resp?.data || resp?.user || null;
  },

  profile: async () => userService.getProfile(),

  /**
   * Update user profile.
   * Backend: PATCH /users/me
   */
  updateProfile: async (data?: any) => {
    if (!data) return userService.getProfile();
    const resp = await apiClient.patch('/users/me', data);
    return resp?.data?.user || resp?.data || null;
  },

  /**
   * Look up a user by account number or phone (for transfers).
   * Backend: GET /users/me (placeholder — extend backend with /users/lookup)
   */
  lookup: async (query?: string) => {
    try {
      const resp = await apiClient.get(`/users/lookup?q=${encodeURIComponent(query || '')}`);
      return resp?.data?.user || resp?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Set transaction PIN.
   * Backend: POST /auth/set-pin
   */
  setPin: async (pin: string) => {
    await apiClient.post('/auth/set-pin', { pin });
    return { ok: true };
  },

  /**
   * Verify transaction PIN.
   * Backend: POST /auth/verify-pin
   */
  verifyPin: async (pin: string) => {
    try {
      await apiClient.post('/auth/verify-pin', { pin });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  },
};

export const notificationService = {
  /**
   * Get all notifications.
   * Backend: GET /notifications
   */
  getAll: async () => {
    const resp = await apiClient.get('/notifications');
    return resp?.data?.notifications || resp?.data || [];
  },

  /**
   * Get unread notification count.
   * Backend: GET /notifications
   */
  getUnreadCount: async () => {
    const resp = await apiClient.get('/notifications');
    return resp?.data?.unreadCount ?? 0;
  },

  /**
   * Mark a single notification as read.
   * Backend: PATCH /notifications/:id/read
   */
  markOneRead: async (id: string) => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read.
   * Backend: PATCH /notifications/read-all
   */
  markAllRead: async () => {
    await apiClient.patch('/notifications/read-all');
  },

  /**
   * Delete a notification.
   * Backend: DELETE /notifications/:id
   */
  delete: async (id: string) => {
    await apiClient.delete(`/notifications/${id}`);
  },
};

export const qrService = {
  /**
   * Generate a QR code for merchant.
   * Backend: GET /qr/generate
   */
  generate: async () => {
    const resp = await apiClient.get('/qr/generate');
    return resp?.data || { qrToken: '', qrCodeUrl: '' };
  },

  /**
   * Scan a QR code to get merchant info.
   * Backend: POST /qr/scan
   */
  decode: async (slug: string) => {
    const resp = await apiClient.post('/qr/scan', { merchantSlug: slug });
    return resp?.data?.merchant || resp?.data || null;
  },
};

export default userService;
