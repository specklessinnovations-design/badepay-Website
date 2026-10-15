/**
 * Admin portal router, loaded as its own chunk under ADMIN_BASE (see lib/adminPaths.ts).
 * Each route names the permissions that may open it; the API enforces the same permissions.
 */
import React, { useEffect } from 'react';
import { Route, Switch, Redirect, useLocation } from 'wouter';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { ADMIN_BASE, adminPath } from '@/lib/adminPaths';
import { AdminShell } from '@/components/admin/AdminShell';
import { NoAccess, Spinner } from '@/components/admin/ui';
import { homePathFor } from '@/components/admin/nav';
import AdminLoginPage from './login/page';
import DashboardPage from './dashboard/page';
import ReportsPage from './reports/page';
import UsersPage from './users/page';
import UserDetailPage from './users/[id]/page';
import MerchantsPage from './merchants/page';
import MerchantDetailPage from './merchants/[id]/page';
import KycPage from './kyc/page';
import ClosuresPage from './closures/page';
import TicketsPage from './tickets/page';
import TicketDetailPage from './tickets/[id]/page';
import TransactionsPage from './transactions/page';
import ApprovalsPage from './approvals/page';
import FraudPage from './fraud/page';
import ReviewPage from './review/page';
import SettlementsPage from './settlements/page';
import ReconciliationPage from './reconciliation/page';
import ContentPage from './content/page';
import TeamPage from './team/page';
import AuditLogPage from './audit-log/page';
import PilotPage from './pilot/page';
import SystemPage from './system/page';
import SettingsPage from './settings/page';
import AccountPage from './account/page';
import SearchPage from './search/page';

const APPROVALS = ['refunds.request', 'refunds.approve', 'review.request', 'review.approve'];

const ROUTES: { path: string; any: string[]; component: React.ComponentType }[] = [
  { path: '/dashboard', any: ['dashboard.view'], component: DashboardPage },
  { path: '/reports', any: ['transactions.view'], component: ReportsPage },
  { path: '/users/:id', any: ['users.view'], component: UserDetailPage },
  { path: '/users', any: ['users.view'], component: UsersPage },
  { path: '/merchants/:id', any: ['merchants.view'], component: MerchantDetailPage },
  { path: '/merchants', any: ['merchants.view'], component: MerchantsPage },
  { path: '/kyc', any: ['kyc.view'], component: KycPage },
  { path: '/closures', any: ['account_closure.view'], component: ClosuresPage },
  { path: '/tickets/:id', any: ['tickets.view'], component: TicketDetailPage },
  { path: '/tickets', any: ['tickets.view'], component: TicketsPage },
  { path: '/transactions', any: ['transactions.view'], component: TransactionsPage },
  { path: '/approvals', any: APPROVALS, component: ApprovalsPage },
  { path: '/fraud', any: ['fraud.view'], component: FraudPage },
  { path: '/review', any: ['review.view'], component: ReviewPage },
  { path: '/settlements', any: ['settlements.view'], component: SettlementsPage },
  { path: '/reconciliation', any: ['reconciliation.view'], component: ReconciliationPage },
  { path: '/content', any: ['content.view'], component: ContentPage },
  { path: '/team', any: ['admin_users.view', 'roles.manage'], component: TeamPage },
  { path: '/audit-log', any: ['audit_logs.view'], component: AuditLogPage },
  { path: '/pilot', any: ['pilot.manage'], component: PilotPage },
  { path: '/system', any: ['dashboard.view'], component: SystemPage },
  { path: '/settings', any: ['settings.view'], component: SettingsPage },
  { path: '/search', any: ['users.view', 'transactions.view', 'tickets.view', 'merchants.view'], component: SearchPage },
  { path: '/account', any: [], component: AccountPage },
];

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const title = document.title;
    document.title = 'BadePay Admin';
    return () => { meta.remove(); document.title = title; };
  }, []);
}

export default function AdminApp() {
  useNoIndex();
  const [location] = useLocation();
  const { status, admin, loadMe } = useAdminAuthStore();

  useEffect(() => {
    if (status === 'idle') void loadMe();
  }, [status, loadMe]);

  const isLogin = location === adminPath('/login');
  if (isLogin) {
    if (status === 'ready' && admin) return <Redirect to={adminPath(homePathFor(admin.permissions))} replace />;
    return <AdminLoginPage />;
  }
  if (status === 'idle' || status === 'loading') return <div className="admin-shell h-dvh"><Spinner label="Checking your session…" /></div>;
  if (status === 'signedOut' || !admin) return <Redirect to={adminPath('/login')} replace />;

  const home = adminPath(homePathFor(admin.permissions));
  return (
    <AdminShell>
      <Switch>
        <Route path={ADMIN_BASE}><Redirect to={home} replace /></Route>
        {ROUTES.map(({ path, any, component: Page }) => (
          <Route key={path} path={adminPath(path)}>
            {any.length === 0 || any.some((p) => admin.permissions.includes(p)) ? <Page /> : <NoAccess />}
          </Route>
        ))}
        <Route><Redirect to={home} replace /></Route>
      </Switch>
    </AdminShell>
  );
}
