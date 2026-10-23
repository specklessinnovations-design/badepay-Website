'use client';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft,
  Check, AlertCircle, ShieldCheck, Globe, MapPin, ChevronDown, Search, Phone,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import authService from '@/services/authService';
import apiClient from '@/lib/apiClient';
import { PremiumInput } from '@/components/ui/premium-input';
import { PremiumButton } from '@/components/ui/premium-button';
import { bpToast } from '@/lib/bpToast';
import { getPostAuthPath } from '@/lib/authRouting';
import { PrivacyPolicyModal } from '@/components/ui/privacy-policy-modal';
import { ConsentModal } from '@/components/ui/consent-modal';

const STEPS = ['Email', 'Verify', 'Profile', 'Location', 'Secure PIN'];
// The email is proven before anything else and the account is created last. The date of birth is
// not asked here: it's entered with the BVN, checked against the BVN record and saved from it.
const S = { email: 0, verify: 1, profile: 2, location: 3, pin: 4 } as const;

/** Same rules as the backend's password check. */
const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: '8+ characters', test: p => p.length >= 8 },
  { label: 'Upper & lower case', test: p => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { label: 'A number', test: p => /[0-9]/.test(p) },
  { label: 'A symbol', test: p => /[^A-Za-z0-9]/.test(p) },
];

/** PINs that are too easy to guess (repeated digits, runs like 1234 / 4321). */
function weakPin(pin: string): boolean {
  if (/^(\d)\1{3}$/.test(pin)) return true;
  const d = pin.split('').map(Number);
  const steps = d.slice(1).map((x, i) => x - d[i]);
  return steps.every(x => x === 1) || steps.every(x => x === -1);
}

interface SignupData {
  email: string;
  otp: string[];
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
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
  // From "Register your business": a personal account first (same as the app), then the business setup.
  const isMerchant = searchParams.get('role') === 'merchant';
  const { register, isLoading: authLoading } = useAuthStore();
  /** Proof the email was verified (from the emailed code); the backend won't create the account without it. */
  const [emailProof, setEmailProof] = useState('');
  const [pilotMessage, setPilotMessage] = useState<string | null>(null);

  useEffect(() => {
    authService.pilot().then(p => { if (p.inviteOnly) setPilotMessage(p.message ?? 'RCCGPay is invite-only during our pilot.'); }).catch(() => {});
  }, []);

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
    firstName: '', lastName: '', phone: '',
    password: '', confirmPassword: '', pin: '', confirmPin: '',
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


  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  // Load countries when reaching the Location step
  useEffect(() => {
    if (step === S.location && countries.length === 0) {
      setLoadingCountries(true);
      apiClient.get('/location/countries')
        .then(d => setCountries(d?.data?.countries || []))
        .catch(() => setError('Failed to load countries. Check your connection.'))
        .finally(() => setLoadingCountries(false));
    }
  }, [step]);

