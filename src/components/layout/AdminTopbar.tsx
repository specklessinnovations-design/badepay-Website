
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
      className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:px-8 backdrop-blur-xl"
      style={{
        background: 'var(--ad-card)',
        borderBottom: '1px solid var(--ad-border)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="cursor-pointer rounded-xl p-2 transition-colors active:scale-95 md:hidden"
          style={{ color: '#6fe8d6' }}
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="hidden h-1.5 w-1.5 rounded-full md:block"
            style={{ background: '#6fe8d6', boxShadow: '0 0 6px rgba(111,232,214,0.8)' }}
          />
          <h1 className="text-lg font-black tracking-tight" style={{ color: 'var(--ad-fg-strong)' }}>
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div
          className="hidden w-64 items-center rounded-xl px-3.5 py-2.5 transition-all md:flex"
          style={{
            background: 'var(--ad-bg-elev)',
            border: '1px solid var(--ad-border)',
          }}
        >
          <Search size={15} style={{ color: 'var(--ad-muted)' }} />
          <input
            type="text"
            placeholder="Search (Cmd+K)"
            className="ml-2 w-full border-none bg-transparent text-sm font-bold outline-none"
            style={{ color: 'var(--ad-fg-strong)' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Trigger search on current page - this would need to be implemented per page
                e.currentTarget.blur();
              }
            }}
          />
        </div>

        <div
          className="flex items-center gap-3 pl-4 md:gap-4 md:pl-6"
          style={{ borderLeft: '1px solid var(--ad-border)' }}
        >
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl p-2 transition-colors hover:bg-white/5"
              style={{ color: 'var(--ad-muted)' }}
            >
              <Bell size={20} strokeWidth={2.5} />
              {totalNotifications > 0 && (
                <span
                  className="absolute right-1 top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full border-2 text-[9px] font-black"
                  style={{ background: '#f87171', borderColor: 'var(--ad-card)', color: 'white' }}
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
