import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Shield, Database, Eye, Lock, UserCheck, AlertTriangle, ChevronDown } from 'lucide-react';

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
    content: 'You have the right to access, correct, or delete your personal data at any time. You may also withdraw consent or request a copy of your data by contacting hello@badepay.com.',
  },
  {
    icon: AlertTriangle,
    title: 'Data Sharing',
    content: 'We may share your data with licensed payment processors, CBN-regulated institutions, and fraud prevention services as required to deliver our services and comply with Nigerian law (NDPR 2019).',
  },
];

export function PrivacyPolicyModal({ open, onAccept, onDecline }: PrivacyPolicyModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(6px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              position: 'relative',
              zIndex: 10,
              width: '100%',
              maxWidth: '440px',
              maxHeight: '90vh',
              background: '#111111',
              border: '0.5px solid rgba(255,255,255,0.10)',
              borderRadius: '28px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Close Button */}
            <button
              onClick={onDecline}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                zIndex: 20,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)',
                padding: '6px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <X size={16} />
            </button>

            <AnimatePresence mode="wait">
              {!showDetails ? (
                /* ── Main View ── */
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}
                >
                  {/* Header */}
                  <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
                    <p style={{
                      margin: '0 0 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.13em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.35)',
                    }}>
                      Before you continue
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#ffffff',
                      lineHeight: 1.45,
                    }}>
                      BadePay needs your consent<br />to handle your personal data:
                    </p>
                  </div>

                  {/* Consent Item Cards */}
                  <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Row 1 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '0.5px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(111,232,214,0.10)',
                        border: '0.5px solid rgba(111,232,214,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Shield size={16} color="#6fe8d6" />
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.62)',
                        lineHeight: 1.5,
                        fontWeight: 400,
                      }}>
                        Verify your identity (KYC), process payments, and keep your account secure.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '0.5px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(111,232,214,0.10)',
                        border: '0.5px solid rgba(111,232,214,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Database size={16} color="#6fe8d6" />
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.62)',
                        lineHeight: 1.5,
                        fontWeight: 400,
                      }}>
                        Store account information and transaction history on your device and our servers.
                      </p>
                    </div>

                    {/* Row 3 — Learn more */}
                    <button
                      onClick={() => setShowDetails(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '10px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '0.5px solid rgba(255,255,255,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <ChevronDown size={16} color="rgba(255,255,255,0.38)" />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>
                        Learn more about our privacy policy
                      </span>
                    </button>
                  </div>

                  {/* Legal text */}
                  <div style={{
                    margin: '14px 20px 0',
                    borderTop: '0.5px solid rgba(255,255,255,0.08)',
                    paddingTop: '14px',
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.30)',
                      lineHeight: 1.65,
                      maxHeight: '72px',
                      overflowY: 'auto',
                      paddingRight: '4px',
                    }}>
                      <p style={{ margin: '0 0 8px' }}>
                        Your personal data will be processed and information from your device may be stored, accessed, and shared with our licensed partners to deliver BadePay services.{' '}
                        Read our full <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: '#6fe8d6' }}>Privacy Policy</a>{' '}
                        and <a href="/terms" target="_blank" rel="noreferrer" style={{ color: '#6fe8d6' }}>Terms &amp; Conditions</a>.
                      </p>
                      <p style={{ margin: 0 }}>
                        We comply with the <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Nigeria Data Protection Regulation (NDPR) 2019</strong> and CBN Consumer Protection Framework.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    padding: '14px 20px 24px',
                    display: 'flex',
                    gap: '10px',
                  }}>
                    <button
                      onClick={() => setShowDetails(true)}
                      style={{
                        flex: 1,
                        padding: '13px 16px',
                        borderRadius: '100px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '0.5px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    >
                      Review policy
                    </button>
                    <button
                      onClick={onAccept}
                      style={{
                        flex: 1,
                        padding: '13px 16px',
                        borderRadius: '100px',
                        background: '#6fe8d6',
                        border: 'none',
                        color: '#0a0a0a',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#d0ff52')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#6fe8d6')}
                    >
                      <Check size={14} />
                      Accept
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ── Details View ── */
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}
                >
                  {/* Header */}
                  <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
                    <p style={{
                      margin: '0 0 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.13em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.35)',
                    }}>
                      Privacy Policy
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#ffffff',
                      lineHeight: 1.45,
                    }}>
                      How BadePay uses your data
                    </p>
                  </div>

                  {/* Expandable Section Cards */}
                  <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {SECTIONS.map(({ icon: Icon, title, content }, i) => (
                      <div
                        key={i}
                        onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: `0.5px solid ${expandedIndex === i ? 'rgba(111,232,214,0.25)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '16px',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => {
                          if (expandedIndex !== i)
                            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)';
                        }}
                        onMouseLeave={e => {
                          if (expandedIndex !== i)
                            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '13px 16px',
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(111,232,214,0.10)',
                            border: '0.5px solid rgba(111,232,214,0.20)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Icon size={14} color="#6fe8d6" />
                          </div>
                          <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>
                            {title}
                          </span>
                          <ChevronDown
                            size={14}
                            color="rgba(255,255,255,0.35)"
                            style={{
                              transform: expandedIndex === i ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.22s',
                              flexShrink: 0,
                            }}
                          />
                        </div>
                        <AnimatePresence initial={false}>
                          {expandedIndex === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <p style={{
                                margin: 0,
                                padding: '0 16px 14px',
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.45)',
                                lineHeight: 1.65,
                              }}>
                                {content}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  {/* NDPR note */}
                  <div style={{
                    margin: '12px 20px 0',
                    padding: '12px 14px',
                    background: 'rgba(111,232,214,0.04)',
                    border: '0.5px solid rgba(111,232,214,0.15)',
                    borderRadius: '14px',
                  }}>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.30)', lineHeight: 1.6 }}>
                      BadePay complies with the{' '}
                      <strong style={{ color: 'rgba(255,255,255,0.50)' }}>Nigeria Data Protection Regulation (NDPR) 2019</strong>{' '}
                      and the CBN Consumer Protection Framework. Declining will cancel account creation.
                    </p>
                  </div>

                  {/* Footer Buttons */}
                  <div style={{
                    margin: '0 20px',
                    borderTop: '0.5px solid rgba(255,255,255,0.08)',
                    padding: '14px 0 24px',
                    marginTop: '16px',
                    display: 'flex',
                    gap: '10px',
                  }}>
                    <button
                      onClick={() => setShowDetails(false)}
                      style={{
                        flex: 1,
                        padding: '13px 16px',
                        borderRadius: '100px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '0.5px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    >
                      Back
                    </button>
                    <button
                      onClick={onAccept}
                      style={{
                        flex: 1,
                        padding: '13px 16px',
                        borderRadius: '100px',
                        background: '#6fe8d6',
                        border: 'none',
                        color: '#0a0a0a',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#d0ff52')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#6fe8d6')}
                    >
                      <Check size={14} />
                      Accept & continue
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
