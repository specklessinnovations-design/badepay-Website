'use client';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft,
  Check, AlertCircle, ShieldCheck, Calendar, Globe, MapPin, ChevronDown, Search,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import authService from '@/services/authService';
import { PremiumInput } from '@/components/ui/premium-input';
import { PremiumButton } from '@/components/ui/premium-button';
import { bpToast } from '@/lib/bpToast';
import { getPostAuthPath } from '@/lib/authRouting';
import { PrivacyPolicyModal } from '@/components/ui/privacy-policy-modal';
import { ConsentModal } from '@/components/ui/consent-modal';

const STEPS = ['Email', 'Profile', 'Age', 'Location', 'Verify', 'Secure PIN'];

interface SignupData {
  email: string;
  otp: string[];
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  dob: string;
  pin: string;
  confirmPin: string;
  location: string;
}

const StepBubbles = ({ current }: { current: number }) => (
  <div className="flex items-center gap-0 mb-8">
    {STEPS.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1.5">
            <motion.div animate={{ scale: active ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 300 }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all duration-300"
              style={{
                background: done ? '#6fe8d6' : active ? 'rgba(111,232,214,0.15)' : 'var(--surface-secondary)',
                border: active ? '2px solid #6fe8d6' : done ? '2px solid #6fe8d6' : '2px solid var(--border)',
                color: done ? '#1a1a1a' : active ? '#6fe8d6' : 'var(--text-tertiary)',
                boxShadow: active ? '0 0 16px rgba(111,232,214,0.35)' : 'none',
              }}>
              {done ? <Check size={13} strokeWidth={3} /> : i + 1}
            </motion.div>
            <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:block"
              style={{ color: active ? '#6fe8d6' : done ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <motion.div className="h-full bg-[#6fe8d6]" animate={{ width: i < current ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
            </div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

function RegisterForm() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const { register, setPin, verifyOtp, isLoading: authLoading } = useAuthStore();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(42);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');

  const [data, setData] = useState<SignupData>({
    email: '', otp: ['', '', '', '', '', ''],
    firstName: '', lastName: '',
    password: '', confirmPassword: '', dob: '', pin: '', confirmPin: '',
    location: '',
  });

  // Dynamic Location selectors (Country → State → Place)
  const [countries, setCountries] = useState<{ name: string; code: string; flag: string; phoneCode: string }[]>([]);
  const [states, setStates] = useState<{ name: string; code: string }[]>([]);
  const [places, setPlaces] = useState<{ name: string }[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('');
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  // States for custom searchable dropdowns
  const [activeDropdown, setActiveDropdown] = useState<'country' | 'state' | 'place' | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [placeSearch, setPlaceSearch] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 3 && resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [step, resendTimer]);

  // Load countries when reaching Location step (step 3)
  useEffect(() => {
    if (step === 3 && countries.length === 0) {
      setLoadingCountries(true);
      fetch(`${API_BASE}/location/countries`)
        .then(r => r.json())
        .then(d => setCountries(d?.countries || []))
        .catch(() => setError('Failed to load countries. Check your connection.'))
        .finally(() => setLoadingCountries(false));
    }
  }, [step]);

  // Load countries for location step (step 3)
  // Note: resend timer still handles step 4 (OTP)
  useEffect(() => {
    if (step === 4 && resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [step, resendTimer]);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedState('');
    setSelectedPlace('');
    setStates([]);
    setPlaces([]);
    setCountrySearch('');
    if (!countryCode) return;
    setLoadingStates(true);
    fetch(`${API_BASE}/location/countries/${countryCode}/states`)
      .then(r => r.json())
      .then(d => setStates(d?.states || []))
      .catch(() => setError('Failed to load states.'))
      .finally(() => setLoadingStates(false));
  };

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode);
    setSelectedPlace('');
    setPlaces([]);
    setStateSearch('');
    if (!stateCode || !selectedCountry) return;
    setLoadingPlaces(true);
    fetch(`${API_BASE}/location/countries/${selectedCountry}/states/${stateCode}/places`)
      .then(r => r.json())
      .then(d => setPlaces(d?.places || []))
      .catch(() => setError('Failed to load cities.'))
      .finally(() => setLoadingPlaces(false));
  };

  const handleOtpChange = (index: number, value: string) => {
    const num = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...data.otp];
    newOtp[index] = num;
    setData(p => ({ ...p, otp: newOtp }));
    if (num && index < 5) otpInputs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !data.otp[index] && index > 0) {
      const newOtp = [...data.otp];
      newOtp[index - 1] = '';
      setData(p => ({ ...p, otp: newOtp }));
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    const newOtp = Array.from({ length: 6 }, (_, i) => digits[i] || '');
    setData(p => ({ ...p, otp: newOtp }));
    otpInputs.current[Math.min(digits.length - 1, 5)]?.focus();
  };

  const pwReqs = [
    { label: '6+ characters', ok: data.password.length >= 6 },
    { label: 'Passwords match', ok: data.password.length > 0 && data.password === data.confirmPassword },
  ];

  const handleNext = async () => {
    setError('');
    setLoading(true);
    try {
      if (step === 0) {
        if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          setError('Enter a valid email address');
          return;
        }
        if (!privacyAccepted) {
          setShowPrivacy(true);
          setLoading(false);
          return;
        }
        if (!consentAccepted) {
          setShowConsent(true);
          setLoading(false);
          return;
        }
      } else if (step === 1) {
        if (!data.firstName.trim()) { setError('First name is required'); return; }
        if (!data.lastName.trim()) { setError('Last name is required'); return; }
        if (data.password.length < 6) { setError('Password needs at least 6 characters'); return; }
        if (data.password !== data.confirmPassword) { setError("Passwords don't match"); return; }
      } else if (step === 2) {
        if (!data.dob) { setError('Please enter your date of birth'); return; }
        // Proper 18+ check using exact date (not just year)
        const birthDate = new Date(data.dob);
        const today = new Date();
        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        if (birthDate > eighteenYearsAgo) {
          setError('You must be 18 years or older to open an account');
          return;
        }
        // Just advance to location step
      } else if (step === 3) {
        // Location step — validate selection
        if (!selectedCountry) { setError('Please select a country'); return; }
        if (!selectedState) { setError('Please select a state / region'); return; }
        if (!selectedPlace) { setError('Please select a city'); return; }
        const countryObj = countries.find(c => c.code === selectedCountry);
        const stateObj = states.find(s => s.code === selectedState);
        const locationStr = `${selectedPlace}, ${stateObj?.name || selectedState}, ${countryObj?.name || selectedCountry} ${countryObj?.flag || ''}`;
        setData(p => ({ ...p, location: locationStr }));
        // Now register
        await register({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.trim().toLowerCase(),
          password: data.password,
          userType: 'consumer',
          location: locationStr,
        });
        setResendTimer(42);
        bpToast.success('Account created! Check your email for a verification code.');
      } else if (step === 4) {
        const code = data.otp.join('');
        if (code.length !== 6) { setError('Enter all 6 digits'); return; }
        await verifyOtp(code);
      } else if (step === 5) {
        if (!data.pin || data.pin.length !== 4) { setError('PIN must be exactly 4 digits'); return; }
        if (data.pin !== data.confirmPin) { setError("PINs don't match"); return; }
        try {
          await setPin(data.pin);
          bpToast.success(`Welcome to BadePay, ${data.firstName}! 🎉`);
          // Default to personal dashboard after registration
          navigate('/dashboard');
        } catch (err: any) {
          setError(err?.message || 'Failed to set PIN');
          return;
        }
        return;
      }
      await new Promise(r => setTimeout(r, 400));
      setStep(s => s + 1);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNumPad = (key: string, field: 'pin' | 'confirmPin') => {
    setError('');
    const current = field === 'pin' ? data.pin : data.confirmPin;
    if (key === '⌫') {
      setData(p => ({ ...p, [field]: current.slice(0, -1) }));
    } else if (current.length < 4) {
      const next = current + key;
      setData(p => ({ ...p, [field]: next }));
      if (next.length === 4) {
        if (field === 'pin') {
          setTimeout(() => setPinStep('confirm'), 300);
        } else {
          if (data.pin !== next) {
            setError("PINs don't match — try again");
            setTimeout(() => {
              setData(p => ({ ...p, confirmPin: '', pin: '' }));
              setPinStep('enter');
              setError('');
            }, 2000);
          }
        }
      }
    }
  };

  const numpad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  const isLoading = loading || authLoading;

  const handleNumPadClick = (key: string, field: 'pin' | 'confirmPin') => handleNumPad(key, field);

  const handlePrivacyAccept = async () => {
    setPrivacyAccepted(true);
    setShowPrivacy(false);
    await new Promise(r => setTimeout(r, 120));
    setShowConsent(true);
  };

  const handlePrivacyDecline = () => {
    setShowPrivacy(false);
    bpToast.error('You must accept the Privacy Policy to create an account.');
  };

  const handleConsentAccept = async () => {
    setConsentAccepted(true);
    setShowConsent(false);
    await new Promise(r => setTimeout(r, 120));
    await new Promise(r => setTimeout(r, 400));
    setStep(s => s + 1);
  };

  const handleConsentDecline = () => {
    setShowConsent(false);
    bpToast.error('You must accept the consent terms to continue.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="w-full">
      <PrivacyPolicyModal open={showPrivacy} onAccept={handlePrivacyAccept} onDecline={handlePrivacyDecline} />
      <ConsentModal open={showConsent} onAccept={handleConsentAccept} onDecline={handleConsentDecline} emailAddress={data.email} />

      {/* Back link */}
      <div className="mb-6 flex items-center justify-between">
        {step > 0 && step !== 4 ? (
          <button onClick={() => { setError(''); if (step === 5) { setPinStep('enter'); setData(p => ({ ...p, pin: '', confirmPin: '' })); } setStep(s => s - 1); }}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={15} /> Back
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={15} /> Home
          </Link>
        )}
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
          {step + 1} / {STEPS.length}
        </span>
      </div>

      {/* Step bubbles */}
      <StepBubbles current={step} />

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-start gap-3 rounded-2xl p-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle size={16} className="text-[#EF4444] shrink-0 mt-0.5" />
            <p className="text-sm text-[#EF4444] font-medium leading-relaxed">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>

          {/* ─── Step 0: Email ─── */}
          {step === 0 && (
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1.5">Your email address</h1>
              <p className="text-sm text-[var(--text-secondary)] mb-7">We'll send a verification code to this email.</p>
              <PremiumInput
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail size={15} />}
                value={data.email}
                onChange={e => { setData(p => ({ ...p, email: e.target.value })); setError(''); }}
                autoFocus
              />
            </div>
          )}

          {/* ─── Step 1: Profile ─── */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1.5">Create your profile</h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Use details matching your official ID.</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <PremiumInput label="First name" placeholder="Tunde" icon={<User size={15} />}
                    value={data.firstName} onChange={e => setData(p => ({ ...p, firstName: e.target.value }))} />
                  <PremiumInput label="Last name" placeholder="Adeyemi" icon={<User size={15} />}
                    value={data.lastName} onChange={e => setData(p => ({ ...p, lastName: e.target.value }))} />
                </div>

                <PremiumInput label="Password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password"
                  icon={<Lock size={15} />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors p-1">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                  value={data.password} onChange={e => setData(p => ({ ...p, password: e.target.value }))} />

                {data.password.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pwReqs.map(r => (
                      <div key={r.label} className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                        style={{ color: r.ok ? '#10B981' : 'var(--text-tertiary)' }}>
                        <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                          style={{ background: r.ok ? 'rgba(16,185,129,0.15)' : 'var(--surface-tertiary)' }}>
                          {r.ok && <Check size={8} strokeWidth={3} />}
                        </div>
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}

                <PremiumInput label="Confirm password" type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat password"
                  icon={<Lock size={15} />}
                  success={data.confirmPassword.length >= 8 && data.password === data.confirmPassword}
                  rightIcon={
                    <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors p-1">
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                  value={data.confirmPassword} onChange={e => setData(p => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
            </div>
          )}

          {/* ─── Step 2: Age Verification ─── */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1.5">Age Verification</h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Please enter your date of birth to verify you're 18 or older.</p>

              <div className="space-y-4">
                <PremiumInput
                  label="Date of birth"
                  type="date"
                  icon={<Calendar size={15} />}
                  value={data.dob}
                  onChange={e => setData(p => ({ ...p, dob: e.target.value }))}
                  max={(() => {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() - 18);
                    return d.toISOString().split('T')[0];
                  })()}
                />

                <div className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                  <ShieldCheck size={16} className="text-[#6fe8d6] shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    You must be at least 18 years old to use BadePay. Your date of birth is used for age verification only.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 3: Location Selection ─── */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1.5">Where are you located?</h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Select your country, state, and city to personalise your experience.
              </p>

              {loadingCountries ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 border-2 border-[#6fe8d6] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 relative">
                  {/* Backdrop to close active dropdowns on click outside */}
                  {activeDropdown && (
                    <div className="fixed inset-0 z-10 cursor-default" onClick={() => setActiveDropdown(null)} />
                  )}

                  {/* Country Dropdown */}
                  <div className="relative z-20">
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>Country</label>
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(p => p === 'country' ? null : 'country')}
                      className="w-full flex items-center gap-3 h-12 px-4 rounded-2xl transition-all duration-200 text-left border"
                      style={{
                        background: 'var(--surface-secondary)',
                        borderColor: activeDropdown === 'country' ? '#6fe8d6' : 'var(--border)',
                        boxShadow: activeDropdown === 'country' ? '0 0 10px rgba(111,232,214,0.15)' : 'none',
                      }}
                    >
                      <Globe size={15} style={{ color: 'var(--text-tertiary)' }} className="shrink-0" />
                      <span className="flex-1 text-sm font-semibold truncate" style={{ color: selectedCountry ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                        {selectedCountry ? (
                          <span className="flex items-center gap-2">
                            <img
                              src={`https://flagcdn.com/w40/${selectedCountry.toLowerCase()}.png`}
                              alt={selectedCountry}
                              className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                            />
                            <span>{countries.find(c => c.code === selectedCountry)?.name}</span>
                          </span>
                        ) : (
                          'Select country...'
                        )}
                      </span>
                      <ChevronDown size={14} className="shrink-0 transition-transform duration-200" style={{ color: 'var(--text-tertiary)', transform: activeDropdown === 'country' ? 'rotate(180deg)' : 'none' }} />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === 'country' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 mt-2 p-2 rounded-2xl z-30 shadow-2xl border"
                          style={{ background: 'var(--surface-primary)', borderColor: 'var(--border)' }}
                        >
                          <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] mb-2">
                            <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={e => setCountrySearch(e.target.value)}
                              placeholder="Search country..."
                              className="w-full bg-transparent text-sm focus:outline-none"
                              style={{ color: 'var(--text-primary)' }}
                              autoFocus
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                            {countries
                              .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                              .map(c => (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => { handleCountryChange(c.code); setActiveDropdown(null); }}
                                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors hover:bg-[var(--surface-secondary)]"
                                >
                                  <span className="truncate flex items-center" style={{ color: 'var(--text-primary)' }}>
                                    <img
                                      src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                                      alt={c.name}
                                      className="inline-block w-5 h-3.5 object-cover rounded-sm shadow-sm mr-2.5"
                                    />
                                    {c.name}
                                  </span>
                                  {selectedCountry === c.code && <Check size={14} className="text-[#6fe8d6]" />}
                                </button>
                              ))}
                            {countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
                              <p className="text-center py-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>No countries found</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* State Dropdown */}
                  {selectedCountry && (
                    <div className="relative z-10">
                      <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>State / Region</label>
                      {loadingStates ? (
                        <div className="flex-1 flex items-center gap-3 h-12 px-4 rounded-2xl" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                          <div className="h-4 w-4 border-2 border-[#6fe8d6] border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading states...</span>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(p => p === 'state' ? null : 'state')}
                            className="w-full flex items-center gap-3 h-12 px-4 rounded-2xl transition-all duration-200 text-left border"
                            style={{
                              background: 'var(--surface-secondary)',
                              borderColor: activeDropdown === 'state' ? '#6fe8d6' : 'var(--border)',
                              boxShadow: activeDropdown === 'state' ? '0 0 10px rgba(111,232,214,0.15)' : 'none',
                            }}
                          >
                            <MapPin size={15} style={{ color: 'var(--text-tertiary)' }} className="shrink-0" />
                            <span className="flex-1 text-sm font-semibold truncate" style={{ color: selectedState ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                              {selectedState
                                ? states.find(s => s.code === selectedState)?.name
                                : 'Select state...'}
                            </span>
                            <ChevronDown size={14} className="shrink-0 transition-transform duration-200" style={{ color: 'var(--text-tertiary)', transform: activeDropdown === 'state' ? 'rotate(180deg)' : 'none' }} />
                          </button>

                          <AnimatePresence>
                            {activeDropdown === 'state' && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 right-0 mt-2 p-2 rounded-2xl z-30 shadow-2xl border"
                                style={{ background: 'var(--surface-primary)', borderColor: 'var(--border)' }}
                              >
                                <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] mb-2">
                                  <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
                                  <input
                                    type="text"
                                    value={stateSearch}
                                    onChange={e => setStateSearch(e.target.value)}
                                    placeholder="Search state..."
                                    className="w-full bg-transparent text-sm focus:outline-none"
                                    style={{ color: 'var(--text-primary)' }}
                                    autoFocus
                                  />
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                                  {states
                                    .filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()))
                                    .map(s => (
                                      <button
                                        key={s.code}
                                        type="button"
                                        onClick={() => { handleStateChange(s.code); setActiveDropdown(null); }}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors hover:bg-[var(--surface-secondary)]"
                                      >
                                        <span className="truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                                        {selectedState === s.code && <Check size={14} className="text-[#6fe8d6]" />}
                                      </button>
                                    ))}
                                  {states.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase())).length === 0 && (
                                    <p className="text-center py-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>No states found</p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  )}

                  {/* City Dropdown */}
                  {selectedState && (
                    <div className="relative z-10">
                      <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>City / Area</label>
                      {loadingPlaces ? (
                        <div className="flex-1 flex items-center gap-3 h-12 px-4 rounded-2xl" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                          <div className="h-4 w-4 border-2 border-[#6fe8d6] border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading cities...</span>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(p => p === 'place' ? null : 'place')}
                            className="w-full flex items-center gap-3 h-12 px-4 rounded-2xl transition-all duration-200 text-left border"
                            style={{
                              background: 'var(--surface-secondary)',
                              borderColor: activeDropdown === 'place' ? '#6fe8d6' : 'var(--border)',
                              boxShadow: activeDropdown === 'place' ? '0 0 10px rgba(111,232,214,0.15)' : 'none',
                            }}
                          >
                            <MapPin size={15} style={{ color: 'var(--text-tertiary)' }} className="shrink-0" />
                            <span className="flex-1 text-sm font-semibold truncate" style={{ color: selectedPlace ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                              {selectedPlace || 'Select city...'}
                            </span>
                            <ChevronDown size={14} className="shrink-0 transition-transform duration-200" style={{ color: 'var(--text-tertiary)', transform: activeDropdown === 'place' ? 'rotate(180deg)' : 'none' }} />
                          </button>

                          <AnimatePresence>
                            {activeDropdown === 'place' && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 right-0 mt-2 p-2 rounded-2xl z-30 shadow-2xl border"
                                style={{ background: 'var(--surface-primary)', borderColor: 'var(--border)' }}
                              >
                                <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] mb-2">
                                  <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
                                  <input
                                    type="text"
                                    value={placeSearch}
                                    onChange={e => setPlaceSearch(e.target.value)}
                                    placeholder="Search city..."
                                    className="w-full bg-transparent text-sm focus:outline-none"
                                    style={{ color: 'var(--text-primary)' }}
                                    autoFocus
                                  />
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                                  {places
                                    .filter(p => p.name.toLowerCase().includes(placeSearch.toLowerCase()))
                                    .map(p => (
                                      <button
                                        key={p.name}
                                        type="button"
                                        onClick={() => { setSelectedPlace(p.name); setActiveDropdown(null); setError(''); }}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors hover:bg-[var(--surface-secondary)]"
                                      >
                                        <span className="truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                                        {selectedPlace === p.name && <Check size={14} className="text-[#6fe8d6]" />}
                                      </button>
                                    ))}
                                  {places.filter(p => p.name.toLowerCase().includes(placeSearch.toLowerCase())).length === 0 && (
                                    <p className="text-center py-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>No cities found</p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  )}

                  {selectedCountry && selectedState && selectedPlace && (
                    <motion.div
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{ background: 'rgba(111,232,214,0.06)', border: '1px solid rgba(111,232,214,0.2)' }}
                    >
                      <MapPin size={14} className="text-[#6fe8d6] shrink-0" />
                      <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <span>
                          {selectedPlace}, {states.find(s => s.code === selectedState)?.name}, {countries.find(c => c.code === selectedCountry)?.name}
                        </span>
                        <img
                          src={`https://flagcdn.com/w40/${selectedCountry.toLowerCase()}.png`}
                          alt={selectedCountry}
                          className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                        />
                      </p>
                    </motion.div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* ─── Step 4: OTP ─── */}
          {step === 4 && (
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1.5">Verify your email</h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                We sent a welcome email and 6-digit code to{' '}
                <span className="font-semibold text-[var(--text-primary)]">{data.email}</span>
              </p>

              <div className="flex justify-between gap-2 mb-5" onPaste={handleOtpPaste}>
                {data.otp.map((digit, i) => (
                  <input key={i}
                    ref={el => { otpInputs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-12 h-11 flex-shrink-0 text-center text-lg font-black rounded-xl focus:outline-none font-mono transition-all duration-200"
                    style={{
                      background: digit ? 'rgba(111,232,214,0.08)' : 'var(--surface-secondary)',
                      border: `2px solid ${digit ? 'var(--accent-text)' : 'var(--border)'}`,
                      color: 'var(--text-primary)',
                    }}
                    placeholder="·"
                  />
                ))}
              </div>

              <div className="text-center">
                <button type="button" disabled={resendTimer > 0}
                  onClick={async () => {
                    setResendTimer(42);
                    try {
                      await authService.resendOTP(data.email);
                      bpToast.success('New code sent to your email!');
                    } catch {
                      bpToast.error('Failed to resend code');
                    }
                  }}
                  className="text-sm font-semibold transition-colors"
                  style={{ color: resendTimer > 0 ? 'var(--text-tertiary)' : 'var(--accent-text)' }}>
                  {resendTimer > 0 ? `Resend in 0:${resendTimer.toString().padStart(2, '0')}` : 'Resend code'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 5: PIN ─── */}
          {step === 5 && (
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1.5">
                {pinStep === 'enter' ? 'Create transaction PIN' : 'Confirm your PIN'}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-8">
                {pinStep === 'enter' ? 'Your 4-digit PIN authorizes all transactions.' : 'Re-enter your PIN to confirm.'}
              </p>

              {/* PIN dots */}
              <div className="flex gap-3 justify-center mb-8">
                {Array.from({ length: 4 }).map((_, i) => {
                  const current = pinStep === 'enter' ? data.pin : data.confirmPin;
                  const filled = i < current.length;
                  return (
                    <motion.div key={i} animate={{ scale: filled ? 1.15 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="w-4 h-4 rounded-full transition-all duration-200"
                      style={{
                        background: filled ? '#6fe8d6' : 'var(--surface-tertiary)',
                        border: filled ? 'none' : '2px solid var(--border)',
                        boxShadow: filled ? '0 0 12px rgba(111,232,214,0.5)' : 'none',
                      }} />
                  );
                })}
              </div>

              {/* Step indicator */}
              <div className="flex gap-2 justify-center mb-8">
                {[0, 1].map(i => (
                  <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: (pinStep === 'enter' ? i === 0 : i === 1) ? '2rem' : '0.75rem',
                      background: (pinStep === 'enter' ? i === 0 : i === 1) ? '#6fe8d6' : 'var(--border)',
                    }} />
                ))}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3">
                {numpad.map((key, idx) => (
                  <button key={idx} type="button"
                    onClick={() => handleNumPadClick(key, pinStep === 'enter' ? 'pin' : 'confirmPin')}
                    disabled={key === ''}
                    className={`h-16 rounded-2xl text-xl font-black transition-all duration-150 active:scale-95 ${key === '' ? 'cursor-default invisible'
                      : key === '⌫' ? 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
                        : 'hover:bg-[var(--surface-secondary)]'
                      }`}
                    style={key !== '' && key !== '⌫' ? { background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } : {}}>
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Next button — hidden on pin step (uses numpad) */}
      {step < 5 && (
        <div className="mt-8">
          <PremiumButton type="button" fullWidth size="lg" onClick={handleNext} isLoading={isLoading} disabled={isLoading}>
            {!isLoading && <>{step === 1 ? 'Continue' : step === 2 ? 'Verify Age' : step === 3 ? 'Continue' : step === 4 ? 'Verify email' : 'Continue'} <ArrowRight size={17} /></>}
          </PremiumButton>
        </div>
      )}

      {step === 5 && (
        <PremiumButton type="button" fullWidth size="lg" className="mt-8"
          onClick={handleNext} isLoading={isLoading}
          disabled={isLoading || data.pin.length !== 4 || data.confirmPin.length !== 4}>
          {!isLoading && <>Finish setup <ArrowRight size={17} /></>}
        </PremiumButton>
      )}

      {/* Sign in link */}
      {step === 0 && (
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link href="/login" className="font-bold transition-colors hover:opacity-80" style={{ color: 'var(--accent-text)' }}>Sign in</Link>
        </p>
      )}

      {/* Security badge */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-8 flex items-center justify-center gap-2">
        <ShieldCheck size={13} className="text-[var(--text-tertiary)]" />
        <p className="text-xs text-[var(--text-tertiary)]">Bank-grade encryption · Your data is safe</p>
      </motion.div>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6fe8d6] border-t-transparent" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
