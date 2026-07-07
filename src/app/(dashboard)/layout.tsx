import React, { useEffect } from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { ArrowLeft, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useAuthProtection } from '@/hooks/useAuthProtection';
import { PersonalBottomNav } from '@/components/dashboard/PersonalBottomNav';
import { PersonalSidebar } from '@/components/dashboard/PersonalSidebar';
import { AppShell } from '@/components/ui/app-shell';

const MAIN_TABS = ['/dashboard', '/video', '/scan', '/profile/notifications', '/profile'];

const SUB_PAGES: Record<string, string> = {
  '/transfer': 'Transfer money',
  '/bills': 'Pay & top up',
  '/stores': 'Merchant Stores',
  '/history': 'History',
  '/cards': 'My Cards',
  '/activity': 'Activity',
  '/add-money': 'Add money',
  '/ai': 'AI Assistant',
  '/explore-nigeria': 'Explore Nigeria',
  '/insights': 'Insights',
  '/marketplace': 'Marketplace',
  '/savings': 'Savings',
  '/news': 'News & Explore',
  '/profile/edit': 'Edit profile',
  '/profile/security': 'Security center',
  '/profile/kyc': 'KYC verification',
  '/profile/devices': 'Trusted devices',
  '/profile/support': 'Help & support',
  '/profile/statements': 'Statements',
  '/profile/change-pin': 'Change transaction PIN',
  '/profile/change-password': 'Change password',
  '/transaction/success': 'Transaction Successful',
  '/transaction/failed': 'Transaction Failed',
  '/transaction/detail': 'Transaction Details',
  '/profile/my-qr': 'My QR Code',
  '/profile/notifications': 'Notifications',
};


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [pathname] = useLocation();
  const { user } = useAuthStore();
  const ensureCurrentDevice = usePreferencesStore(s => s.ensureCurrentDevice);
  const syncUserFromStorage = useAuthStore(s => s.syncUserFromStorage);

  useAuthProtection();

  useEffect(() => {
    ensureCurrentDevice();
    syncUserFromStorage();
  }, [ensureCurrentDevice, syncUserFromStorage]);

  const showMainNav = MAIN_TABS.includes(pathname as any);
  const subPageTitle = SUB_PAGES[pathname];

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6fe8d6] border-t-transparent" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading BadePay…</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell className="lg:flex">
      {showMainNav && <PersonalSidebar />}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sub-page header */}
        {subPageTitle && (
          <header className="sticky top-0 z-40 backdrop-blur-xl"
            style={{
              background: 'color-mix(in srgb, var(--card) 90%, transparent)',
              borderBottom: '1px solid var(--border)',
            }}>
            <div className="mx-auto flex h-14 w-full max-w-lg items-center gap-3 px-4 lg:max-w-5xl lg:px-6">
              <button type="button" onClick={() => history.back()}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-95"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
                aria-label="Go back">
                <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
              </button>
              <h1 className="text-sm font-bold tracking-tight flex-1" style={{ color: 'var(--text-primary)' }}>
                {subPageTitle}
              </h1>
            </div>
          </header>
        )}

        {/* Main nav top bar — mobile only */}
        {showMainNav && (
          <header className="sticky top-0 z-40 lg:hidden backdrop-blur-xl"
            style={{
              background: 'color-mix(in srgb, var(--card) 88%, transparent)',
              borderBottom: '1px solid var(--border)',
            }}>
            <div className="flex h-14 items-center justify-between px-4">
              <Link href="/dashboard" className="flex items-center">
                <img
                  src="/logo.png"
                  alt="BadePay"
                  className="h-9 w-auto object-contain"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(111,232,214,0.25))' }}
                />
              </Link>
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                <Bell size={17} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </header>
        )}

        <main className={`mx-auto w-full max-w-lg flex-1 px-4 lg:max-w-6xl lg:px-6 ${
          showMainNav ? 'pb-28 pt-5 lg:pb-10 lg:pt-7' : 'py-5 lg:py-7'
        }`}>
          {children}
        </main>

        {showMainNav && <PersonalBottomNav />}

        {!showMainNav && !subPageTitle && (
          <div className="fixed bottom-4 left-0 right-0 flex justify-center lg:static lg:mt-4 lg:justify-start lg:px-6">
            <Link href="/dashboard"
              className="rounded-full px-5 py-2.5 text-sm font-semibold transition-colors backdrop-blur-xl"
              style={{
                background: 'color-mix(in srgb, var(--card) 90%, transparent)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                boxShadow: 'var(--shadow-sm)',
              }}>
              ← Back to Home
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
