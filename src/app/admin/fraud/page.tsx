import React, { useState } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { PageHeader, DataTable, Button, Mono, Badge, EmptyState, Can } from '@/components/admin/ui';
import { useAdminQuery, useAdminAction } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import { AdminTransaction, TransactionDrawer } from '@/components/admin/TransactionDrawer';
import adminApiClient from '@/lib/adminApiClient';
import { formatDateTime, formatMoney, formatRelative, fullName, humanize } from '@/lib/adminFormat';

type Held = AdminTransaction & { sender: { id: string; email: string; firstName: string; lastName: string; kycLevel: number } | null };

export default function FraudPage() {
  const { data, isLoading, isFetching, error, refetch } = useAdminQuery<{ held: Held[] }>('/admin/fraud/held', undefined, { refetchInterval: 60_000 });
  const [open, setOpen] = useState<Held | null>(null);
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();

  const decide = async (t: Held, decision: 'release' | 'reverse') => {
    const ok = await confirm({
      title: decision === 'release' ? 'Release this payment?' : 'Reverse this payment?',
      tone: decision === 'release' ? 'success' : 'danger', confirmLabel: decision === 'release' ? 'Release' : 'Reverse',
      description: decision === 'release'
        ? <>{formatMoney(t.amount)} from {fullName(t.sender)} goes through. Release only after confirming the customer made it.</>
        : <>{formatMoney(t.amount)} goes back to {fullName(t.sender)} and the payment is cancelled.</>,
      requireNote: true, noteLabel: 'How did you check?', notePlaceholder: 'e.g. Called the customer on their registered number; confirmed',
    });
    if (!ok) return;
    await run(`${decision}-${t.reference}`, () => adminApiClient.post(`/admin/fraud/${t.reference}/${decision}`, { note: ok.note }),
      decision === 'release' ? 'Payment released' : 'Payment reversed');
  };

  const reasons = (t: Held) => {
    const r = (t.metadata as { heldReasons?: string[]; fraudReasons?: string[] } | null);
    return r?.heldReasons ?? r?.fraudReasons ?? [];
  };

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Fraud holds"
        description="Payments stopped by fraud rules (unusual velocity, a large payment from a new device, or a large first payment to a new recipient). Held money hasn’t reached the recipient; nothing moves until someone decides. Rules are in Settings → Fraud."
        actions={<Button icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Button>}
      />
      <DataTable
        rows={data?.held}
        loading={isLoading || isFetching}
        error={error}
        onRetry={() => refetch()}
        rowKey={(t) => t.id}
        onRowClick={setOpen}
        empty={<EmptyState icon={<ShieldAlert size={18} />} title="No held payments" description="Payments held by fraud rules appear here." />}
        columns={[
          { key: 'ref', header: 'Reference', cell: (t) => <Mono>{t.reference}</Mono> },
          { key: 'who', header: 'Sender', cell: (t) => <span className="text-sm">{fullName(t.sender)}<br /><span className="text-xs text-(--ad-muted)">KYC level {t.sender?.kycLevel ?? '—'}</span></span> },
          { key: 'type', header: 'Type', cell: (t) => humanize(t.type) },
          { key: 'amount', header: 'Amount', align: 'right', cell: (t) => <span className="font-semibold">{formatMoney(t.amount)}</span> },
          { key: 'why', header: 'Why held', cell: (t) => <div className="flex max-w-xs flex-wrap gap-1">{reasons(t).length ? reasons(t).map((r) => <Badge key={r} tone="warning">{r}</Badge>) : <span className="text-xs text-(--ad-muted)">See details</span>}</div> },
          { key: 'age', header: 'Held for', cell: (t) => <span className="text-xs text-(--ad-muted)" title={formatDateTime(t.createdAt)}>{formatRelative(t.createdAt).replace(' ago', '')}</span> },
          {
            key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (t) => (
              <Can perm="fraud.decide">
                <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="danger" loading={pending === `reverse-${t.reference}`} onClick={() => decide(t, 'reverse')}>Reverse</Button>
                  <Button size="sm" variant="success" loading={pending === `release-${t.reference}`} onClick={() => decide(t, 'release')}>Release</Button>
                </div>
              </Can>
            ),
          },
        ]}
      />
      <TransactionDrawer tx={open} onClose={() => setOpen(null)} />
      {dialog}
    </div>
  );
}
