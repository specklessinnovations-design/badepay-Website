

import React from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { LayoutDashboard, Wallet, SendHorizonal, Landmark, QrCode } from 'lucide-react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/scan', label: 'Scan', icon: QrCode },
  { href: '/send', label: 'Send', icon: SendHorizonal },
  { href: '/bills', label: 'Bills', icon: Landmark },
];

export function MobileNav() {
  const [pathname] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <nav className="flex justify-around items-center h-[68px]">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-black' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`relative transition-all duration-200 ${                isActive ? 'bg-black/10 p-1.5 rounded-xl' : 'p-1.5'}`}>
                <Icon size={22} className={isActive ? 'text-black' : ''} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-black' : ''}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
