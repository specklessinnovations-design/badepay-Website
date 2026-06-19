

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

const SPLASH_KEY = 'badepay-splash-seen';

export function SplashScreen() {
  const [pathname] = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname === '/') return;

    const seen = sessionStorage.getItem(SPLASH_KEY);
    if (seen) return;

    setVisible(true);
    sessionStorage.setItem(SPLASH_KEY, '1');

    const timer = setTimeout(() => setVisible(false), 1400);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--background)]"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(111,232,214,0.12) 0%, transparent 70%)',
            }}
          />

          <motion.img
            src="/favicon.png"
            alt="BadePay"
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: "easeOut" as const }}
            className="h-24 w-auto object-contain"
            style={{ filter: 'drop-shadow(0 0 40px rgba(111,232,214,0.45))' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
