import React, { useState } from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import { useRequireMerchant } from '@/hooks/useAuthProtection';
import { ThemeContext } from '@/contexts/ThemeContext';
import { AppShell } from '@/components/ui/app-shell';
import { BarChart3, CreditCard, QrCode, DollarSign, LogOut, Menu, X, Moon, Sun, Store, ShoppingBag, Package, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV = [
  { icon: BarChart3,   label: 'Dashboard',   href: '/merchant' },
  { icon: CreditCard,  label: 'Payments',    href: '/merchant/payments' },
  { icon: QrCode,      label: 'QR Codes',    href: '/merchant/qr' },
  { icon: DollarSign,  label: 'Settlements', href: '/merchant/settlements' },
  { icon: Package,     label: 'My Store',    href: '/merchant/store' },
  { icon: ShoppingBag, label: 'Orders',      href: '/merchant/orders' },
];

function LogoMark() {
  return (
    <img
      src="/logo.png"
      alt="BadePay"
      style={{
        height: 48,
        width: 'auto',
        objectFit: 'contain',
        filter: 'drop-shadow(0 0 16px rgba(111,232,214,0.8)) drop-shadow(0 0 4px rgba(111,232,214,0.5))',
      }}
    />
  );
}

function SidebarNav({ pathname, onNavClick }: { pathname: string; onNavClick?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-0.5">
      {NAV.map(({ icon: Icon, label, href }, i) => {
        const active = pathname === href;
        return (
          <motion.div key={href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 + 0.1, duration: 0.35, ease: [0.16,1,0.3,1] }}>
            <Link href={href} onClick={onNavClick}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 active:scale-95"
              style={{
                background: active ? '#6fe8d6' : 'transparent',
                color: active ? '#1a1a1a' : 'var(--text-secondary)',
                boxShadow: active ? '0 4px 16px rgba(111,232,214,0.3)' : 'none',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--surface-secondary)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <Icon size={17} strokeWidth={active ? 2.5 : 2} style={{ color: active ? '#1a1a1a' : 'var(--text-tertiary)' }} />
              <span style={{ color: active ? '#1a1a1a' : 'var(--text-secondary)' }}>{label}</span>
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}

function SidebarBottom({ user, businessName, initials, theme, toggleTheme, onLogout, onNavClick }: any) {
  return (
    <div className="p-3 space-y-1" style={{ borderTop: '1px solid var(--glass-border-light)' }}>
      <Link href="/dashboard" onClick={onNavClick}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-secondary)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <User size={16} style={{ color: 'var(--text-tertiary)' }} />
        <span>Personal Account</span>
      </Link>

      <button onClick={() => { toggleTheme(); onNavClick?.(); }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-secondary)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        {theme === 'dark' ? <Sun size={16} style={{ color: 'var(--text-tertiary)' }} /> : <Moon size={16} style={{ color: 'var(--text-tertiary)' }} />}
        <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
      </button>

      <button onClick={() => { onLogout(); onNavClick?.(); }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-secondary)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <LogOut size={16} style={{ color: 'var(--text-tertiary)' }} />
        <span>Sign out</span>
      </button>

      {/* User card */}
      <div className="mt-2 flex items-center gap-3 rounded-2xl p-3"
        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{ background: '#6fe8d6', color: '#1a1a1a' }}>{initials}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>{businessName}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
        </div>
      </div>
    </div>
  );
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const [pathname, navigate] = useLocation();
  const { user, logout } = useAuthStore();
  const isOnboarding = pathname.startsWith('/merchant/onboarding');
  useRequireMerchant({ allowOnboarding: isOnboarding });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const themeCtx = React.useContext(ThemeContext);
  const { theme, toggleTheme } = themeCtx || { theme: 'dark', toggleTheme: () => {} };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6fe8d6] border-t-transparent" />
      </div>
    );
  }

  if (isOnboarding) {
    return <AppShell><div className="mx-auto max-w-lg px-4 py-6">{children}</div></AppShell>;
  }

  const businessName = user.merchantProfile?.tradingName || user.merchantProfile?.businessName || user.firstName;
  const initials = businessName.slice(0, 2).toUpperCase();
  const currentLabel = NAV.find(n => n.href === pathname)?.label ?? 'Merchant Dashboard';

  return (
    <AppShell className="flex h-screen overflow-hidden">

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.aside key="drawer"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col lg:hidden glass-sidebar">
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--glass-border-light)' }}>
              <div className="flex items-center">
                <LogoMark />
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-xl"
                style={{ background: 'var(--surface-secondary)' }}>
                <X size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <SidebarNav pathname={pathname} onNavClick={() => setMobileSidebarOpen(false)} />
            <SidebarBottom user={user} businessName={businessName} initials={initials}
              theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout}
              onNavClick={() => setMobileSidebarOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 h-full glass-sidebar">
        <div className="flex items-center p-4" style={{ borderBottom: '1px solid var(--glass-border-light)' }}>
          <LogoMark />
        </div>
        <SidebarNav pathname={pathname} />
        <SidebarBottom user={user} businessName={businessName} initials={initials}
          theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between px-4 md:px-6 glass"
          style={{ borderBottom: '1px solid var(--glass-border-light)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-xl transition-colors active:scale-95"
              style={{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }}>
              <Menu size={20} />
            </button>
            <h1 className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{currentLabel}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'var(--surface-secondary)' }}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div className="flex items-center gap-2 rounded-xl px-2.5 py-1.5"
              style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black"
                style={{ background: '#6fe8d6', color: '#1a1a1a' }}>{initials}</div>
              <span className="text-xs font-bold hidden sm:block" style={{ color: 'var(--text-secondary)' }}>{user.firstName}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto page-content">{children}</div>
        </main>
      </div>
    </AppShell>
  );
}
