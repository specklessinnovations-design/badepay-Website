import React from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import {
  Home, Video, QrCode, MessageCircle, User,
  Send, Landmark, Store, Plus, Sun, Moon, ArrowLeftRight, LogOut,
} from 'lucide-react';
import { MerchantMark, useMerchantBrand } from '@/components/merchant/MerchantBrand';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { formatDisplayName } from '@/lib/personalHelpers';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';

// ── 5 main tabs — mirrors app bottom nav exactly ─────────────────
const MAIN_TABS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/video', label: 'Video', icon: Video },
  { href: '/scan', label: 'Scan', icon: QrCode, accent: true },
  { href: '/profile/notifications', label: 'Message', icon: MessageCircle },
  { href: '/profile', label: 'Account', icon: User },
] as const;

// ── Quick actions (sub-pages) ────────────────────────────────────
const QUICK_LINKS = [
  { href: '/add-money', label: 'Add money', icon: Plus },
  { href: '/transfer', label: 'Transfer', icon: Send },
  { href: '/bills', label: 'Pay & top up', icon: Landmark },
  { href: '/stores', label: 'Merchant Stores', icon: Store },
] as const;

export function PersonalSidebar() {
  const [pathname, navigate] = useLocation();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const { theme, toggleTheme } = useTheme();

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  const isTabActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/profile') return pathname === '/profile';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="relative z-10 hidden lg:flex lg:w-[240px] xl:w-[260px] lg:shrink-0 lg:flex-col h-screen sticky top-0"
      style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}>

      {/* Brand + User card */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" className="flex items-center gap-3 mb-5">
          {/* Icon + name as text, so the wordmark stays readable in dark mode */}
          <img src="/favicon.png" alt="" className="h-9 w-9 rounded-lg object-contain" />
          <span className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>BadePay</span>
        </Link>

        {user && (
          <div className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #0b7367 0%, #0a5f58 100%)', color: '#fff' }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {formatDisplayName(user.firstName, user.lastName)}
              </p>
              <p className="text-xs font-medium mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
                {user.accountNumber ? `•••• ${user.accountNumber.slice(-4)}` : 'BadePay account'}
              </p>
            </div>
            {/* Online indicator */}
            <div className="h-2 w-2 rounded-full flex-shrink-0 relative">
              <div className="absolute inset-0 rounded-full bg-[#10B981]" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
              <div className="absolute inset-0 rounded-full bg-[#10B981] animate-ping opacity-40" />
            </div>
          </div>
        )}

        {/* Quick switch to the business side (merchants only) */}
        {user?.merchantProfile?.businessName && <SwitchToBusiness />}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" style={{ scrollbarWidth: 'none' }}>

        {/* ── Main 5 tabs ── */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] px-3 pb-2"
            style={{ color: 'var(--text-tertiary)' }}>Navigation</p>
          {MAIN_TABS.map(({ href, label, icon: Icon, ...rest }, i) => {
            const active = isTabActive(href);
            const isAccent = (rest as any).accent;
            const isMsgTab = href === '/profile/notifications';
            return (
              <motion.div key={href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                <Link href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                  style={{
                    background: active
                      ? isAccent ? '#0b7367' : 'rgba(11,115,103,0.1)'
                      : 'transparent',
                    color: active
                      ? isAccent ? '#fff' : '#0b7367'
                      : 'var(--text-secondary)',
                    border: active && !isAccent ? '1px solid rgba(11,115,103,0.2)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.background = 'var(--surface-secondary)';
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200"
                    style={{
                      background: active
                        ? isAccent ? 'rgba(255,255,255,0.2)' : 'rgba(11,115,103,0.15)'
                        : 'var(--surface-secondary)',
                    }}>
                    <Icon size={15} strokeWidth={active ? 2.5 : 2}
                      style={{ color: active ? (isAccent ? '#fff' : '#0b7367') : 'var(--text-tertiary)' }} />
                    {isMsgTab && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>{label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: isAccent ? 'rgba(255,255,255,0.5)' : 'rgba(11,115,103,0.4)' }} />}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ── Quick actions ── */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] px-3 pb-2"
            style={{ color: 'var(--text-tertiary)' }}>Quick actions</p>
          {QUICK_LINKS.map(({ href, label, icon: Icon }, i) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <motion.div key={href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.22 + i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                <Link href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  aria-current={active ? 'page' : undefined}
                  style={{
                    color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                    background: active ? 'var(--accent-bg-hover)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200"
                    style={{ background: 'rgba(11,115,103,0.08)', border: '1px solid rgba(11,115,103,0.12)' }}>
                    <Icon size={14} style={{ color: '#0b7367' }} />
                  </div>
                  <span style={{ color: active ? 'var(--accent-text)' : 'var(--text-secondary)' }}>{label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* Footer — theme toggle + status */}
      <div className="px-3 pb-4 pt-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
            {theme === 'dark'
              ? <Sun size={14} style={{ color: 'var(--text-tertiary)' }} />
              : <Moon size={14} style={{ color: 'var(--text-tertiary)' }} />}
          </div>
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ color: '#dc2626' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.18)' }}>
            <LogOut size={14} style={{ color: '#dc2626' }} />
          </div>
          <span>Sign out</span>
        </button>

      </div>
    </aside>
  );
}

/** One tap back to the merchant portal, showing the business's own logo and name. */
function SwitchToBusiness() {
  const brand = useMerchantBrand();
  return (
    <Link href="/merchant"
      className="mt-2 flex items-center gap-3 rounded-2xl p-3 transition-colors"
      style={{ border: '1px solid var(--border)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <MerchantMark name={brand.name} logoUrl={brand.logoUrl} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{brand.name}</p>
        <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--accent-text)' }}>Switch to business</p>
      </div>
      <ArrowLeftRight size={15} style={{ color: 'var(--text-tertiary)' }} />
    </Link>
  );
}