  // Resend countdown on the email code step
  useEffect(() => {
    if (step === S.verify && resendTimer > 0) {
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
    apiClient.get(`/location/countries/${countryCode}/states`)
      .then(d => setStates(d?.data?.states || []))
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
    apiClient.get(`/location/countries/${selectedCountry}/states/${stateCode}/places`)
      .then(d => setPlaces(d?.data?.places || []))
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
    ...PASSWORD_RULES.map(r => ({ label: r.label, ok: r.test(data.password) })),
    { label: 'Passwords match', ok: data.password.length > 0 && data.password === data.confirmPassword },
  ];
  const email = data.email.trim().toLowerCase();

  /** Step 1: the email must be new; then a 6-digit code is emailed. */
  const sendCode = async () => {
    setError('');
    setLoading(true);
    try {
      if (await authService.checkEmail(email)) {
        setError('This email is already registered. Please sign in instead.');
        return;
      }
      setEmailProof(''); // a new email needs its own verification
      await authService.sendOTP(email);
      setData(p => ({ ...p, otp: ['', '', '', '', '', ''] }));
      setResendTimer(42);
      setStep(S.verify);
    } catch (err: any) {
      setError(err?.message || 'We could not send a code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  /** Last step: create the account (with the PIN) and sign in. */
  const createAccount = async (pin: string) => {
    setError('');
    setLoading(true);
    try {
      await register({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email,
        phone: data.phone.replace(/\s/g, ''),
        password: data.password,
        userType: 'consumer',
        location: data.location,
        pin,
        emailVerificationToken: emailProof,
      });
      bpToast.success(`Welcome to RCCGPay, ${data.firstName.trim()}!`);
      // Remember the business sign-up through BVN verification (the flag in the URL can be lost on redirects).
      try { if (isMerchant) sessionStorage.setItem('bp_then_merchant', '1'); } catch { /* storage blocked */ }
      navigate(isMerchant ? '/verify-bvn?then=merchant' : '/verify-bvn');
    } catch (err: any) {
      const message = err?.message || 'Could not create your account. Try again.';
      // The email proof lasts 30 minutes: if it lapsed, send a fresh code and ask for it again.
      if (/verif/i.test(message)) {
        setEmailProof('');
        setData(p => ({ ...p, pin: '', confirmPin: '', otp: ['', '', '', '', '', ''] }));
        setPinStep('enter');
        await authService.sendOTP(email).catch(() => {});
        setResendTimer(42);
        setStep(S.verify);
        setError('Your email verification expired. We sent a new code. Enter it to finish.');
      } else {
        setData(p => ({ ...p, pin: '', confirmPin: '' }));
        setPinStep('enter');
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setError('');
    if (step === S.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address'); return; }
      if (!privacyAccepted) { setShowPrivacy(true); return; }
      if (!consentAccepted) { setShowConsent(true); return; }
      await sendCode();
    } else if (step === S.verify) {
      const code = data.otp.join('');
      if (code.length !== 6) { setError('Enter all 6 digits'); return; }
      setLoading(true);
      try {
        setEmailProof(await authService.confirmSignupEmail(email, code));
        setStep(S.profile);
      } catch (err: any) {
        setError(err?.message || 'That code didn’t work. Check it or request a new one.');
      } finally {
        setLoading(false);
      }
    } else if (step === S.profile) {
      if (data.firstName.trim().length < 2) { setError('First name is required'); return; }
      if (data.lastName.trim().length < 2) { setError('Last name is required'); return; }
      if (data.phone.replace(/\D/g, '').length < 10) { setError('Enter your phone number'); return; }
      const broken = PASSWORD_RULES.find(r => !r.test(data.password));
      if (broken) { setError(`Password needs: ${broken.label.toLowerCase()}`); return; }
      if (data.password !== data.confirmPassword) { setError("Passwords don't match"); return; }
      setStep(S.location);
    } else if (step === S.location) {
      if (!selectedCountry) { setError('Please select a country'); return; }
      if (!selectedState) { setError('Please select a state / region'); return; }
      if (!selectedPlace) { setError('Please select a city'); return; }
      const countryObj = countries.find(c => c.code === selectedCountry);
      const stateObj = states.find(s => s.code === selectedState);
      setData(p => ({ ...p, location: `${selectedPlace}, ${stateObj?.name || selectedState}, ${countryObj?.name || selectedCountry}` }));
      setStep(S.pin);
    } else if (step === S.pin) {
      if (data.pin.length !== 4 || data.pin !== data.confirmPin) { setError("PINs don't match"); return; }
      await createAccount(data.pin);
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
          if (weakPin(next)) {
            setError('Choose a less obvious PIN');
            setTimeout(() => setData(p => ({ ...p, pin: '' })), 600);
            return;
          }
          setTimeout(() => setPinStep('confirm'), 300);
        } else {
          if (data.pin === next) {
            void createAccount(next);
          } else {
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
    await sendCode();
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
        {step > 0 ? (
          <button onClick={() => { setError(''); if (step === S.pin) { setPinStep('enter'); setData(p => ({ ...p, pin: '', confirmPin: '' })); } setStep(s => (s === S.profile ? S.email : s - 1)); }}
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
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1.5">{isMerchant ? 'Register your business' : 'Your email address'}</h1>
              {isMerchant && <p className="text-sm text-[var(--text-secondary)] mb-2">First your own account (you’ll sign in with it), then your business details.</p>}
              <p className="text-sm text-[var(--text-secondary)] mb-7">We'll send a verification code to this email.</p>
              {pilotMessage && (
                <p className="mb-5 rounded-2xl px-4 py-3 text-xs" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{pilotMessage}</p>
              )}
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

          {/* ─── Profile ─── */}
          {step === S.profile && (
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

                <PremiumInput label="Phone number" type="tel" placeholder="080 1234 5678" icon={<Phone size={15} />}
                  autoComplete="tel" value={data.phone} onChange={e => setData(p => ({ ...p, phone: e.target.value }))} />

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

          {/* ─── Location Selection ─── */}
          {step === S.location && (
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

          {/* ─── Email code ─── */}
          {step === S.verify && (
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1.5">Verify your email</h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                We sent a 6-digit code to{' '}
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
                      await authService.resendOTP(email);
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

          {/* ─── PIN ─── */}
          {step === S.pin && (
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
      {step < S.pin && (
        <div className="mt-8">
          <PremiumButton type="button" fullWidth size="lg" onClick={handleNext} isLoading={isLoading} disabled={isLoading}>
            {!isLoading && <>{step === S.email ? 'Send code' : step === S.verify ? 'Verify email' : 'Continue'} <ArrowRight size={17} /></>}
          </PremiumButton>
        </div>
      )}

      {step === S.pin && (
        <PremiumButton type="button" fullWidth size="lg" className="mt-8"
          onClick={handleNext} isLoading={isLoading}
          disabled={isLoading || data.pin.length !== 4 || data.confirmPin.length !== 4}>
          {!isLoading && <>Create account <ArrowRight size={17} /></>}
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
