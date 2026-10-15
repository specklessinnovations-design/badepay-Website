import React, { useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  Users, Store, ArrowLeftRight, AlertTriangle, CheckCircle2, Clock, XCircle, TrendingUp, ShieldAlert, ScrollText, LifeBuoy,
} from 'lucide-react';
import { PageHeader, Card, StatCard, Segmented, Spinner, ErrorState, StatusBadge, EmptyState, Can } from '@/components/admin/ui';
import { useAdminQuery } from '@/components/admin/hooks';
import { adminPath } from '@/lib/adminPaths';
import { formatDateTime, formatMoney, formatNumber, formatRelative, humanize, lagosDayStart } from '@/lib/adminFormat';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';

type Range = 'today' | '7d' | '30d' | '90d';
const RANGES: { value: Range; label: string }[] = [
  { value: 'today', label: 'Today' }, { value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: '90d', label: '90 days' },
];

interface Overview {
  period: { from: string; to: string };
  users?: { total: number; consumers: number; merchants: number; newInPeriod: number; activeInPeriod: number; suspended: number; kycVerified: number };
  transactions?: { byStatus: Record<string, { count: number; value: number }>; byType: Record<string, { count: number; value: number }>; successCount: number; successValue: number; totalCount: number };
  finance?: { revenue: number; settlements: Record<string, { count: number; value: number; fees: number }> };
  queues: Record<string, number>;
  tickets?: { open: number; unassigned: number; overdue: number; assignedToMe: number };
  security?: { failedAdminLogins24h: number; deniedActions24h: number; recentActions: { id: string; adminEmail: string | null; action: string; outcome: string; targetType: string | null; resourceId: string | null; createdAt: string }[] };
}

const QUEUE_LINKS: { key: string; label: string; path: string; hint: string }[] = [
  { key: 'pendingApprovals', label: 'Approvals waiting', path: '/approvals?status=pending', hint: 'Refunds and stuck-payment outcomes needing a second admin' },
  { key: 'kycExceptions', label: 'KYC exceptions', path: '/kyc', hint: 'Prembly checks that could not be approved automatically' },
  { key: 'fraudHeld', label: 'Fraud holds', path: '/fraud', hint: 'Payments held by fraud rules' },
  { key: 'stuckPayments', label: 'Stuck payments', path: '/review', hint: 'Payouts, bills or deposits with no provider answer after 24h' },
  { key: 'reconciliationIssues', label: 'Reconciliation issues', path: '/reconciliation', hint: 'Disagreements with SeerBit, unresolved' },
  { key: 'accountClosures', label: 'Closure requests', path: '/closures', hint: 'Customers asking to close their account' },
  { key: 'merchantVerifications', label: 'Merchants to verify', path: '/merchants?verified=false', hint: 'Merchant businesses not yet verified' },
];

