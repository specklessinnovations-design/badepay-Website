

import React from 'react';
import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { Search, Bell, Menu, LogOut, Settings, UserCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Avatar } from '@/components/ui/avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/wallet': 'My Wallet',
  '/send': 'Send Money',
  '/scan': 'Scan to Pay',
  '/bills': 'Pay Bills',
  '/history': 'Transaction History',
  '/notifications': 'Notifications',
  '/kyc': 'KYC Verification',
  '/settings': 'Settings',
  '/support': 'Help & Support',
  '/profile': 'My Profile',
};

export function Topbar() {
  const [pathname] = useLocation();
  const { user, logout } = useAuthStore();
  const unreadCount = useNotificationStore(state => state.notifications.filter(n => !n.read).length);

  let title = PAGE_TITLES[pathname] || 'Dashboard';
  if (pathname.startsWith('/bills/')) title = 'Pay Bill';
  if (pathname.startsWith('/send/')) title = 'Transfer';

  return (
    <header className="h-16 bg-[#ffefb3] border-b border-[#013e37]/10 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shadow-sm/50">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-[#013e37]/60 hover:text-[#013e37] p-2 rounded-lg hover:bg-[#013e37]/5 transition-colors icon-hover-effect">
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-black text-[#013e37]">{title}</h1>
      </div>

      <div className="flex items-center gap-2 lg:gap-5">
        <div className="relative hidden lg:block mr-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#013e37]/40 h-4 w-4" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="pl-10 pr-4 py-2 bg-[#013e37]/5 border-transparent rounded-full text-sm font-bold focus:bg-white focus:border-[#013e37] focus:ring-1 focus:ring-[#013e37] transition-all w-64 placeholder-[#013e37]/30 text-[#013e37]"
          />
        </div>

        <Link href="/notifications" className="relative p-2 text-[#013e37]/40 hover:text-[#013e37] hover:bg-[#013e37]/5 rounded-full transition-colors mr-1 icon-hover-effect">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#ffefb3]" />
          )}
        </Link>

        {user && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="focus:outline-none flex items-center gap-2 cursor-pointer rounded-full ring-offset-2 focus:ring-2 focus:ring-[#013e37] hover:opacity-90 transition-opacity icon-hover-effect">
                <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" className="shadow-sm border-2 border-[#013e37]/10" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="min-w-[220px] bg-[#fff9e6] rounded-xl shadow-lg border border-[#013e37]/10 p-2 mt-2 mr-4 z-50 animate-in fade-in-80 slide-in-from-top-2" align="end">
                <div className="px-3 py-3 border-b border-[#013e37]/5 mb-2 bg-[#013e37]/5 rounded-t-lg">
                  <p className="text-sm font-black text-[#013e37] truncate">{`${user.firstName} ${user.lastName}`}</p>
                  <p className="text-xs font-semibold text-[#013e37]/60 truncate mt-0.5">{user.email}</p>
                </div>
                <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-[#013e37]/70 hover:bg-[#013e37]/5 hover:text-[#013e37] rounded-md cursor-pointer outline-none transition-colors" asChild>
                  <Link href="/profile"><UserCircle size={16} className="text-[#013e37]/40" /> My Profile</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-[#013e37]/70 hover:bg-[#013e37]/5 hover:text-[#013e37] rounded-md cursor-pointer outline-none transition-colors" asChild>
                  <Link href="/settings"><Settings size={16} className="text-[#013e37]/40" /> Settings</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-[#013e37]/5 my-1.5" />
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md cursor-pointer outline-none transition-colors"
                  onSelect={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                >
                  <LogOut size={16} /> Log out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
    </header>
  );
}
