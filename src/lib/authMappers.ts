import type { User } from '@/store/useAuthStore';
import type { StoredUser } from '@/services/authService';

export function toPublicUser(stored: StoredUser): User {
  const { password: _password, ...publicUser } = stored;
  return publicUser as User;
}
