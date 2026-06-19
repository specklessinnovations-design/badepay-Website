import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Shield, KeyRound, Fingerprint, Smartphone,
  FileCheck, FileText, Store, Bell, Moon, HelpCircle, LogOut,
  Zap, Camera, Sun, Check,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCardStore } from '@/store/useCardStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { ThemeContext } from '@/contexts/ThemeContext';
import { deriveUsername, getKycTierInfo, formatDisplayName } from '@/lib/personalHelpers';
import { bpToast } from '@/lib/bpToast';

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, logout, enableBiometric, disableBiometric, syncUserFromStorage, upgradeToMerchant, updateProfile } = useAuthStore();
  const cards = useCardStore(s => s.cards);
  const activeCards = cards.filter(c => c.status === 'active').length;
  const { trustedDevices, ensureCurrentDevice, pushNotifications, smsNotifications, emailNotifications } = usePreferencesStore();
  const themeContext = React.useContext(ThemeContext);
  const { theme, toggleTheme } = themeContext || { theme: 'light' as const, toggleTheme: () => {} };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    ensureCurrentDevice();
    syncUserFromStorage();
  }, [ensureCurrentDevice, syncUserFromStorage]);

  if (!user) return null;

  const handle = deriveUsername(user.firstName, user.username);
  const displayName = formatDisplayName(user.firstName, user.lastName);
  const kyc = getKycTierInfo(user.kycLevel);
  const biometricOn = user.biometricEnabled ?? false;
  const notificationsOn = pushNotifications && smsNotifications && emailNotifications;
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { bpToast.error('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await updateProfile({ avatar: base64 });
        bpToast.success('Profile photo updated!');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      bpToast.error('Could not update photo');
      setUploading(false);
    }
  };

  const handleBecomeMerchant = async () => {
    try {
      await upgradeToMerchant();
      navigate('/merchant/onboarding');
    } catch {
      bpToast.error('Could not start merchant setup');
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const toggleBiometric = () => {
    if (biometricOn) { disableBiometric(); bpToast.success('Biometric login disabled'); }
    else { enableBiometric(); bpToast.success('Biometric login enabled'); }
  };

  return (
    <div className="pb-24 lg:pb-8">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      {/* ── Cover + Avatar hero ── */}
      <div className="relative -mx-4 lg:-mx-0 lg:rounded-3xl overflow-hidden mb-16"
        style={{ height: 140, background: 'linear-gradient(135deg, #0d2b2b 0%, #0a3d35 40%, #062e27 100%)' }}>
        {/* Mesh orbs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(111,232,214,0.5) 0%, transparent 65%)' }} />
        <div className="pointer-events-none absolute left-1/4 bottom-0 h-32 w-32 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(111,232,214,0.4) 0%, transparent 65%)' }} />
        {/* Grid dots */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Edit profile link — top right */}
        <Link href="/profile/edit"
          className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white/80 transition-all hover:text-white"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
          Edit profile
        </Link>
      </div>

      {/* ── Avatar (overlapping cover) ── */}
      <div className="relative -mt-28 mb-4 flex flex-col items-center lg:items-start lg:flex-row lg:gap-5 lg:items-end px-4 lg:px-0">
        <div className="relative mb-3 lg:mb-0">
          <motion.button type="button" onClick={() => fileInputRef.current?.click()}
            whileTap={{ scale: 0.97 }}
            className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] text-2xl font-black text-[#1a1a1a] ring-4 ring-[var(--background)]"
            style={{
              background: user.avatar ? 'transparent' : 'linear-gradient(135deg, #6fe8d6 0%, #4dd4c0 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}>
            {user.avatar
              ? <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
              : <span>{initials || '?'}</span>
            }
            {/* Camera overlay */}
            <motion.div
              initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-[1.5rem]"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}>
              {uploading
                ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : <Camera size={18} color="white" />
              }
              <span className="text-[9px] font-bold text-white">Change</span>
            </motion.div>
          </motion.button>
          {/* Camera badge */}
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#6fe8d6] shadow-md">
            <Camera size={13} color="#1a1a1a" strokeWidth={2.5} />
          </button>
        </div>

        {/* Name block */}
        <div className="text-center lg:text-left pb-1">
          <h1 className="text-xl font-black text-white leading-tight">{displayName}</h1>
          <p className="text-sm text-white/70">@{handle}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
            <div className="h-1.5 w-1.5 rounded-full bg-[#10B981]" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
            <span className="text-xs font-bold text-[#10B981]">Tier {user.kycLevel} · {kyc.label}</span>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-px mb-6 overflow-hidden rounded-2xl"
        style={{ background: 'var(--border)' }}>
        {[
          { label: 'KYC Tier', value: `T${user.kycLevel}`, color: '#6fe8d6' },
          { label: 'Active cards', value: String(activeCards), color: '#10B981' },
          { label: 'Devices', value: String(trustedDevices.length || 1), color: '#3B82F6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-0.5 py-4"
            style={{ background: 'var(--card)' }}>
            <span className="text-2xl font-black" style={{ color }}>{value}</span>
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Account info strip ── */}
      <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Phone" value={user.phone || '—'} />
        {user.accountNumber && <InfoRow label="Account no." value={user.accountNumber} mono />}
      </div>

      {/* ── Security ── */}
      <SectionLabel>Security</SectionLabel>
      <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <NavRow href="/profile/security" icon={Shield} label="Security center" sub="2FA, devices, login history" />
        <NavRow href="/set-pin" icon={KeyRound} label="Transaction PIN"
          sub={user.transactionPin ? 'Configured' : 'Not set'}
          badge={!user.transactionPin ? { text: 'Setup needed', color: '#EF4444' } : undefined} />
        <ToggleRow icon={Fingerprint} label="Face ID & fingerprint"
          sub={biometricOn ? 'Enabled' : 'Tap to enable'} on={biometricOn} onToggle={toggleBiometric} />
        <NavRow href="/profile/devices" icon={Smartphone} label="Trusted devices"
          sub={`${trustedDevices.length || 1} device${trustedDevices.length !== 1 ? 's' : ''} trusted`} />
      </div>

      {/* ── Compliance ── */}
      <SectionLabel>Compliance</SectionLabel>
      <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <NavRow href="/profile/kyc" icon={FileCheck} label="KYC verification"
          sub={`Tier ${user.kycLevel} · ${kyc.access}`}
          badge={user.kycLevel < 2 ? { text: 'Upgrade', color: '#6fe8d6' } : undefined} />
        <NavRow href="/profile/statements" icon={FileText} label="Statements & receipts" sub="PDF · CSV · audit ready" />
      </div>

      {/* ── Merchant ── */}
      {user.userType !== 'merchant' && (
        <>
          <SectionLabel>Business</SectionLabel>
          <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <button type="button" onClick={handleBecomeMerchant}
              className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[var(--surface-secondary)] active:bg-[var(--surface-secondary)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'rgba(111,232,214,0.08)', border: '1px solid rgba(111,232,214,0.14)' }}>
                <Store size={18} style={{ color: '#6fe8d6' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-[var(--text-primary)]">Become a merchant</p>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-[#6fe8d6]"
                    style={{ background: 'rgba(111,232,214,0.1)' }}>New</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Accept QR payments, settle daily</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />
            </button>
          </div>
        </>
      )}

      {/* ── App preferences ── */}
      <SectionLabel>Preferences</SectionLabel>
      <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <NavRow href="/profile/notifications" icon={Bell} label="Notifications"
          sub={notificationsOn ? 'Push, SMS and email on' : 'Some channels off'} />
        <ToggleRow icon={theme === 'dark' ? Moon : Sun} label="Dark mode"
          sub={theme === 'dark' ? 'Dark theme active' : 'Light theme active'}
          on={theme === 'dark'} onToggle={toggleTheme} />
        <NavRow href="/profile/support" icon={HelpCircle} label="Help & support" sub="24/7 chat with a banker" />
      </div>

      {/* ── Sign out ── */}
      <motion.button type="button" onClick={handleLogout}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 font-bold text-[#EF4444]"
        style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
        <LogOut size={17} />
        Sign out
      </motion.button>

      <p className="text-center text-xs text-[var(--text-tertiary)]">
        BadePay v1.0 · Licensed under CBN regulation
      </p>
    </div>
  );
}

/* ── Shared sub-components ────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
      {children}
    </p>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs font-semibold text-[var(--text-tertiary)] shrink-0 w-24">{label}</span>
      <span className={`text-sm font-medium text-[var(--text-primary)] text-right truncate ${mono ? 'font-mono tracking-wider' : ''}`}>{value}</span>
    </div>
  );
}

function NavRow({ href, icon: Icon, label, sub, badge }: {
  href: string; icon: React.ElementType; label: string; sub: string;
  badge?: { text: string; color: string };
}) {
  return (
    <Link href={href}
      className="flex items-center gap-3.5 px-4 py-3.5 border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--surface-secondary)] active:bg-[var(--surface-secondary)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'rgba(111,232,214,0.07)', border: '1px solid rgba(111,232,214,0.12)' }}>
        <Icon size={17} style={{ color: 'var(--accent-text)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
          {badge && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: `${badge.color}15`, color: badge.color }}>{badge.text}</span>
          )}
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{sub}</p>
      </div>
      <ChevronRight size={15} className="shrink-0 text-[var(--text-tertiary)]" />
    </Link>
  );
}

function ToggleRow({ icon: Icon, label, sub, on, onToggle }: {
  icon: React.ElementType; label: string; sub: string; on: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 border-b border-[var(--border)] last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'rgba(111,232,214,0.07)', border: '1px solid rgba(111,232,214,0.12)' }}>
        <Icon size={17} style={{ color: 'var(--accent-text)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{sub}</p>
      </div>
      <button type="button" role="switch" aria-checked={on} onClick={onToggle}
        className="relative shrink-0 h-6 w-11 rounded-full transition-all duration-300"
        style={{ background: on ? '#6fe8d6' : 'var(--surface-tertiary)', boxShadow: on ? '0 0 10px rgba(111,232,214,0.3)' : 'none' }}>
        <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300"
          style={{ transform: on ? 'translateX(21px)' : 'translateX(2px)' }} />
      </button>
    </div>
  );
}
