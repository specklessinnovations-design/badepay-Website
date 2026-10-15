/**
 * Admin layout: fixed header, a sidebar that scrolls on its own, and a content area that is
 * the only thing the page scrolls. On small screens the sidebar becomes a drawer.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Bell, ChevronDown, LogOut, Menu, Search, ShieldCheck, User, X } from 'lucide-react';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { adminPath } from '@/lib/adminPaths';
import { visibleNav, NAV } from './nav';
import { useAdminQuery } from './hooks';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

interface Overview {
  queues?: Record<string, number>;
  tickets?: { overdue: number; open: number; unassigned: number };
}

function useBadgeCounts(): Record<string, number> {
  const canSee = useAdminAuthStore((s) => !!s.admin?.permissions.includes('dashboard.view'));
  const { data } = useAdminQuery<Overview>('/admin/overview', undefined, { enabled: canSee, refetchInterval: 60_000 });
  return { ...(data?.queues ?? {}), ticketsOverdue: data?.tickets?.overdue ?? 0 };
}

function Sidebar({ open, onClose, counts }: { open: boolean; onClose: () => void; counts: Record<string, number> }) {
  const [location] = useLocation();
  const admin = useAdminAuthStore((s) => s.admin);
  const sections = visibleNav(admin?.permissions ?? []);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-[rgba(15,23,42,0.45)] lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-shrink-0 flex-col border-r border-[var(--ad-border)] bg-[var(--ad-card)] transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Admin navigation"
      >
        <div className="flex h-14 flex-shrink-0 items-center justify-between gap-2 border-b border-[var(--ad-border)] px-4">
          <Link href={adminPath('/dashboard')} className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)] rounded">
            <img src="/favicon.png" alt="" className="h-7 w-7 object-contain" />
            <span className="text-[15px] font-bold tracking-tight text-[var(--ad-fg-strong)]">BadePay <span className="text-[#0f766e]">Admin</span></span>
          </Link>
          <button type="button" onClick={onClose} className="rounded p-1.5 text-[var(--ad-muted)] hover:bg-[rgba(15,23,42,0.05)] lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ad-muted-soft)]">{section.title}</p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const href = adminPath(item.path);
                  const active = location === href || location.startsWith(`${href}/`);
                  const count = item.badge ? counts[item.badge] ?? 0 : 0;
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <Link
                        href={href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={cx(
                          'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)]',
                          active ? 'bg-[var(--ad-accent-soft)] font-semibold text-[#0f766e]' : 'text-[var(--ad-fg)] hover:bg-[rgba(15,23,42,0.04)]',
                        )}
                      >
                        <Icon size={16} className="flex-shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {count > 0 && (
                          <span className="rounded-full bg-[#b91c1c] px-1.5 text-[10px] font-bold leading-[18px] text-white" aria-label={`${count} waiting`}>
                            {count > 99 ? '99+' : count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex-shrink-0 border-t border-[var(--ad-border)] p-3">
          <Link href={adminPath('/account')} onClick={onClose} className="flex items-center gap-2.5 rounded-md p-2 hover:bg-[rgba(15,23,42,0.04)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ad-accent-soft)] text-xs font-bold text-[#0f766e]">
              {(admin?.name ?? '?').slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-[var(--ad-fg-strong)]">{admin?.name}</span>
              <span className="block truncate text-[11px] text-[var(--ad-muted)]">{admin?.roleName}</span>
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}

function Topbar({ onMenu, counts }: { onMenu: () => void; counts: Record<string, number> }) {
  const [, navigate] = useLocation();
  const admin = useAdminAuthStore((s) => s.admin);
  const logout = useAdminAuthStore((s) => s.logout);
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState<'none' | 'alerts' | 'profile'>('none');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu('none'); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu('none'); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);

  // Alerts = the queues this admin can act on.
  const perms = admin?.permissions ?? [];
  const alerts = NAV.flatMap((s) => s.items)
    .filter((i) => i.badge && i.any.some((p) => perms.includes(p)) && (counts[i.badge] ?? 0) > 0)
    .map((i) => ({ label: i.label, count: counts[i.badge!], path: i.path }));
  const total = alerts.reduce((n, a) => n + a.count, 0);
  const canSearch = ['users.view', 'transactions.view', 'tickets.view', 'merchants.view'].some((p) => perms.includes(p));

  return (
    <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-[var(--ad-border)] bg-[var(--ad-card)] px-4 lg:px-6" ref={ref}>
      <button type="button" onClick={onMenu} className="rounded p-1.5 text-[var(--ad-fg)] hover:bg-[rgba(15,23,42,0.05)] lg:hidden" aria-label="Open menu">
        <Menu size={20} />
      </button>

      {canSearch && (
        <form
          role="search"
          className="relative max-w-md flex-1"
          onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate(adminPath(`/search?q=${encodeURIComponent(q.trim())}`)); }}
        >
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ad-muted-soft)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customers, references, tickets…"
            aria-label="Search the admin portal"
            className="h-9 w-full rounded-lg border border-[var(--ad-border)] bg-[var(--ad-bg-elev)] pl-9 pr-3 text-sm text-[var(--ad-fg-strong)] placeholder:text-[var(--ad-muted-soft)] focus:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[var(--ad-accent-ring)]"
          />
        </form>
      )}
      <div className="flex-1" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenu(menu === 'alerts' ? 'none' : 'alerts')}
          className="relative rounded-lg p-2 text-[var(--ad-fg)] hover:bg-[rgba(15,23,42,0.05)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)]"
          aria-label={`Work queues${total ? `, ${total} waiting` : ''}`}
          aria-expanded={menu === 'alerts'}
        >
          <Bell size={18} />
          {total > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#b91c1c]" />}
        </button>
        {menu === 'alerts' && (
          <div className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-xl border border-[var(--ad-border)] bg-[var(--ad-card)] shadow-xl">
            <p className="border-b border-[var(--ad-border)] px-4 py-2.5 text-xs font-semibold text-[var(--ad-fg-strong)]">Waiting for action</p>
            {alerts.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-[var(--ad-muted)]">Nothing waiting. All queues are clear.</p>
            ) : (
              <ul>
                {alerts.map((a) => (
                  <li key={a.path}>
                    <Link href={adminPath(a.path)} onClick={() => setMenu('none')} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[var(--ad-card-hover)]">
                      <span className="text-[var(--ad-fg)]">{a.label}</span>
                      <span className="rounded-full bg-[rgba(185,28,28,0.1)] px-2 text-xs font-bold text-[#b91c1c]">{a.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenu(menu === 'profile' ? 'none' : 'profile')}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[rgba(15,23,42,0.05)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)]"
          aria-expanded={menu === 'profile'}
          aria-label="Account menu"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ad-accent-soft)] text-xs font-bold text-[#0f766e]">
            {(admin?.name ?? '?').slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-semibold leading-tight text-[var(--ad-fg-strong)]">{admin?.name}</span>
            <span className="block text-[10px] leading-tight text-[var(--ad-muted)]">{admin?.roleName}</span>
          </span>
          <ChevronDown size={14} className="text-[var(--ad-muted)]" />
        </button>
        {menu === 'profile' && (
          <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl border border-[var(--ad-border)] bg-[var(--ad-card)] shadow-xl">
            <div className="border-b border-[var(--ad-border)] px-4 py-3">
              <p className="truncate text-sm font-semibold text-[var(--ad-fg-strong)]">{admin?.email}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--ad-muted)]">
                <ShieldCheck size={12} className={admin?.twoFactorEnabled ? 'text-[#047857]' : 'text-[#b45309]'} />
                Two-factor {admin?.twoFactorEnabled ? 'on' : 'off'}
              </p>
            </div>
            <Link href={adminPath('/account')} onClick={() => setMenu('none')} className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--ad-fg)] hover:bg-[var(--ad-card-hover)]">
              <User size={15} /> My account & security
            </Link>
            <button
              type="button"
              onClick={async () => { setMenu('none'); await logout('You signed out.', { everywhere: true }); }}
              className="flex w-full items-center gap-2 border-t border-[var(--ad-border)] px-4 py-2.5 text-sm text-[#b91c1c] hover:bg-[var(--ad-card-hover)]"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

const IDLE_MINUTES = 15;

/** Signs the admin out after 15 minutes without activity (unattended sessions). */
function useIdleSignOut() {
  const logout = useAdminAuthStore((s) => s.logout);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void logout(`You were signed out after ${IDLE_MINUTES} minutes without activity.`, { everywhere: true });
      }, IDLE_MINUTES * 60_000);
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true, capture: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset, { capture: true }));
    };
  }, [logout]);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const main = useRef<HTMLElement>(null);
  const counts = useBadgeCounts();
  useIdleSignOut();

  // New page: start at the top of the content area.
  useEffect(() => { main.current?.scrollTo({ top: 0 }); }, [location]);

  return (
    <div className="admin-shell flex h-dvh overflow-hidden font-sans">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[60] focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Sidebar open={open} onClose={() => setOpen(false)} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} counts={counts} />
        <main id="admin-main" ref={main} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
