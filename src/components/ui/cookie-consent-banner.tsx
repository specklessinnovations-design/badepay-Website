

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, User, Laptop, ChevronDown } from 'lucide-react';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const consent = localStorage.getItem('badepay_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('badepay_cookie_consent', 'all');
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('badepay_cookie_consent', JSON.stringify(preferences));
    setIsVisible(false);
  };

  const togglePreference = (key: keyof typeof preferences) => {
    if (key === 'essential') return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
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
            onClick={() => setIsVisible(false)}
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
              onClick={() => setIsVisible(false)}
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
              {!showPreferences ? (
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
                      Welcome to BadePay
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#ffffff',
                      lineHeight: 1.45,
                    }}>
                      BadePay asks for your consent<br />to use your personal data to:
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
                        <User size={16} color="#6fe8d6" />
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.62)',
                        lineHeight: 1.5,
                        fontWeight: 400,
                      }}>
                        Personalised advertising and content measurement, audience research and services development.
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
                        <Laptop size={16} color="#6fe8d6" />
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.62)',
                        lineHeight: 1.5,
                        fontWeight: 400,
                      }}>
                        Store and/or access information on a device.
                      </p>
                    </div>

                    {/* Row 3 — Learn more */}
                    <button
                      onClick={() => setShowPreferences(true)}
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
                        Learn more
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
                      maxHeight: '80px',
                      overflowY: 'auto',
                      paddingRight: '4px',
                    }}>
                      <p style={{ margin: '0 0 8px' }}>
                        Your personal data will be processed and information from your device (cookies, unique
                        identifiers and other device data) may be stored by, accessed by and shared with our partners
                        or used specifically by this site. We and our partners may use precise geolocation data.{' '}
                        <span style={{ color: '#6fe8d6', cursor: 'pointer' }}>List of partners</span>.
                      </p>
                      <p style={{ margin: 0 }}>
                        Some vendors may process your personal data on the basis of legitimate interest, which you
                        can object to by managing your options below.
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
                      onClick={() => setShowPreferences(true)}
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
                      Manage options
                    </button>
                    <button
                      onClick={handleAcceptAll}
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
                      Consent
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ── Preferences View ── */
                <motion.div
                  key="prefs"
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
                      Privacy Preferences
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#ffffff',
                      lineHeight: 1.45,
                    }}>
                      Cookie Preferences
                    </p>
                  </div>

                  {/* Toggle Cards */}
                  <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Essential */}
                    <div style={{
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '0.5px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>Essential</span>
                            <span style={{
                              padding: '2px 8px',
                              background: 'rgba(111,232,214,0.10)',
                              color: '#6fe8d6',
                              fontSize: '9px',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              borderRadius: '20px',
                              border: '0.5px solid rgba(111,232,214,0.20)',
                            }}>Required</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                            Necessary for core functionality and security.
                          </p>
                        </div>
                        <div style={{
                          width: '42px',
                          height: '24px',
                          background: '#6fe8d6',
                          borderRadius: '100px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Check size={13} color="#0a0a0a" />
                        </div>
                      </div>
                    </div>

                    {/* Analytics */}
                    <div
                      onClick={() => togglePreference('analytics')}
                      style={{
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '0.5px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff', display: 'block', marginBottom: '3px' }}>Analytics</span>
                          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                            Help us improve by understanding user behaviour.
                          </p>
                        </div>
                        <div style={{
                          width: '42px',
                          height: '24px',
                          borderRadius: '100px',
                          background: preferences.analytics ? '#6fe8d6' : 'rgba(255,255,255,0.10)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                          flexShrink: 0,
                          transition: 'background 0.25s',
                        }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            background: '#ffffff',
                            borderRadius: '50%',
                            transition: 'transform 0.25s',
                            transform: preferences.analytics ? 'translateX(18px)' : 'translateX(0)',
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Marketing */}
                    <div
                      onClick={() => togglePreference('marketing')}
                      style={{
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '0.5px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff', display: 'block', marginBottom: '3px' }}>Marketing</span>
                          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                            Personalise ads and track campaign performance.
                          </p>
                        </div>
                        <div style={{
                          width: '42px',
                          height: '24px',
                          borderRadius: '100px',
                          background: preferences.marketing ? '#6fe8d6' : 'rgba(255,255,255,0.10)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                          flexShrink: 0,
                          transition: 'background 0.25s',
                        }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            background: '#ffffff',
                            borderRadius: '50%',
                            transition: 'transform 0.25s',
                            transform: preferences.marketing ? 'translateX(18px)' : 'translateX(0)',
                          }} />
                        </div>
                      </div>
                    </div>
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
                      onClick={() => setShowPreferences(false)}
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
                      onClick={handleSavePreferences}
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
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#d0ff52')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#6fe8d6')}
                    >
                      Save preferences
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