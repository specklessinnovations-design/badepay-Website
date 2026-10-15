import React from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader, DataTable, Pagination, StatusBadge, Button, Mono, Badge } from '@/components/admin/ui';
import { FilterPanel, FilterGroup, FilterSelect } from '@/components/admin/filters';
import { useAdminQuery, useAdminAction, useUrlState } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { formatDateTime, formatMoney, formatRelative, humanize } from '@/lib/adminFormat';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';

interface Approval {
  id: string; type: 'refund' | 'review_resolve'; reference: string; payload: { outcome?: string; amount?: number; disputeId?: string };
  amount: string | null; status: string; requestedById: string; requestedByEmail: string; requestNote: string;
  decidedByEmail: string | null; decisionNote: string | null; decidedAt: string | null; error: string | null; createdAt: string;
}

const STATUS_LABEL: Record<string, string> = { pending: 'Waiting', executed: 'Done', failed: 'Failed', rejected: 'Rejected', cancelled: 'Cancelled', all: 'All statuses' };

const APPROVE_PERM = { refund: 'refunds.approve', review_resolve: 'review.approve' } as const;

const describe = (a: Approval) => a.type === 'refund'
  ? 'Refund to the payer'
  : `Mark stuck payment as ${a.payload.outcome === 'success' ? 'successful' : 'failed'}${a.payload.amount ? ` (credit ${formatMoney(a.payload.amount)})` : ''}`;

