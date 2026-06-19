

import React from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { LayoutDashboard, Users, FileText, AlertTriangle, BarChart3, Settings, ShieldCheck, LogOut, X } from 'lucide-react';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { useAdminDisputesStore } from '@/store/useAdminDisputesStore';
import { useAdminKYCStore } from '@/store/useAdminKYCStore';

interface AdminSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function AdminSidebar({ mobileOpen, setMobileOpen }: AdminSidebarProps) {
  const [pathname, navigate] = useLocation();
  const { admin, logout } = useAdminAuthStore();
    const openDisputes = useAdminDisputesStore((s) =>
    s.disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length
  );
  const pendingKyc = useAdminKYCStore((s) => s.submissions.filter((k) => k.status === 'pending').length);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [{ label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' }],
    },
    {
      title: 'USER MANAGEMENT',
      items: [
        { label: 'Users', icon: Users, href: '/admin/users' },
        { label: 'KYC Queue', icon: ShieldCheck, href: '/admin/kyc', badge: pendingKyc || undefined },
      ],
    },
    {
      title: 'FINANCIAL',
      items: [
        { label: 'Transactions', icon: FileText, href: '/admin/transactions' },
        { label: 'Disputes', icon: AlertTriangle, href: '/admin/disputes', badge: openDisputes || undefined },
      ],
    },
    {
      title: 'PLATFORM',
      items: [{ label: 'Analytics', icon: BarChart3, href: '/admin/analytics' }],
    },
    {
      title: 'SYSTEM',
      items: [{ label: 'Settings', icon: Settings, href: '/admin/settings' }],
    },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`w-[280px] flex-shrink-0 flex flex-col border-r border-black/10 transition-transform duration-300 ease-in-out z-50 fixed inset-y-0 left-0 md:relative md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ background: '#ffffff' }}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-black/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6fe8d6] rounded-lg flex items-center justify-center p-1.5 shadow-lg">
              <img src="/favicon.png" alt="BadePay" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight text-black">
              BadePay <span className="text-[#6fe8d6]">Admin</span>
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors md:hidden text-black cursor-pointer icon-hover-effect"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <p className="px-4 text-xs font-bold text-black/40 uppercase tracking-widest mb-3">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all icon-hover-effect ${
                        isActive
                          ? 'bg-[#6fe8d6]/10 text-[#6fe8d6] border-l-2 border-[#6fe8d6]'
                          : 'hover:bg-black/5 hover:text-black'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        <span className={`text-sm ${isActive ? 'font-black' : 'font-black'}`}>{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-black/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/5 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#6fe8d6]/10 text-[#6fe8d6] flex items-center justify-center font-black shadow-sm border border-[#6fe8d6]/10">
              {admin?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-black truncate">{admin?.name}</p>
              <p className="text-xs text-black/40 capitalize truncate font-medium">
                {admin?.role.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-black text-black/40 hover:text-red-400 hover:bg-red-400/10 transition-colors icon-hover-effect"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
