import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, ChevronDown, ChevronUp, Lock, Eye, Database, UserCheck, AlertTriangle } from 'lucide-react';

interface PrivacyPolicyModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const SECTIONS = [
  {
    icon: Database,
    title: 'What We Collect',
    content: 'We collect your name, phone number, email address, and transaction data to provide our payment services. We also collect device identifiers and usage logs to secure your account.',
  },
  {
    icon: Eye,
    title: 'How We Use It',
    content: 'Your data is used to process payments, verify your identity (KYC), send transaction notifications, prevent fraud, and improve our services. We do not sell your personal data to third parties.',
  },
  {
    icon: Lock,
    title: 'How We Protect It',
    content: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use bank-grade security infrastructure and regular third-party audits to keep your information safe.',
  },
  {
    icon: UserCheck,
    title: 'Your Rights',
    content: 'You have the right to access, correct, or delete your personal data at any time. You may also withdraw consent or request a copy of your data by contacting support@badepay.com.',
  },
  {
    icon: AlertTriangle,
    title: 'Data Sharing',
    content: 'We may share your data with licensed payment processors, CBN-regulated institutions, and fraud prevention services as required to deliver our services and comply with Nigerian law (NDPR 2019).',
  },
];

export function PrivacyPolicyModal({ open, onAccept, onDecline }: PrivacyPolicyModalProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="privacy-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          />

          {/* Modal */}
          <motion.div
            key="privacy-modal"
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
                      <Shield size={20} style={{ color: '#6fe8d6' }} />
                    </div>
                    <div>
                      <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                        Privacy Policy
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        BadePay · Last updated June 2026
                      </p>
                    </div>
                  </div>
                  <button onClick={onDecline} className="p-1.5 rounded-xl flex-shrink-0"
                    style={{ background: 'var(--surface-secondary)', color: 'var(--text-tertiary)' }}>
                    <X size={15} />
                  </button>
                </div>

                <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Before creating your account, please review how BadePay handles your personal information. Your privacy matters to us.
                </p>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2" onScroll={handleScroll}>
                {SECTIONS.map(({ icon: Icon, title, content }, i) => (
                  <div key={i}
                    className="rounded-2xl overflow-hidden cursor-pointer"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                  >
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(111,232,214,0.1)' }}>
                        <Icon size={13} style={{ color: '#6fe8d6' }} />
                      </div>
                      <span className="flex-1 text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                        {title}
                      </span>
                      {expandedIndex === i
                        ? <ChevronUp size={14} style={{ color: 'var(--text-tertiary)' }} />
                        : <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />}
                    </div>
                    <AnimatePresence initial={false}>
                      {expandedIndex === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" as const }}
                          style={{ overflow: 'hidden' }}
                        >
                          <p className="px-4 pb-4 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {content}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* NDPR compliance note */}
                <div className="rounded-2xl px-4 py-3.5 mt-1"
                  style={{ background: 'rgba(111,232,214,0.05)', border: '1px solid rgba(111,232,214,0.15)' }}>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    BadePay complies with the <strong style={{ color: 'var(--text-secondary)' }}>Nigeria Data Protection Regulation (NDPR) 2019</strong> and the CBN Consumer Protection Framework. By accepting, you consent to our data processing practices.
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
                <p className="text-center text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  Declining will cancel account creation
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
