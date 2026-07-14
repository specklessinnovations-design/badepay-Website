
import React, { useState } from 'react';
import { Search, Bell, Settings, Menu, LogOut, ChevronDown, User } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { useAdminDisputesStore } from '@/store/useAdminDisputesStore';
import { useAdminKYCStore } from '@/store/useAdminKYCStore';

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const [pathname, navigate] = useLocation();
  const { admin, logout } = useAdminAuthStore();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const openDisputes = useAdminDisputesStore((s) =>
    s.disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length
  );
  const pendingKyc = useAdminKYCStore((s) => s.submissions.filter((k) => k.status === 'pending').length);
  
  const totalNotifications = openDisputes + pendingKyc;

  const pathParts = pathname.split('/').filter((p) => p !== 'admin' && p !== '');
  const title =
    pathParts.length > 0
      ? pathParts[pathParts.length - 1].charAt(0).toUpperCase() +
        pathParts[pathParts.length - 1].slice(1)
      : 'Dashboard';

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-4 px-4 md:px-8 backdrop-blur-xl"
      style={{
        background: 'color-mix(in oklab, var(--ad-card) 88%, transparent)',
        borderBottom: '1px solid var(--ad-border)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 24px -20px rgba(15,23,42,0.15)',
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="cursor-pointer rounded-xl border p-2 transition-all active:scale-95 md:hidden"
          style={{
            color: 'var(--ad-accent)',
            background: 'var(--ad-accent-soft)',
            borderColor: 'var(--ad-accent-ring)',
          }}
        >
          <Menu size={20} strokeWidth={2.25} />
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="hidden h-8 w-[3px] rounded-full md:block"
            style={{ background: 'var(--ad-accent)', boxShadow: '0 0 12px var(--ad-accent-ring)' }}
          />
          <div className="flex min-w-0 flex-col leading-tight">
            <span
              className="hidden text-[10px] font-bold uppercase tracking-[0.14em] md:block"
              style={{ color: 'var(--ad-muted-soft)' }}
            >
              Admin Console
            </span>
            <h1
              className="truncate text-[17px] font-black tracking-tight"
              style={{ color: 'var(--ad-fg-strong)' }}
            >
              {title}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <label
          className="group hidden h-10 items-center rounded-xl px-3 transition-all focus-within:shadow-[0_0_0_3px_var(--ad-accent-ring)] md:flex md:w-72 lg:w-80"
          style={{
            background: 'var(--ad-bg-elev)',
            border: '1px solid var(--ad-border)',
          }}
        >
          <Search size={16} strokeWidth={2.25} style={{ color: 'var(--ad-muted)' }} />
          <input
            type="text"
            placeholder="Search users, transactions…"
            className="ml-2 w-full border-none bg-transparent text-[13px] font-medium outline-none placeholder:font-normal"
            style={{ color: 'var(--ad-fg-strong)' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
          />
          <kbd
            className="ml-2 hidden items-center gap-0.5 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold lg:inline-flex"
            style={{
              borderColor: 'var(--ad-border-strong)',
              color: 'var(--ad-muted)',
              background: 'var(--ad-card)',
            }}
          >
            ⌘K
          </kbd>
        </label>

        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:-translate-y-px"
              style={{
                color: 'var(--ad-fg)',
                background: 'var(--ad-card)',
                borderColor: 'var(--ad-border)',
              }}
            >
              <Bell size={18} strokeWidth={2} />
              {totalNotifications > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 px-1 text-[10px] font-black leading-none"
                  style={{ background: 'var(--ad-danger)', borderColor: 'var(--ad-card)', color: 'white' }}
                >
                  {totalNotifications > 9 ? '9+' : totalNotifications}
                </span>
              )}
            </button>
            

            
            {showNotifications && (
              <div
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl p-4 shadow-2xl"
                style={{
                  background: 'var(--ad-card)',
                  border: '1px solid var(--ad-border)',
                  zIndex: 50,
                }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--ad-muted-soft)' }}>
                  Notifications
                </p>
                {openDisputes > 0 && (
                  <Link
                    href="/admin/disputes"
                    onClick={() => setShowNotifications(false)}
                    className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                      <Bell size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: 'var(--ad-fg-strong)' }}>
                        {openDisputes} Open Dispute{openDisputes === 1 ? '' : 's'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--ad-muted)' }}>
                        Requires attention
                      </p>
                    </div>
                  </Link>
                )}
                {pendingKyc > 0 && (
                  <Link
                    href="/admin/kyc"
                    onClick={() => setShowNotifications(false)}
                    className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                      <User size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: 'var(--ad-fg-strong)' }}>
                        {pendingKyc} Pending KYC
                      </p>
                      <p className="text-xs" style={{ color: 'var(--ad-muted)' }}>
                        Awaiting review
                      </p>
                    </div>
                  </Link>
                )}
                {totalNotifications === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--ad-muted)' }}>
                    No new notifications
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <Link href="/admin/settings">
            <button className="rounded-xl p-2 transition-colors hover:bg-white/5" style={{ color: 'var(--ad-muted)' }}>
              <Settings size={20} strokeWidth={2.5} />
            </button>
          </Link>

          {/* Profile Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-white/5"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black"
                style={{ background: 'rgba(111,232,214,0.15)', color: '#6fe8d6' }}
              >
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <ChevronDown size={14} className="hidden md:block" style={{ color: 'var(--ad-muted)' }} />
            </button>

            {showProfileDropdown && (
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 shadow-2xl"
                style={{
                  background: 'var(--ad-card)',
                  border: '1px solid var(--ad-border)',
                  zIndex: 50,
                }}
              >
                <div className="p-3 border-b" style={{ borderColor: 'var(--ad-border)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--ad-fg-strong)' }}>
                    {admin?.name || 'Admin'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ad-muted)' }}>
                    {admin?.email || 'admin@badepay.com'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl p-3 text-sm font-bold transition-colors hover:bg-white/5"
                  style={{ color: '#f87171' }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