export default function ApprovalsPage() {
  const me = useAdminAuthStore((s) => s.admin);
  const [f, setF] = useUrlState({ status: 'pending', type: '', page: '1' });
  const { data, isLoading, isFetching, error, refetch } = useAdminQuery<{ items: Approval[]; pagination: { page: number; pages: number; total: number } }>(
    '/admin/approvals', { status: f.status === 'all' ? '' : f.status, type: f.type, page: f.page, limit: 25 }, { refetchInterval: 30_000 },
  );
  const settings = useAdminQuery<{ approvals?: { superadminAbove: number } }>(me?.permissions.includes('settings.view') ? '/admin/settings' : null);
  const threshold = settings.data?.approvals?.superadminAbove;
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();

  const approve = async (a: Approval) => {
    const ok = await confirm({
      title: a.type === 'refund' ? 'Approve and refund now?' : 'Approve this outcome?', tone: 'success', stepUp: true,
      confirmLabel: 'Approve and run',
      description: (
        <div className="space-y-2">
          <p><b>{describe(a)}</b> · {formatMoney(a.amount)} · <Mono>{a.reference}</Mono></p>
          <p>Requested by {a.requestedByEmail}: “{a.requestNote}”</p>
          <p>This moves money as soon as you confirm. Check the payment first.</p>
        </div>
      ),
      optionalNote: true, noteLabel: 'Approval comment',
    });
    if (!ok) return;
    await run(`approve-${a.id}`, () => adminApiClient.post(`/admin/approvals/${a.id}/approve`, { note: ok.note }, { otp: ok.otp }), 'Approved and done');
  };
  const reject = async (a: Approval) => {
    const ok = await confirm({
      title: 'Reject this request?', tone: 'danger', confirmLabel: 'Reject', requireNote: true, noteLabel: 'Reason for rejection',
      description: <>{describe(a)} · {formatMoney(a.amount)}. Nothing moves; {a.requestedByEmail} sees your reason.</>,
    });
    if (!ok) return;
    await run(`reject-${a.id}`, () => adminApiClient.post(`/admin/approvals/${a.id}/reject`, { note: ok.note }), 'Request rejected');
  };
  const cancel = async (a: Approval) => {
    const ok = await confirm({ title: 'Cancel your request?', tone: 'danger', confirmLabel: 'Cancel request', description: <>{describe(a)} for <Mono>{a.reference}</Mono> will not happen.</> });
    if (!ok) return;
    await run(`cancel-${a.id}`, () => adminApiClient.post(`/admin/approvals/${a.id}/cancel`), 'Request cancelled');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Approvals"
        description={<>Refunds and final outcomes for stuck payments need two people: one requests, a different admin with approval rights approves. {threshold !== undefined && <>From {formatMoney(threshold)} only a super administrator can approve.</>}</>}
        actions={<Button icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Button>}
      />
      <FilterPanel
        onClearAll={() => setF({ status: 'pending', type: '' })}
        active={[
          ...(f.status !== 'pending' ? [{ key: 'status', label: `Status: ${STATUS_LABEL[f.status] ?? f.status}`, onRemove: () => setF({ status: 'pending' }) }] : []),
          ...(f.type ? [{ key: 'type', label: f.type === 'refund' ? 'Refunds' : 'Stuck-payment outcomes', onRemove: () => setF({ type: '' }) }] : []),
        ]}
      >
        <FilterGroup label="Status">
          <FilterSelect label="Status" defaultValue="pending" value={f.status} onChange={(v) => setF({ status: v })}
            options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
        </FilterGroup>
        <FilterGroup label="Request type">
          <FilterSelect label="Request type" value={f.type} onChange={(v) => setF({ type: v })}
            options={[{ value: '', label: 'All request types' }, { value: 'refund', label: 'Refunds' }, { value: 'review_resolve', label: 'Stuck-payment outcomes' }]} />
        </FilterGroup>
      </FilterPanel>
      <DataTable
        rows={data?.items}
        loading={isLoading || isFetching}
        error={error}
        onRetry={() => refetch()}
        rowKey={(a) => a.id}
        columns={[
          {
            key: 'what', header: 'Request', cell: (a) => (
              <div className="min-w-0 max-w-sm">
                <p className="font-medium text-(--ad-fg-strong)">{describe(a)}</p>
                <p className="text-xs text-(--ad-muted)"><Mono>{a.reference}</Mono></p>
                <p className="mt-0.5 line-clamp-2 text-xs text-(--ad-fg)">“{a.requestNote}”</p>
              </div>
            ),
          },
          {
            key: 'amount', header: 'Amount', align: 'right', cell: (a) => (
              <span>{formatMoney(a.amount)}{threshold !== undefined && Number(a.amount) >= threshold && <><br /><Badge tone="warning">Super admin only</Badge></>}</span>
            ),
          },
          { key: 'by', header: 'Requested', cell: (a) => <span className="text-xs">{a.requestedByEmail}<br /><span className="text-(--ad-muted)">{formatRelative(a.createdAt)}</span></span> },
          {
            key: 'status', header: 'Status', cell: (a) => (
              <div className="text-xs">
                <StatusBadge status={a.status} label={a.status === 'executed' ? 'Done' : undefined} />
                {a.decidedByEmail && a.status !== 'cancelled' && <p className="mt-1 text-(--ad-muted)">by {a.decidedByEmail} · {formatDateTime(a.decidedAt)}</p>}
                {a.decisionNote && <p className="text-(--ad-muted)">“{a.decisionNote}”</p>}
                {a.error && <p className="text-[#b91c1c]">{a.error}</p>}
              </div>
            ),
          },
          {
            key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (a) => a.status === 'pending' && (
              a.requestedById === me?.id ? (
                <Button size="sm" loading={pending === `cancel-${a.id}`} onClick={() => cancel(a)}>Cancel</Button>
              ) : me?.permissions.includes(APPROVE_PERM[a.type]) ? (
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="danger" loading={pending === `reject-${a.id}`} onClick={() => reject(a)}>Reject</Button>
                  <Button size="sm" variant="success" loading={pending === `approve-${a.id}`} onClick={() => approve(a)}>Approve</Button>
                </div>
              ) : <span className="text-xs text-(--ad-muted)">Waiting for an approver</span>
            ),
          },
        ]}
        footer={data && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} label={`${humanize(f.status)} requests`} onPage={(p) => setF({ page: String(p) })} />}
      />
      {dialog}
    </div>
  );
}
