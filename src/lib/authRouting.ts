import type { User } from '@/store/useAuthStore';

export function isMerchantOnboardingComplete(user: User | null | undefined): boolean {
  return !!user?.merchantProfile?.onboardingComplete;
}

export function getPostAuthPath(user: User | null | undefined): string {
  if (!user) return '/login';
  if (user.userType === 'merchant') {
    if (!isMerchantOnboardingComplete(user)) return '/merchant/onboarding';
    return '/merchant';
  }
  return '/dashboard';
}

export function formatAccountForDisplay(accountNumber?: string): string {
  if (!accountNumber) return '0124 421 442';
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
