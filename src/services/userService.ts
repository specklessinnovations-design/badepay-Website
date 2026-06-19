// FRONTEND-ONLY MODE: stubbed.
import { mockNotifications } from '@/mock/notifications';

const mockUser = {
  id: 'user_123',
  email: 'user@badepay.ng',
  phone: '+2348012345678',
  firstName: 'John',
  lastName: 'Doe',
  userType: 'consumer' as const,
  accountNumber: '1234567890',
  bankName: 'BadePay Bank',
  accountName: 'John Doe',
  kycLevel: 0 as const,
  kycStatus: 'pending' as const,
  createdAt: new Date().toISOString(),
  balance: 125000,
};

export const userService = {
  getProfile: async () => mockUser,
  profile: async () => mockUser,
  updateProfile: async (_data?: any) => mockUser,
  lookup: async () => mockUser,
  setPin: async (_pin: string) => ({ ok: true }),
  verifyPin: async (_pin: string) => ({ ok: true }),
};

export const notificationService = {
  getAll: async () => mockNotifications,
  getUnreadCount: async () => mockNotifications.filter((n: any) => !n.read).length,
  markOneRead: async () => {},
  markAllRead: async () => {},
  delete: async () => {},
};

export const kycService = {
  getStatus: async () => ({ status: 'pending' }),
  submit: async () => ({ status: 'pending' }),
};

export const qrService = {
  generate: async () => ({ qrToken: 'mock-qr-token', qrCodeUrl: '' }),
  decode: async () => ({ userId: 'mock-user', name: 'Mock User' }),
};

export default userService;
