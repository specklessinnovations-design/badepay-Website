import React from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { Home, CreditCard, Activity, User, QrCode, ArrowLeftRight, Landmark, Store } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDisplayName } from '@/lib/personalHelpers';
import { motion } from 'framer-motion';

const MAIN_TABS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/cards', label: 'Cards', icon: CreditCard },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

const QUICK_LINKS = [
  { href: '/scan', label: 'Scan to pay', icon: QrCode },
  { href: '/transfer', label: 'Transfer money', icon: ArrowLeftRight },
  { href: '/bills', label: 'Pay & top up', icon: Landmark },
  { href: '/stores', label: 'Merchant Stores', icon: Store },
] as const;

export function PersonalSidebar() {
  const [pathname] = useLocation();
  const user = useAuthStore(s => s.user);
  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'U';

  return (
    <aside
      className="glass-sidebar relative z-10 hidden lg:flex lg:w-[240px] xl:w-[260px] lg:shrink-0 lg:flex-col h-screen sticky top-0"
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid var(--glass-border-light)' }}>
        <Link href="/dashboard" className="group flex items-center gap-3 mb-5">
          <motion.img
            src="/logo.png"
            alt="BadePay"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="h-10 w-auto object-contain"
            style={{ filter: 'drop-shadow(0 0 10px rgba(111,232,214,0.35))' }}
          />
        </Link>

        {/* User card */}
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm"
              style={{ background: 'linear-gradient(135deg,#6fe8d6 0%,#4dd4c0 100%)', color: '#1a1a1a' }}>
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
            <div className="h-2 w-2 rounded-full flex-shrink-0 relative">
              <div className="absolute inset-0 rounded-full bg-[#10B981]" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
              <div className="absolute inset-0 rounded-full bg-[#10B981] animate-ping opacity-40" />
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-5">
        <div className="space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] px-3 pb-2" style={{ color: 'var(--text-tertiary)' }}>Main</p>
          {MAIN_TABS.map(({ href, label, icon: Icon }, i) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <motion.div key={href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16,1,0.3,1] }}>
                <Link href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    active ? '' : 'hover:bg-[var(--surface-secondary)]'
                  }`}
                  style={{
                    background: active ? '#6fe8d6' : 'transparent',
                    color: active ? '#1a1a1a' : 'var(--text-secondary)',
                    boxShadow: active ? '0 4px 16px rgba(111,232,214,0.3)' : 'none',
                  }}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2}
                    style={{ color: active ? '#1a1a1a' : 'var(--text-tertiary)' }} />
                  <span style={{ color: active ? '#1a1a1a' : 'var(--text-secondary)' }}>{label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(26,26,26,0.4)' }} />}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] px-3 pb-2" style={{ color: 'var(--text-tertiary)' }}>Quick actions</p>
          {QUICK_LINKS.map(({ href, label, icon: Icon }, i) => {
            const active = pathname === href;
            return (
              <motion.div key={href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.35, ease: [0.16,1,0.3,1] }}>
                <Link href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active ? 'bg-[var(--surface-secondary)]' : 'hover:bg-[var(--surface-secondary)]'
                  }`}
                  style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {/* icon wrap — uses CSS var accent-bg so it's themed */}
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg accent-icon-wrap transition-all duration-200">
                    <Icon size={14} style={{ color: 'var(--accent-text)' }} />
                  </div>
                  <span style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: '1px solid var(--glass-border-light)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-text)' }} />
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>All systems operational</p>
        </div>
      </div>
    </aside>
  );
}
