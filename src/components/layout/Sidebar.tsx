

import React from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { 
  LayoutDashboard, Wallet, SendHorizonal, QrCode, Landmark, 
  ArrowLeftRight, Bell, ShieldCheck, Settings, HelpCircle, 
  LogOut, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Avatar } from '@/components/ui/avatar';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/send', label: 'Send Money', icon: SendHorizonal },
  { href: '/scan', label: 'Scan to Pay', icon: QrCode },
  { href: '/bills', label: 'Pay Bills', icon: Landmark },
  { href: '/history', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/notifications', label: 'Notifications', icon: Bell, badge: true },
  { href: '/kyc', label: 'KYC Verification', icon: ShieldCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support', label: 'Help & Support', icon: HelpCircle },
];

export function Sidebar() {
  const [pathname] = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const unreadCount = useNotificationStore(state => state.notifications.filter(n => !n.read).length);

  return (
    <aside className={`hidden md:flex flex-col bg-[#ffefb3] border-r border-[#013e37]/10 transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#013e37]/10 bg-[#013e37]">
        <div className="flex items-center gap-3 overflow-hidden">
          <img src="/logo.png" alt="BadePay" className="w-8 h-8 object-contain rounded-lg bg-[#ffefb3] p-0.5" />
          {!sidebarCollapsed && <span className="text-[#ffefb3] font-bold text-xl whitespace-nowrap tracking-wide">BadePay</span>}
        </div>
        <button onClick={toggleSidebar} className="text-[#ffefb3]/70 hover:text-[#ffefb3] p-1 rounded-md hover:bg-white/10 hidden md:block transition-colors">
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1.5 px-3">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative group icon-hover-effect ${
                  isActive
                    ? 'bg-[#013e37]/15 text-[#0a0a0a] font-black before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-[#013e37] before:rounded-r-full'
                    : 'text-[#0a0a0a]/70 hover:bg-[#013e37]/10 hover:text-[#0a0a0a] font-bold'
                }`}
                title={sidebarCollapsed ? link.label : undefined}
              >
                <Icon size={20} className={`transition-colors ${isActive ? 'text-[#013e37]' : 'text-[#013e37]/50 group-hover:text-[#013e37]'}`} />
                {!sidebarCollapsed && (
                  <span className="flex-1 whitespace-nowrap font-bold">{link.label}</span>
                )}
                {!sidebarCollapsed && link.badge && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {unreadCount}
                  </span>
                )}
                {sidebarCollapsed && link.badge && unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[#013e37]/10 bg-[#013e37]/5">
        {user && (
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" className="border-2 border-[#013e37]/10" />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-[#0a0a0a] truncate">{`${user.firstName} ${user.lastName}`}</p>
                <p className="text-xs font-bold text-[#0a0a0a]/70 truncate">{user.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="p-2 text-[#013e37]/50 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors icon-hover-effect"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
