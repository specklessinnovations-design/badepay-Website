import {
  LayoutDashboard, BarChart3, Users, Store, ShieldCheck, UserX, LifeBuoy, ArrowLeftRight, CheckCheck, ShieldAlert,
  Hourglass, Landmark, Scale, Newspaper, UserCog, ScrollText, Settings, Ticket, Activity, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  /** Path below the admin base, e.g. "/users" */
  path: string;
  icon: LucideIcon;
  /** Shown when the admin holds any of these */
  any: string[];
  /** Key in the overview `queues` (or "tickets") shown as a count badge */
  badge?: string;
}

export interface NavSection { title: string; items: NavItem[] }

const APPROVALS = ['refunds.request', 'refunds.approve', 'review.request', 'review.approve'];

export const NAV: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, any: ['dashboard.view'] },
      { label: 'Reports', path: '/reports', icon: BarChart3, any: ['transactions.view'] },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Users', path: '/users', icon: Users, any: ['users.view'] },
      { label: 'Merchants', path: '/merchants', icon: Store, any: ['merchants.view'], badge: 'merchantVerifications' },
      { label: 'KYC exceptions', path: '/kyc', icon: ShieldCheck, any: ['kyc.view'], badge: 'kycExceptions' },
      { label: 'Account closures', path: '/closures', icon: UserX, any: ['account_closure.view'], badge: 'accountClosures' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Tickets', path: '/tickets', icon: LifeBuoy, any: ['tickets.view'], badge: 'ticketsOverdue' },
    ],
  },
  {
    title: 'Money',
    items: [
      { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight, any: ['transactions.view'] },
      { label: 'Approvals', path: '/approvals', icon: CheckCheck, any: APPROVALS, badge: 'pendingApprovals' },
      { label: 'Fraud holds', path: '/fraud', icon: ShieldAlert, any: ['fraud.view'], badge: 'fraudHeld' },
      { label: 'Stuck payments', path: '/review', icon: Hourglass, any: ['review.view'], badge: 'stuckPayments' },
      { label: 'Settlements', path: '/settlements', icon: Landmark, any: ['settlements.view'] },
      { label: 'Reconciliation', path: '/reconciliation', icon: Scale, any: ['reconciliation.view'], badge: 'reconciliationIssues' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'News & videos', path: '/content', icon: Newspaper, any: ['content.view'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Team & roles', path: '/team', icon: UserCog, any: ['admin_users.view', 'roles.manage'] },
      { label: 'Audit log', path: '/audit-log', icon: ScrollText, any: ['audit_logs.view'] },
      { label: 'Pilot invites', path: '/pilot', icon: Ticket, any: ['pilot.manage'] },
      { label: 'System health', path: '/system', icon: Activity, any: ['dashboard.view'] },
      { label: 'Settings', path: '/settings', icon: Settings, any: ['settings.view'] },
    ],
  },
];

export const visibleNav = (permissions: string[]): NavSection[] =>
  NAV.map((s) => ({ ...s, items: s.items.filter((i) => i.any.some((p) => permissions.includes(p))) }))
    .filter((s) => s.items.length > 0);

/** First page this admin may open (content admins land on Content, etc.). */
export const homePathFor = (permissions: string[]): string =>
  visibleNav(permissions)[0]?.items[0]?.path ?? '/account';
