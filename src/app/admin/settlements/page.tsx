import React from 'react';
import { Link } from 'wouter';
import { Play, RefreshCw } from 'lucide-react';
import { PageHeader, DataTable, Pagination, StatusBadge, Button, Mono, StatCard, EmptyState, Can } from '@/components/admin/ui';
import { FilterPanel, FilterGroup, FilterSelect } from '@/components/admin/filters';
import { useAdminQuery, useAdminAction, useUrlState } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { adminPath } from '@/lib/adminPaths';
import { formatDateTime, formatMoney, humanize } from '@/lib/adminFormat';

interface Settlement {
  id: string; merchantProfileId: string; reference: string; trigger: string; schedule: string; amount: string; fee: string; status: string;
  accountNumber: string; bankName: string | null; accountName: string; failureReason: string | null; completedAt: string | null; createdAt: string;
  merchantProfile: { businessName: string; tradingName: string | null };
}
interface Totals { status: string; _count: number; _sum: { amount: string | null; fee: string | null } }

export default function SettlementsPage() {
  const [f, setF] = useUrlState({ status: '', page: '1' });
  const { data, isLoading, isFetching, error, refetch } = useAdminQuery<{ settlements: Settlement[]; totals: Totals[]; page: number; limit: number; total: number }>(
    '/admin/settlements', { status: f.status, page: f.page, limit: 25 },
  );
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();
  const sum = (s: string) => data?.totals.find((t) => t.status === s);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const runJob = async () => {
    const ok = await confirm({
      title: 'Run the settlement job now?', tone: 'danger', confirmLabel: 'Run now', stepUp: true, requireNote: true, noteLabel: 'Why now?',
      description: <>Pays every merchant whose scheduled payout is due, the same as the automatic run. Merchants already paid this period are skipped. Each payout is final only when the bank confirms.</>,
    });
    if (ok) await run('job', () => adminApiClient.post('/admin/settlements/run', { note: ok.note }, { otp: ok.otp }), 'Settlement job finished — check statuses below');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Settlements"
        description="Payouts from merchant business wallets to their banks. Status mirrors the bank payout: pending until the bank confirms; failed payouts are returned to the business wallet."
        actions={(
          <>
            <Button icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Button>
            <Can perm="settlements.run"><Button icon={<Play size={14} />} loading={pending === 'job'} onClick={runJob}>Run settlement job</Button></Can>
          </>
        )}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(['success', 'pending', 'failed', 'review'] as const).map((s) => (
          <StatCard key={s} label={humanize(s)} value={formatMoney(sum(s)?._sum.amount ?? 0, { compact: true })}
            hint={`${sum(s)?._count ?? 0} payouts · fees ${formatMoney(sum(s)?._sum.fee ?? 0)}`}
            tone={s === 'success' ? 'success' : s === 'failed' ? 'danger' : 'warning'} />
        ))}
      </div>
      <FilterPanel
        onClearAll={() => setF({ status: '' })}
        active={f.status ? [{ key: 'status', label: `Status: ${humanize(f.status)}`, onRemove: () => setF({ status: '' }) }] : []}
      >
        <FilterGroup label="Payout status">
          <FilterSelect label="Payout status" value={f.status} onChange={(v) => setF({ status: v })} options={[
            { value: '', label: 'All statuses' }, { value: 'pending', label: 'Pending' }, { value: 'success', label: 'Success' },
            { value: 'failed', label: 'Failed' }, { value: 'review', label: 'Review' }, { value: 'held', label: 'Held' },
          ]} />
        </FilterGroup>
      </FilterPanel>
      <DataTable
        rows={data?.settlements}
        loading={isLoading || isFetching}
        error={error}
        onRetry={() => refetch()}
        rowKey={(s) => s.id}
        empty={<EmptyState title="No settlements" />}
        columns={[
          { key: 'ref', header: 'Reference', cell: (s) => <Mono>{s.reference}</Mono> },
          { key: 'merchant', header: 'Merchant', cell: (s) => <span>{s.merchantProfile.tradingName || s.merchantProfile.businessName}<br /><span className="text-xs text-(--ad-muted)">{humanize(s.trigger)} · {humanize(s.schedule)}</span></span> },
          { key: 'amount', header: 'Amount', align: 'right', cell: (s) => formatMoney(s.amount) },
          { key: 'fee', header: 'Fee', align: 'right', hideOnMobile: true, cell: (s) => formatMoney(s.fee) },
          { key: 'bank', header: 'To', hideOnMobile: true, cell: (s) => <span className="text-xs">{s.accountName}<br />{s.bankName} ••••{s.accountNumber.slice(-4)}</span> },
          { key: 'status', header: 'Status', cell: (s) => <div><StatusBadge status={s.status} />{s.failureReason && <p className="mt-0.5 max-w-48 text-xs text-[#b91c1c]">{s.failureReason}</p>}</div> },
          { key: 'time', header: 'Started / completed (WAT)', cell: (s) => <span className="text-xs text-(--ad-muted)">{formatDateTime(s.createdAt)}{s.completedAt && <><br />{formatDateTime(s.completedAt)}</>}</span> },
        ]}
        footer={data && <Pagination page={Number(f.page)} pages={pages} total={data.total} label="settlements" onPage={(p) => setF({ page: String(p) })} />}
      />
      <p className="mt-2 text-xs text-(--ad-muted)">Payout controls for a single merchant are on their <Link href={adminPath('/merchants')} className="text-[#0f766e] hover:underline">merchant page</Link>.</p>
      {dialog}
    </div>
  );
}
