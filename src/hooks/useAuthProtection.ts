import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import { isMerchantOnboardingComplete } from '@/lib/authRouting';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/activity',
  '/profile',
  '/transfer',
  '/bills',
  '/cards',
  '/history',
  '/scan',
  '/settings',
  '/set-pin',
  '/merchant',
];

function isProtectedPath(pathname: string) {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function loginPathFor(pathname: string) {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const redirect = encodeURIComponent(pathname + search);
  if (pathname === '/merchant' || pathname.startsWith('/merchant/')) {
    return `/login?type=merchant&next=${redirect}`;
  }
  return `/login?next=${redirect}`;
}

/**
 * Global route guard.
 * Waits for AuthBootstrap before deciding so a hard refresh does not briefly look
 * logged-out and bounce through /login (wrong title + wrong post-auth destination).
 */
export function useAuthProtection() {
  const [pathname, navigate] = useLocation();
  const { isAuthenticated, user, authSetupComplete } = useAuthStore();

  useEffect(() => {
    if (!authSetupComplete) return;

    if (!isAuthenticated && isProtectedPath(pathname)) {
      navigate(loginPathFor(pathname));
    }
  }, [pathname, isAuthenticated, user, authSetupComplete, navigate]);

  return { isAuthenticated, user };
}

export function useRequireAuth() {
  const [, navigate] = useLocation();
  const { isAuthenticated, authSetupComplete } = useAuthStore();

  useEffect(() => {
    if (!authSetupComplete) return;
    if (!isAuthenticated) {
      const here =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/dashboard';
      navigate(`/login?next=${encodeURIComponent(here)}`);
    }
  }, [isAuthenticated, authSetupComplete, navigate]);

  return { isAuthenticated };
}

const MERCHANT_ONBOARDING_PATH = '/merchant/onboarding';

/**
 * Merchant portal guard.
 * Preserves the merchant URL via ?redirect= when sending to login, and only
 * sends personal-only accounts to /dashboard.
 */
export function useRequireMerchant(options?: { allowOnboarding?: boolean }) {
  const [pathname, navigate] = useLocation();
  const { isAuthenticated, user, authSetupComplete } = useAuthStore();
  const onOnboarding = pathname.startsWith(MERCHANT_ONBOARDING_PATH);

  useEffect(() => {
    if (!authSetupComplete) return;

    if (!isAuthenticated) {
      const here =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/merchant';
      navigate(`/login?type=merchant&next=${encodeURIComponent(here)}`);
      return;
    }

    // BVN first, then business setup
    if ((user?.kycLevel ?? 0) < 1) {
      navigate('/verify-bvn?then=merchant');
      return;
    }

    const isMerchantAccount =
      Boolean(user?.merchantProfile) || user?.userType === 'merchant';

    // Personal-only accounts stay out of the merchant portal (except onboarding)
    if (!onOnboarding && !isMerchantAccount) {
      navigate('/dashboard');
      return;
    }

    if (!options?.allowOnboarding && !onOnboarding && !isMerchantOnboardingComplete(user)) {
      navigate(MERCHANT_ONBOARDING_PATH);
    }
  }, [isAuthenticated, user, navigate, options?.allowOnboarding, onOnboarding, authSetupComplete]);

  return { isAuthenticated, user };
}

export function useRequireConsumer() {
  const [, navigate] = useLocation();
  const { isAuthenticated, authSetupComplete } = useAuthStore();

  useEffect(() => {
    if (!authSetupComplete) return;
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authSetupComplete, navigate]);

  return { isAuthenticated };
}
