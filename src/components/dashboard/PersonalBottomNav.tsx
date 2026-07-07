import React from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { Home, Video, MessageCircle, User, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/store/useNotificationStore';

const LEFT_TABS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/video', label: 'Video', icon: Video },
] as const;

const RIGHT_TABS = [
  { href: '/profile/notifications', label: 'Message', icon: MessageCircle },
  { href: '/profile', label: 'Account', icon: User },
] as const;

function NavTab({
  href, label, icon: Icon, active, badge,
}: {
  href: string; label: string; icon: React.ElementType; active: boolean; badge?: number;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-95 select-none"
    >
      {active && (
        <motion.div
          layoutId="bottom-nav-indicator"
          className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
          style={{ background: '#0b7367' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
      )}
      <div className="relative flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200"
        style={active ? { background: '#0b7367', boxShadow: '0 4px 16px rgba(11,115,103,0.4)' } : {}}>
        <Icon size={18} strokeWidth={active ? 2.5 : 2}
          style={{ color: active ? '#fff' : 'var(--text-tertiary)' }} />
        {badge && badge > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </div>
      <span className="text-[10px] font-bold leading-none"
        style={{ color: active ? '#0b7367' : 'var(--text-tertiary)' }}>
        {label}
      </span>
    </Link>
  );
}

export function PersonalBottomNav() {
  const [pathname] = useLocation();
  const unreadCount = useNotificationStore(s => s.unreadCount);

  const isScanActive = pathname === '/scan';
  const isProfileNotifActive = pathname === '/profile/notifications';
  const isProfileActive = pathname === '/profile' && !isProfileNotifActive;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      <div
        className="mx-auto max-w-lg overflow-visible rounded-2xl"
        style={{
          background: 'color-mix(in srgb, var(--card) 92%, transparent)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-stretch h-[60px]">
          {/* Left tabs */}
          {LEFT_TABS.map(({ href, label, icon }) => (
            <NavTab
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))}
            />
          ))}

          {/* Centre — elevated teal Scan FAB (matches app) */}
          <div className="relative flex flex-col items-center justify-end pb-2 px-2 select-none" style={{ width: '72px', flexShrink: 0 }}>
            <Link href="/scan" className="absolute -top-5 flex flex-col items-center gap-1 active:scale-95 transition-transform duration-150">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: isScanActive
                    ? 'linear-gradient(135deg, #0d9a88 0%, #0b7367 100%)'
                    : 'linear-gradient(135deg, #0b7367 0%, #0a5f58 100%)',
                  boxShadow: isScanActive
                    ? '0 0 28px rgba(11,115,103,0.7), 0 0 56px rgba(11,115,103,0.35), 0 8px 24px rgba(0,0,0,0.25)'
                    : '0 0 20px rgba(11,115,103,0.5), 0 0 40px rgba(11,115,103,0.2), 0 8px 20px rgba(0,0,0,0.2)',
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              >
                <QrCode size={24} strokeWidth={2.2} style={{ color: '#fff' }} />
              </motion.div>
              <span className="text-[10px] font-black leading-none" style={{ color: '#0b7367' }}>SCAN</span>
            </Link>
          </div>

          {/* Right tabs */}
          <NavTab
            href="/profile/notifications"
            label="Message"
            icon={MessageCircle}
            active={isProfileNotifActive}
            badge={unreadCount}
          />
          <NavTab
            href="/profile"
            label="Account"
            icon={User}
            active={isProfileActive}
          />
        </div>
      </div>
    </nav>
  );
}
