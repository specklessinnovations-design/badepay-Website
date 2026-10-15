import React from 'react';
import { Link } from 'wouter';
import { Hourglass, RefreshCw } from 'lucide-react';
import { PageHeader, DataTable, Button, Mono, Badge, EmptyState, Can } from '@/components/admin/ui';
import { useAdminQuery, useAdminAction } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { adminPath } from '@/lib/adminPaths';
import { formatDateTime, formatMoney, humanize } from '@/lib/adminFormat';

interface ReviewItem { reference: string; type: string; category: string; amount: string; fee: string; description: string; senderId: string | null; metadata: Record<string, unknown> | null; createdAt: string; ageHours: number }

export default function ReviewPage() {
  const { data, isLoading, isFetching, error, refetch } = useAdminQuery<{ items: ReviewItem[] }>('/admin/review');
  const pendingRequests = useAdminQuery<{ items: { reference: string; status: string; requestedByEmail: string }[] }>('/admin/approvals', { type: 'review_resolve', status: 'pending', limit: 100 });
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();
  const openRequest = (ref: string) => pendingRequests.data?.items.find((a) => a.reference === ref);

  const recheck = (t: ReviewItem) => run(`recheck-${t.reference}`, () => adminApiClient.post(`/admin/review/${t.reference}/recheck`));

  const propose = async (t: ReviewItem) => {
    const isDeposit = t.type === 'funding';
    const ok = await confirm({
      title: 'Propose the final outcome', tone: 'danger', confirmLabel: 'Send for approval',
      description: (
        <div className="space-y-1.5">
          <p>{humanize(t.type)} <Mono>{t.reference}</Mono> · {formatMoney(t.amount)}</p>
          <p>Confirm the real outcome with the provider (SeerBit / VTpass dashboard or support) first. A different admin must approve before anything changes.</p>
          <p className="text-xs">Success completes it; failed {t.type === 'withdrawal' || t.type === 'bill_payment' ? 'refunds the customer’s wallet' : isDeposit ? 'credits nothing (refund at SeerBit)' : 'cancels and restocks the order'}.</p>
        </div>
      ),
      fields: [
        { name: 'outcome', label: 'What really happened?', type: 'select', required: true, options: [{ value: 'success', label: 'It succeeded' }, { value: 'failed', label: 'It failed' }] },
        ...(isDeposit ? [{ name: 'amount', label: 'Amount SeerBit actually received (₦) — needed for success', type: 'number' as const }] : []),
      ],
      requireNote: true, noteLabel: 'How was it confirmed?', notePlaceholder: 'e.g. SeerBit ticket #4411: credited at GTBank on 12 Oct',
    });
    if (!ok) return;
    await run(`propose-${t.reference}`, () => adminApiClient.post('/admin/approvals', {
      type: 'review_resolve', reference: t.reference, note: ok.note,
      payload: { outcome: ok.values.outcome, ...(ok.values.amount ? { amount: Number(ok.values.amount) } : {}) },
    }), 'Outcome sent for approval');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Stuck payments"
        description="Payouts and bills with no final answer from the provider after 24 hours, and card deposits or orders with the wrong amount. They are never auto-refunded. Recheck first; if the provider still can’t say, confirm with them and propose the outcome."
        actions={<Button icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Button>}
      />
      <DataTable
        rows={data?.items}
        loading={isLoading || isFetching}
        error={error}
        onRetry={() => refetch()}
        rowKey={(t) => t.reference}
        empty={<EmptyState icon={<Hourglass size={18} />} title="Nothing stuck" description="Every payout, bill and deposit has a final answer." />}
        columns={[
          { key: 'ref', header: 'Reference', cell: (t) => <Mono>{t.reference}</Mono> },
          { key: 'type', header: 'Type', cell: (t) => <span>{humanize(t.type)}<br /><span className="text-xs text-(--ad-muted)">{humanize(t.category)}</span></span> },
          { key: 'amount', header: 'Amount', align: 'right', cell: (t) => formatMoney(t.amount) },
          { key: 'customer', header: 'Customer', cell: (t) => t.senderId ? <Link href={adminPath(`/users/${t.senderId}`)} className="text-xs text-[#0f766e] hover:underline">View</Link> : '—' },
          { key: 'age', header: 'Waiting', cell: (t) => <Badge tone={t.ageHours > 72 ? 'danger' : 'warning'}>{t.ageHours}h</Badge> },
          { key: 'created', header: 'Started (WAT)', hideOnMobile: true, cell: (t) => <span className="text-xs text-(--ad-muted)">{formatDateTime(t.createdAt)}</span> },
          {
            key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (t) => {
              const req = openRequest(t.reference);
              return (
                <div className="flex flex-wrap justify-end gap-1.5">
                  <Can perm="review.recheck"><Button size="sm" loading={pending === `recheck-${t.reference}`} onClick={() => recheck(t)}>Recheck</Button></Can>
                  {req ? <Badge tone="info">Awaiting approval ({req.requestedByEmail})</Badge> : (
                    <Can perm="review.request"><Button size="sm" variant="primary" loading={pending === `propose-${t.reference}`} onClick={() => propose(t)}>Propose outcome</Button></Can>
                  )}
                </div>
              );
            },
          },
        ]}
      />
      <p className="mt-2 text-xs text-(--ad-muted)">Proposed outcomes are approved on the <Link href={adminPath('/approvals')} className="text-[#0f766e] hover:underline">Approvals</Link> page.</p>
      {dialog}
    </div>
  );
}
