

import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SplashScreen } from '@/components/ui/splash-screen';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SplashScreen />
      {children}
    </ThemeProvider>
  );
}
