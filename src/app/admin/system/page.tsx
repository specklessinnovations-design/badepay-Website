import React from 'react';
import { Link } from 'wouter';
import { RefreshCw } from 'lucide-react';
import { PageHeader, Card, DataTable, StatusBadge, Badge, Button, Mono, StatCard, Spinner, ErrorState } from '@/components/admin/ui';
import { useAdminQuery } from '@/components/admin/hooks';
import { adminPath } from '@/lib/adminPaths';
import { formatDateTime, formatRelative, humanize } from '@/lib/adminFormat';

interface Health {
  jobs: { name: string; type: string; status: string; lastRunAt: string | null; nextRunAt: string | null; late: boolean; lastError: string | null }[];
  delayedPendingTransactions: number; stuckPayments: number; openReconciliationIssues: number; failedApprovals7d: number;
}

export default function SystemPage() {
  const { data, isLoading, isFetching, error, refetch } = useAdminQuery<Health>('/admin/system/health', undefined, { refetchInterval: 60_000 });
  if (isLoading) return <Spinner />;
  if (error || !data) return <Card><ErrorState error={error} onRetry={() => refetch()} /></Card>;
  const failing = data.jobs.filter((j) => j.status === 'failed' || j.late).length;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="System health"
        description="Background jobs (provider syncs, payouts, reconciliation, sweeps) and money that is waiting longer than it should. Refreshes every minute."
        actions={<Button icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Button>}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Jobs failing or late" value={failing} tone={failing ? 'danger' : 'success'} hint={`${data.jobs.length} scheduled jobs`} />
        <StatCard label="Pending > 30 min" value={data.delayedPendingTransactions} tone={data.delayedPendingTransactions ? 'warning' : 'success'} href={adminPath('/transactions?status=pending')} hint="Waiting on a provider" />
        <StatCard label="Stuck payments" value={data.stuckPayments} tone={data.stuckPayments ? 'warning' : 'success'} href={adminPath('/review')} hint="No provider answer after 24h" />
        <StatCard label="Reconciliation issues" value={data.openReconciliationIssues} tone={data.openReconciliationIssues ? 'warning' : 'success'} href={adminPath('/reconciliation')} hint="Disagreements with SeerBit" />
        <StatCard label="Failed approvals (7 days)" value={data.failedApprovals7d} tone={data.failedApprovals7d ? 'danger' : 'success'} href={adminPath('/approvals?status=failed')} hint="Approved but could not run" />
      </div>
      <DataTable
        rows={data.jobs}
        rowKey={(j) => j.name}
        columns={[
          { key: 'name', header: 'Job', cell: (j) => <span><Mono>{j.name}</Mono><br /><span className="text-xs text-(--ad-muted)">{humanize(j.type)}</span></span> },
          { key: 'status', header: 'Last result', cell: (j) => <span className="flex flex-wrap gap-1"><StatusBadge status={j.status} />{j.late && <Badge tone="danger">Late</Badge>}</span> },
          { key: 'last', header: 'Last run', cell: (j) => <span className="text-xs" title={formatDateTime(j.lastRunAt)}>{j.lastRunAt ? formatRelative(j.lastRunAt) : 'Never'}</span> },
          { key: 'next', header: 'Next run', cell: (j) => <span className="text-xs" title={formatDateTime(j.nextRunAt)}>{j.nextRunAt ? formatRelative(j.nextRunAt) : '—'}</span> },
          { key: 'error', header: 'Last error', cell: (j) => j.lastError ? <span className="line-clamp-2 max-w-md text-xs text-[#b91c1c]">{j.lastError}</span> : <span className="text-xs text-(--ad-muted)">—</span> },
        ]}
      />
      <p className="mt-2 text-xs text-(--ad-muted)">Jobs need an always-on server. Webhook, email and SMS delivery failures are raised as alerts in the server logs (see the backend runbooks); they aren’t stored for this page yet.</p>
      <p className="mt-1 text-xs text-(--ad-muted)">Disagreements and stuck items link to their own pages; see also <Link href={adminPath('/audit-log?outcome=failure')} className="text-[#0f766e] hover:underline">failed admin actions</Link>.</p>
    </div>
  );
}
