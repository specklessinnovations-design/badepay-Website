
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { useAdminDataSync } from '@/hooks/useAdminDataSync';
import { refreshAllAdminData } from '@/store/useAdminDataStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuthStore();
    const [pathname, navigate] = useLocation();
  const isLoginPage = pathname === '/admin/login';
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useAdminDataSync();

  useEffect(() => {
    if (!isLoginPage && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate, isLoginPage]);

  useEffect(() => {
    if (isAuthenticated && !isLoginPage) {
      refreshAllAdminData();
    }
  }, [pathname, isAuthenticated, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="admin-shell flex min-h-screen font-sans relative" style={{ background: '#f5f5f5' }}>
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="page-content flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
