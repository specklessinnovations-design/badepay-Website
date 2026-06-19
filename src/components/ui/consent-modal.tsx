import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle } from 'lucide-react';

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  phoneNumber?: string;
}

export function ConsentModal({ open, onAccept, onDecline, phoneNumber }: ConsentModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="consent-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          />

          {/* Modal */}
          <motion.div
            key="consent-modal"
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-md rounded-3xl flex flex-col overflow-hidden"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                maxHeight: '90vh',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
              }}
            >
              {/* Header */}
              <div className="flex-shrink-0 px-6 pt-6 pb-5"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(111,232,214,0.12)', border: '1px solid rgba(111,232,214,0.2)' }}>
                      <AlertCircle size={20} style={{ color: '#6fe8d6' }} />
                    </div>
                    <div>
                      <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                        Verify & Consent
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        BadePay · Account Setup
                      </p>
                    </div>
                  </div>
                  <button onClick={onDecline} className="p-1.5 rounded-xl flex-shrink-0"
                    style={{ background: 'var(--surface-secondary)', color: 'var(--text-tertiary)' }}>
                    <X size={15} />
                  </button>
                </div>

                <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  We'll send a verification code to <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{phoneNumber}</span>. By continuing, you agree to our terms.
                </p>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {/* Consent item 1 */}
                <div className="rounded-2xl overflow-hidden p-4"
                  style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(111,232,214,0.15)' }}>
                      <Check size={12} style={{ color: '#6fe8d6' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        SMS Verification
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        We'll send a 6-digit code to verify your phone number. Standard SMS rates may apply.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Consent item 2 */}
                <div className="rounded-2xl overflow-hidden p-4"
                  style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(111,232,214,0.15)' }}>
                      <Check size={12} style={{ color: '#6fe8d6' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        Terms of Service
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        You agree to our Terms of Service and understand that BadePay is a regulated payment service.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Consent item 3 */}
                <div className="rounded-2xl overflow-hidden p-4"
                  style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(111,232,214,0.15)' }}>
                      <Check size={12} style={{ color: '#6fe8d6' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        Data Processing
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Your data will be processed in accordance with NDPR 2019 and CBN regulations. We protect your information with bank-grade encryption.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compliance note */}
                <div className="rounded-2xl px-4 py-3.5"
                  style={{ background: 'rgba(111,232,214,0.05)', border: '1px solid rgba(111,232,214,0.15)' }}>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    BadePay is regulated by the Central Bank of Nigeria (CBN) and complies with all applicable financial services regulations.
                  </p>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex-shrink-0 px-6 pb-6 pt-4 space-y-2.5"
                style={{ borderTop: '1px solid var(--border)' }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onAccept}
                  className="w-full rounded-2xl py-3.5 text-sm font-black transition-all"
                  style={{
                    background: '#6fe8d6',
                    color: '#1a1a1a',
                    boxShadow: '0 4px 20px rgba(111,232,214,0.3)',
                  }}
                >
                  Accept & Continue
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onDecline}
                  className="w-full rounded-2xl py-3 text-sm font-bold transition-all"
                  style={{
                    background: 'var(--surface-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  Decline
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
