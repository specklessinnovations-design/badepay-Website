import { useEffect } from 'react';

import { useLocation } from 'wouter';

import { useAuthStore } from '@/store/useAuthStore';

import { getPostAuthPath, isMerchantOnboardingComplete } from '@/lib/authRouting';



const PUBLIC_AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-otp', '/set-pin'];



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



const MERCHANT_ROUTES = ['/merchant'];

const CONSUMER_ROUTES = ['/dashboard', '/activity', '/transfer', '/bills', '/cards', '/history', '/scan', '/stores'];

const MERCHANT_ONBOARDING_PATH = '/merchant/onboarding';



export function useAuthProtection() {

  
  const [pathname, navigate] = useLocation();
  const { isAuthenticated, user, checkSessionValidity, authSetupComplete } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !checkSessionValidity()) {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        sessionToken: undefined,
        refreshToken: undefined,
      });
      navigate('/login');
      return;
    }

    if (isAuthenticated && authSetupComplete && PUBLIC_AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
      navigate(getPostAuthPath(user));
      return;
    }

    if (!isAuthenticated && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
      navigate('/login');
      return;
    }

    if (isAuthenticated && user) {
      // Only restrict merchant routes to non-merchants who DON'T have a merchant profile
      if (!user.merchantProfile && MERCHANT_ROUTES.some((route) => pathname.startsWith(route))) {
        navigate('/dashboard');
        return;
      }

      if (
        user.userType === 'merchant' &&
        !isMerchantOnboardingComplete(user) &&
        pathname.startsWith('/merchant') &&
        !pathname.startsWith(MERCHANT_ONBOARDING_PATH)
      ) {
        navigate(MERCHANT_ONBOARDING_PATH);
        return;
      }

      if (
        user.userType === 'merchant' &&
        isMerchantOnboardingComplete(user) &&
        pathname.startsWith(MERCHANT_ONBOARDING_PATH)
      ) {
        navigate('/merchant');
      }
    }
  }, [isAuthenticated, user, pathname, navigate, checkSessionValidity, authSetupComplete]);

}



export function useRequireAuth() {

  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuthStore();



  useEffect(() => {

    if (!isAuthenticated) {

      navigate('/login');

    }

  }, [isAuthenticated, navigate]);



  return { isAuthenticated, user };

}



export function useRequireMerchant(options?: { allowOnboarding?: boolean }) {

  
  const [pathname, navigate] = useLocation();

  const { isAuthenticated, user } = useAuthStore();

  const onOnboarding = pathname.startsWith(MERCHANT_ONBOARDING_PATH);



  useEffect(() => {

    if (!isAuthenticated) {

      navigate('/login?type=merchant');

      return;

    }

    // Only restrict merchant routes to users who DON'T have a merchant profile at all
    if (!user?.merchantProfile && user?.userType !== 'merchant') {

      navigate('/dashboard');

      return;

    }

    if (!options?.allowOnboarding && !onOnboarding && !isMerchantOnboardingComplete(user)) {

      navigate(MERCHANT_ONBOARDING_PATH);

    }

  }, [isAuthenticated, user, navigate, options?.allowOnboarding, onOnboarding]);



  return { isAuthenticated, user };

}



export function useRequireConsumer() {

  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {

    if (!isAuthenticated) {

      navigate('/login');

      return;

    }

    // Don't restrict consumer routes - allow any authenticated user to access them

  }, [isAuthenticated, navigate]);



  const { user } = useAuthStore();
  return { isAuthenticated, user };

}

