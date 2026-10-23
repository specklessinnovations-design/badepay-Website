import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Flag,
  ChevronRight, Shield, KeyRound,
  FileCheck, FileText, Store, Bell, Moon, HelpCircle, LogOut,
  Camera, Sun, Wallet, Eye, EyeOff, Copy, Check, Plus, Send, PiggyBank, ShieldCheck, QrCode
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCardStore } from '@/store/useCardStore';
import { ThemeContext } from '@/contexts/ThemeContext';
import { bpToast } from '@/lib/bpToast';
import apiClient from '@/lib/apiClient';
import { uploadFile } from '@/lib/uploads';
import { resizeImage } from '@/lib/resizeImage';
import walletService from '@/services/walletService';

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, logout, syncUserFromStorage, upgradeToMerchant, updateProfile } = useAuthStore();
  const cards = useCardStore(s => s.cards);
  const activeCards = cards.filter(c => c.status === 'active').length;
  const themeContext = React.useContext(ThemeContext);
  const { theme, toggleTheme } = themeContext || { theme: 'light' as const, toggleTheme: () => {} };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [balance, setBalance] = useState(user?.balance || 0);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    syncUserFromStorage();
    const loadBalance = async () => {
      try {
        const balanceData = await walletService.getBalance();
        setBalance(balanceData.balance);
      } catch {}
    };
    loadBalance();
  }, [syncUserFromStorage]);

  if (!user) return null;

  const kycTier = user.kycLevel ?? 1;
  const kycLabel =
    kycTier === 3
      ? 'Tier 3 · Utility bill verified'
      : kycTier === 2
        ? 'Tier 2 · BVN/NIN verified'
        : 'Tier 1 · Basic access';

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  const profileIncomplete =
    !user?.firstName?.trim() ||
    !user?.lastName?.trim() ||
    !user?.email?.trim() ||
    user?.firstName === 'BadePay' ||
    user?.lastName === 'User';

  /** Shrinks the photo to at most 400px (JPEG), uploads it as a file and saves the returned URL. */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { bpToast.error('Choose a JPG, PNG or WebP photo'); return; }
    if (file.size > 10 * 1024 * 1024) { bpToast.error('Photo must be under 10 MB'); return; }
    setUploading(true);
    try {
      const resized = await resizeImage(file, 400);
      const uploaded = await uploadFile('avatar', resized);
      const resp = await apiClient.patch('/users/me/avatar', { avatar: uploaded.url });
      const avatarUrl = resp?.data?.avatarUrl || resp?.avatarUrl || uploaded.url;
      await updateProfile({ avatar: avatarUrl });
      bpToast.success('Profile photo updated!');
    } catch (err) {
      bpToast.error((err as Error)?.message || 'Could not update photo');
    } finally {
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

  const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'RCCGPay User';

  return (
    <div className="pb-24 lg:pb-8">
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />

      {/* ── Profile header: one solid card (photo, name, email, verification) ── */}
      <section className="mb-5 flex flex-col items-center gap-4 rounded-3xl p-5 text-center sm:flex-row sm:text-left"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="relative shrink-0">
          <motion.button type="button" onClick={() => fileInputRef.current?.click()} whileTap={{ scale: 0.97 }}
            aria-label="Change profile photo"
            className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.25rem] text-2xl font-black text-white"
            style={{ background: user.avatar ? 'var(--surface-secondary)' : '#0d6b5e' }}>
            {user.avatar
              ? <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
              : <span>{initials || '?'}</span>}
            <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
              {uploading
                ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : <Camera size={18} color="white" />}
              <span className="text-[9px] font-bold text-white">Change</span>
            </motion.div>
          </motion.button>
          <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: '#6fe8d6', border: '2px solid var(--card)' }}>
            <Camera size={13} color="#0b2724" strokeWidth={2.5} />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{displayName}</h1>
          <p className="truncate text-sm" style={{ color: 'var(--text-secondary)' }}>{user.email || 'no-email@badepay.app'}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ background: 'var(--accent-bg-hover)', color: 'var(--success-text)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success-text)' }} />
            KYC Tier {kycTier}
          </span>
        </div>

        <Link href="/profile/edit"
          className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors hover:bg-[var(--surface-secondary)]"
          style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          Edit profile
        </Link>
      </section>

      {/* ── Balance card ── */}
      <div className="mb-6">
        <div className="rounded-3xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #0b7367 0%, #085f55 100%)',
            boxShadow: '0 12px 40px -10px rgba(11,115,103,0.3)',
          }}>
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="relative p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/70 font-bold">
                <Wallet size={14} className="text-white/80" /> Available balance
              </div>
              <button
                onClick={() => setBalanceHidden(!balanceHidden)}
                className="h-7 w-7 rounded-full flex items-center justify-center text-white/80 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                {balanceHidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2 text-white">
              <span className="text-sm font-bold text-white/70">₦</span>
              <span className="font-black text-3xl tracking-tight leading-none">
                {balanceHidden ? '••••••' : balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {user?.accountNumber && (
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.18em] text-white/60 font-bold">Account number</div>
                  <div className="font-mono text-xs font-semibold tracking-wider mt-0.5 text-white">
                    {user.accountNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.accountNumber || '');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="h-7 px-2.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 text-white"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  {copied ? (<><Check size={11} className="text-[#10B981]" /><span className="text-[#10B981]">Copied</span></>) : (<><Copy size={11} />Copy</>)}
                </button>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
              <Link href="/add-money" className="h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                style={{ background: '#6fe8d6', color: '#121212' }}>
                <Plus size={14} strokeWidth={2.8} /> Add
              </Link>
              <Link href="/transfer" className="h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] text-white"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <Send size={12} className="text-[#6fe8d6]" /> Transfer
              </Link>
              <Link href="/cards" className="h-10 rounded-xl text-xs font-bold flex items-center justify-center transition-all hover:scale-[1.02] text-white"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
                Cards
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 gap-px mb-6 overflow-hidden rounded-2xl"
        style={{ background: 'var(--border)', border: '1px solid var(--border)' }}>
        {[
          { label: 'KYC tier', value: String(kycTier), color: 'var(--accent-text)' },
          { label: 'Cards', value: String(activeCards), color: 'var(--success-text)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-0.5 py-4"
            style={{ background: 'var(--card)' }}>
            <span className="text-2xl font-black" style={{ color }}>{value}</span>
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Wallet ── */}
      <SectionLabel>Wallet</SectionLabel>
      <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <NavRow href="/savings" icon={PiggyBank} label="Savings" sub="Vaults, goals & auto-save" />
        <NavRow href="/profile/my-qr" icon={QrCode} label="My QR Code" sub="Receive payments via QR" />
      </div>

      {/* ── Security ── */}
      <SectionLabel>Security</SectionLabel>
      <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <NavRow href="/profile/security" icon={Shield} label="Security center" sub="Devices & login history" />
        <NavRow href="/profile/change-pin" icon={ShieldCheck} label="Transaction PIN" sub="4-digit secure PIN" />
        <NavRow href="/profile/change-password" icon={KeyRound} label="Change password"
          sub="Update your login password" />
      </div>

      {/* ── Compliance ── */}
      <SectionLabel>Compliance</SectionLabel>
      <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <NavRow href="/profile/kyc" icon={FileCheck} label="KYC verification"
          sub={kycLabel}
          badge={`Tier ${kycTier}`} />
        <NavRow href="/profile/statements" icon={FileText} label="Statements & receipts" sub="PDF · CSV · audit ready" />
      </div>

      {/* ── Merchant ── */}
      <SectionLabel>Merchant</SectionLabel>
      <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {profileIncomplete ? (
          <div onClick={() => navigate('/profile/edit')} className="cursor-pointer">
            <NavRow href="#" icon={Store} label="Become a merchant" sub="Complete your profile first" badge="Locked" />
          </div>
        ) : user.merchantProfile ? (
          <NavRow href="/merchant" icon={Store} label="Merchant dashboard" sub="Manage your business" badge="Open" />
        ) : (
          <button type="button" onClick={handleBecomeMerchant} className="w-full text-left">
            <NavRow href="#" icon={Store} label="Become a merchant" sub="Accept payments, generate QR, settle daily" badge="New" />
          </button>
        )}
      </div>

      {/* ── App preferences ── */}
      <SectionLabel>App</SectionLabel>
      <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <NavRow href="/profile/notifications" icon={Bell} label="Notifications" sub="Push, SMS and email" />
        <ToggleRow icon={theme === 'dark' ? Moon : Sun} label="Theme"
          sub={theme === 'dark' ? 'Dark mode active' : 'Light mode active'}
          on={theme === 'dark'} onToggle={toggleTheme} />
        <NavRow href="/profile/support" icon={HelpCircle} label="Help & support" sub="Answers to common questions" />
        <NavRow href="/orders" icon={Package} label="My orders" sub="Marketplace purchases and their status" />
        <NavRow href="/profile/disputes" icon={Flag} label="My disputes" sub="Problems you reported and replies from support" />
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
        RCCGPay v1.0 · Powered by BadePay
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
  badge?: string | { text: string; color: string };
}) {
  const badgeText = typeof badge === 'string' ? badge : badge?.text;
  const badgeColor = typeof badge === 'string' ? 'var(--accent-text)' : badge?.color;

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
              style={{ background: 'var(--accent-bg-hover)', color: badgeColor }}>{badgeText}</span>
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
        <span className="absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300"
          style={{ transform: on ? 'translateX(21px)' : 'translateX(2px)' }} />
      </button>
    </div>
  );
}
