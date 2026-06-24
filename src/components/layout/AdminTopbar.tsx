
import React from 'react';
import { Search, Bell, Settings, Menu } from 'lucide-react';
import { useLocation } from 'wouter';

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const [pathname] = useLocation();
  const pathParts = pathname.split('/').filter((p) => p !== 'admin' && p !== '');
  const title =
    pathParts.length > 0
      ? pathParts[pathParts.length - 1].charAt(0).toUpperCase() +
        pathParts[pathParts.length - 1].slice(1)
      : 'Dashboard';

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:px-8 backdrop-blur-xl"
      style={{
        background: 'var(--ad-card)',
        borderBottom: '1px solid #e5e5e5',
        boxShadow: '0 1px 12px rgba(0,0,0,0.08)',
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
            border: '1px solid #e5e5e5',
          }}
        >
          <Search size={15} style={{ color: 'var(--ad-muted)' }} />
          <input
            type="text"
            placeholder="Search (Cmd+K)"
            className="ml-2 w-full border-none bg-transparent text-sm font-bold outline-none"
            style={{ color: 'var(--ad-fg-strong)' }}
          />
        </div>

        <div
          className="flex items-center gap-3 pl-4 md:gap-4 md:pl-6"
          style={{ borderLeft: '1px solid #e5e5e5' }}
        >
          <button
            className="relative rounded-xl p-2 transition-colors"
            style={{ color: 'var(--ad-muted)' }}
          >
            <Bell size={20} strokeWidth={2.5} />
            <span
              className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2"
              style={{ background: '#f87171', borderColor: 'var(--ad-card)' }}
            />
          </button>
          <button className="rounded-xl p-2 transition-colors" style={{ color: 'var(--ad-muted)' }}>
            <Settings size={20} strokeWidth={2.5} />
          </button>

          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black"
            style={{ background: 'rgba(111,232,214,0.15)', color: '#6fe8d6' }}
          >
            A
          </div>
        </div>
      </div>
    </header>
  );
}
