import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '../store/useAuthStore';

export function useAuth() {
    const [pathname, navigate] = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    const isAuthRoute = pathname.startsWith('/login') || 
                        pathname.startsWith('/register') || 
                        pathname.startsWith('/forgot-password') || 
                        pathname.startsWith('/reset-password') || 
                        pathname.startsWith('/verify-otp');
    const isLegalRoute = pathname.startsWith('/legal');

    if (!isAuthenticated && !isAuthRoute && !isLegalRoute) {
      navigate('/login');
    } else if (isAuthenticated && isAuthRoute) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, pathname, navigate]);

  return { isAuthenticated, user, logout };
}
