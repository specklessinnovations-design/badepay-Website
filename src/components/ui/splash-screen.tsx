import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

export function SplashScreen() {
  const [pathname] = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname !== '/login') {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ backgroundColor: 'var(--background)' }}
        >
          {/* Theme-aware ambient glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(111,232,214,0.14) 0%, transparent 70%)',
            }}
          />

          {/* Animated rings */}
          <div className="relative flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 140 + i * 60,
                  height: 140 + i * 60,
                  border: '1px solid rgba(111,232,214,0.12)',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.15, 1.3] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Logo */}
            <motion.img
              src="/favicon.png"
              alt="BadePay"
              initial={{ opacity: 0, scale: 0.75, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative z-10 h-20 w-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 36px rgba(111,232,214,0.5))' }}
            />
          </div>

          {/* Brand name */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="relative z-10 mt-6 text-sm font-semibold tracking-[0.2em] uppercase"
            style={{ color: 'var(--text-secondary)' }}
          >
            BadePay
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
