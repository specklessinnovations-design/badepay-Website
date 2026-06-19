import React from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { Home, CreditCard, Activity, User, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';

const LEFT_TABS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/cards', label: 'Cards', icon: CreditCard },
] as const;

const RIGHT_TABS = [
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

function NavTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-95 select-none"
    >
      {active && (
        <motion.div
          layoutId="bottom-nav-indicator"
          className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-[#6fe8d6]"
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
      )}
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
          active ? 'bg-[#6fe8d6]' : ''
        }`}
        style={active ? { boxShadow: '0 4px 16px rgba(111,232,214,0.35)' } : {}}
      >
        <Icon
          size={18}
          strokeWidth={active ? 2.5 : 2}
          className={active ? 'text-[#1a1a1a]' : 'text-[var(--text-tertiary)]'}
        />
      </div>
      <span
        className={`text-[10px] font-bold leading-none ${
          active ? 'text-[var(--accent-text)]' : 'text-[var(--text-tertiary)]'
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export function PersonalBottomNav() {
  const [pathname] = useLocation();

  const isScanActive = pathname === '/scan';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      <div
        className="mx-auto max-w-lg overflow-visible rounded-2xl"
        style={{
          background: 'color-mix(in srgb, var(--card) 90%, transparent)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(255,255,255,0.06)',
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
              active={pathname === href || pathname.startsWith(`${href}/`)}
            />
          ))}

          {/* Centre — elevated neon Scan button */}
          <div className="relative flex flex-col items-center justify-end pb-2 px-2 select-none" style={{ width: '72px', flexShrink: 0 }}>
            <Link href="/scan" className="absolute -top-5 flex flex-col items-center gap-1 active:scale-95 transition-transform duration-150">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: isScanActive
                    ? 'linear-gradient(135deg, #8eeee0 0%, #6fe8d6 50%, #4dd4c0 100%)'
                    : 'linear-gradient(135deg, #6fe8d6 0%, #4dd4c0 100%)',
                  boxShadow: isScanActive
                    ? '0 0 28px rgba(111,232,214,0.8), 0 0 56px rgba(111,232,214,0.4), 0 8px 24px rgba(0,0,0,0.35)'
                    : '0 0 20px rgba(111,232,214,0.6), 0 0 40px rgba(111,232,214,0.3), 0 8px 20px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              >
                <QrCode size={24} strokeWidth={2.2} style={{ color: '#081a18' }} />
              </motion.div>
              <span
                className="text-[10px] font-black leading-none"
                style={{ color: 'var(--accent-text)' }}
              >
                Scan
              </span>
            </Link>
          </div>

          {/* Right tabs */}
          {RIGHT_TABS.map(({ href, label, icon }) => (
            <NavTab
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname === href || pathname.startsWith(`${href}/`)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
