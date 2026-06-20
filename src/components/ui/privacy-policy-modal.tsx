import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

interface PrivacyPolicyModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function PrivacyPolicyModal({ open, onAccept, onDecline }: PrivacyPolicyModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="privacy-banner"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:pb-6"
        >
          <div
            className="mx-auto max-w-5xl rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6"
            style={{
              background: 'rgba(15,15,18,0.96)',
              border: '1px solid rgba(111,232,214,0.15)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(111,232,214,0.08)',
            }}
          >
            {/* Icon + text */}
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(111,232,214,0.1)', border: '1px solid rgba(111,232,214,0.2)' }}
              >
                <Shield size={18} style={{ color: '#6fe8d6' }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#e8e8ec' }}>
                  We value your privacy
                </p>
                <p className="text-xs leading-relaxed mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  BadePay uses your data to process payments, verify identity, and keep your account secure.
                  We comply with the Nigeria Data Protection Regulation (NDPR) 2019 and CBN Consumer Protection Framework.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2.5 flex-shrink-0 w-full md:w-auto">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onDecline}
                className="flex-1 md:flex-none rounded-xl px-5 py-2.5 text-xs font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Decline
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onAccept}
                className="flex-1 md:flex-none rounded-xl px-6 py-2.5 text-xs font-bold transition-all"
                style={{
                  background: '#6fe8d6',
                  color: '#0a0a0c',
                  boxShadow: '0 4px 16px rgba(111,232,214,0.25)',
                }}
              >
                Accept & Continue
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