export default function DashboardPage() {
  const admin = useAdminAuthStore((s) => s.admin);
  const [range, setRange] = useState<Range>('30d');
  const query = useMemo(() => {
    const today = lagosDayStart();
    const days = range === 'today' ? 0 : range === '7d' ? 6 : range === '30d' ? 29 : 89;
    return { from: new Date(today.getTime() - days * 86_400_000).toISOString() };
  }, [range]);
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useAdminQuery<Overview>('/admin/overview', query, { refetchInterval: 60_000 });

  const tx = data?.transactions;
  const st = (s: string) => tx?.byStatus[s]?.count ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${admin?.name?.split(' ')[0] ?? ''}`}
        description={data ? <>Figures for {formatDateTime(data.period.from)} → now. Updated {formatRelative(dataUpdatedAt)}{isFetching ? ' · refreshing…' : ''}.</> : 'Operations overview'}
        actions={<Segmented value={range} onChange={setRange} options={RANGES} />}
      />

      {isLoading ? <Spinner /> : error ? <Card><ErrorState error={error} onRetry={() => refetch()} /></Card> : data && (
        <div className="space-y-6">
          {/* Work queues first: what needs a person now */}
          {Object.keys(data.queues).length > 0 && (
            <Card title="Needs attention" description="Live counts of items waiting for an admin.">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {QUEUE_LINKS.filter((q) => q.key in data.queues).map((q) => {
                  const n = data.queues[q.key];
                  return (
                    <Link key={q.key} href={adminPath(q.path)} title={q.hint}
                      className="flex items-center justify-between rounded-lg border border-[var(--ad-border)] px-3 py-2.5 transition-colors hover:border-[#0f766e] hover:bg-[var(--ad-card-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)]">
                      <span className="text-sm text-[var(--ad-fg)]">{q.label}</span>
                      <span className={`rounded-full px-2 text-sm font-bold tabular-nums ${n > 0 ? 'bg-[rgba(180,83,9,0.12)] text-[#b45309]' : 'bg-[rgba(4,120,87,0.10)] text-[#047857]'}`}>{n}</span>
                    </Link>
                  );
                })}
                {data.tickets && (
                  <Link href={adminPath('/tickets?overdue=true')} title="Tickets past their first-response target"
                    className="flex items-center justify-between rounded-lg border border-[var(--ad-border)] px-3 py-2.5 transition-colors hover:border-[#0f766e] hover:bg-[var(--ad-card-hover)]">
                    <span className="text-sm text-[var(--ad-fg)]">Overdue tickets</span>
                    <span className={`rounded-full px-2 text-sm font-bold ${data.tickets.overdue ? 'bg-[rgba(185,28,28,0.10)] text-[#b91c1c]' : 'bg-[rgba(4,120,87,0.10)] text-[#047857]'}`}>{data.tickets.overdue}</span>
                  </Link>
                )}
              </div>
            </Card>
          )}

          {tx && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Successful volume" value={formatMoney(tx.successValue, { compact: true })} hint={`${formatNumber(tx.successCount)} successful transactions`}
                icon={<TrendingUp size={15} />} tone="accent" href={adminPath('/transactions?status=success')}
                definition="Sum of amounts of successful transactions in the period. Recipient mirror rows are excluded so each payment counts once." />
              <StatCard label="Pending" value={formatNumber(st('pending') + st('processing'))} hint="Waiting on a provider" icon={<Clock size={15} />} tone="warning"
                href={adminPath('/transactions?status=pending')} definition="Transactions in the period still pending or processing." />
              <StatCard label="Failed / reversed" value={formatNumber(st('failed') + st('reversed'))} hint={`${formatNumber(tx.totalCount)} transactions in total`} icon={<XCircle size={15} />} tone="danger"
                href={adminPath('/transactions?status=failed')} definition="Transactions in the period that failed or were reversed." />
              {data.finance ? (
                <StatCard label="Revenue" value={formatMoney(data.finance.revenue, { compact: true })} hint="Fees and commissions" icon={<CheckCircle2 size={15} />} tone="success"
                  href={adminPath('/reports')} definition="Net credits to the fee_income ledger account in the period. Not the same as volume or wallet balances." />
              ) : (
                <StatCard label="Held / in review" value={formatNumber(st('held') + st('review'))} hint="Fraud holds and stuck payments" icon={<ShieldAlert size={15} />} tone="warning" />
              )}
            </div>
          )}

          {data.users && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Customers" value={formatNumber(data.users.total)} hint={`${formatNumber(data.users.consumers)} personal · ${formatNumber(data.users.merchants)} business`}
                icon={<Users size={15} />} href={adminPath('/users')} definition="Open accounts (closed accounts excluded)." />
              <StatCard label="New in period" value={formatNumber(data.users.newInPeriod)} hint={`${formatNumber(data.users.activeInPeriod)} signed in during the period`} icon={<Users size={15} />} tone="info"
                href={adminPath('/users')} definition="Accounts created in the period; active = signed in during the period." />
              <StatCard label="KYC verified" value={formatNumber(data.users.kycVerified)} hint={`${data.users.total ? Math.round((data.users.kycVerified / data.users.total) * 100) : 0}% of customers`} icon={<CheckCircle2 size={15} />} tone="success"
                href={adminPath('/users?kycStatus=approved')} definition="Customers at KYC level 1 or above (BVN verified)." />
              <StatCard label="Suspended" value={formatNumber(data.users.suspended)} hint="Blocked from signing in" icon={<AlertTriangle size={15} />} tone="danger"
                href={adminPath('/users?isActive=false')} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {tx && (
              <Card title="Successful volume by type" description="Same period and definition as above.">
                {Object.keys(tx.byType).length === 0 ? <EmptyState title="No successful transactions in this period" /> : (
                  <ul className="space-y-2.5">
                    {Object.entries(tx.byType).sort((a, b) => b[1].value - a[1].value).map(([type, v]) => {
                      const pct = tx.successValue ? (v.value / tx.successValue) * 100 : 0;
                      return (
                        <li key={type}>
                          <div className="flex items-center justify-between text-sm">
                            <Link href={adminPath(`/transactions?type=${type}&status=success`)} className="text-[var(--ad-fg)] hover:underline">{humanize(type)}</Link>
                            <span className="tabular-nums text-[var(--ad-fg-strong)]">{formatMoney(v.value)} <span className="text-xs text-[var(--ad-muted)]">({formatNumber(v.count)})</span></span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[rgba(15,23,42,0.06)]">
                            <div className="h-full rounded-full bg-[#0f766e]" style={{ width: `${Math.max(pct, 1)}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            )}

            {data.tickets && (
              <Card title="Support" actions={<Link href={adminPath('/tickets')} className="text-xs font-semibold text-[#0f766e] hover:underline">Open tickets →</Link>}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Open', value: data.tickets.open, path: '/tickets?status=active' },
                    { label: 'Unassigned', value: data.tickets.unassigned, path: '/tickets?assignee=unassigned&status=active' },
                    { label: 'Overdue first reply', value: data.tickets.overdue, path: '/tickets?overdue=true' },
                    { label: 'Assigned to me', value: data.tickets.assignedToMe, path: '/tickets?assignee=me&status=active' },
                  ].map((t) => (
                    <Link key={t.label} href={adminPath(t.path)} className="rounded-lg border border-[var(--ad-border)] p-3 hover:border-[#0f766e]">
                      <p className="text-xs text-[var(--ad-muted)]">{t.label}</p>
                      <p className="text-xl font-bold tabular-nums text-[var(--ad-fg-strong)]">{t.value}</p>
                    </Link>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--ad-muted)]"><LifeBuoy size={12} /> First-reply targets: critical 1h · high 4h · medium 24h · low 72h.</p>
              </Card>
            )}

            {data.security && (
              <Card
                title="Security & admin activity"
                description="Last 24 hours"
                actions={<Can perm="audit_logs.view"><Link href={adminPath('/audit-log')} className="text-xs font-semibold text-[#0f766e] hover:underline">Audit log →</Link></Can>}
                className="lg:col-span-2"
              >
                <div className="mb-3 flex flex-wrap gap-4 text-sm">
                  <Link href={adminPath('/audit-log?action=auth/login&outcome=failure')} className="hover:underline">
                    <span className="font-bold tabular-nums text-[var(--ad-fg-strong)]">{data.security.failedAdminLogins24h}</span> <span className="text-[var(--ad-muted)]">failed admin sign-ins</span>
                  </Link>
                  <Link href={adminPath('/audit-log?outcome=denied')} className="hover:underline">
                    <span className="font-bold tabular-nums text-[var(--ad-fg-strong)]">{data.security.deniedActions24h}</span> <span className="text-[var(--ad-muted)]">refused actions</span>
                  </Link>
                </div>
                {data.security.recentActions.length === 0 ? <EmptyState title="No admin activity yet" icon={<ScrollText size={18} />} /> : (
                  <ul className="divide-y divide-[var(--ad-border)]">
                    {data.security.recentActions.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                        <span className="min-w-0 truncate"><span className="font-medium text-[var(--ad-fg-strong)]">{a.adminEmail ?? 'unknown'}</span> <span className="font-mono text-xs text-[var(--ad-muted)]">{a.action.replace('/api/v1/admin', '')}</span></span>
                        <span className="flex items-center gap-2"><StatusBadge status={a.outcome} /><span className="text-xs text-[var(--ad-muted)]">{formatRelative(a.createdAt)}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>

          {!tx && !data.users && !data.tickets && (
            <Card><EmptyState title="Nothing to show for your role" description="Use the menu to open the areas you work in." icon={<Store size={18} />} /></Card>
          )}
          <p className="text-[11px] text-[var(--ad-muted)]"><ArrowLeftRight size={11} className="mr-1 inline" />All times are Lagos time (WAT, UTC+1).</p>
        </div>
      )}
    </div>
  );
}
