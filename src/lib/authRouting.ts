import type { User } from '@/store/useAuthStore';

export function isMerchantOnboardingComplete(user: User | null | undefined): boolean {
  if (!user) return false;
  // Check if user has a merchant profile with business name
  return !!user.merchantProfile?.businessName;
}

export function getPostAuthPath(user: User | null | undefined, loginType: 'personal' | 'merchant' = 'personal'): string {
  if (!user) return '/login';
  
  // If user selected merchant login, redirect to merchant dashboard
  if (loginType === 'merchant') {
    // Check if user has merchant profile
    if (!user.merchantProfile?.businessName) {
      return '/merchant/onboarding';
    }
    return '/merchant';
  }
  
  // If user selected personal login, redirect to personal dashboard
  // regardless of whether they have a merchant account
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
