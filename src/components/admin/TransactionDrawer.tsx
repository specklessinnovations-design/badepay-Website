import React from 'react';
import { Link } from 'wouter';
import { Drawer, KeyValue, StatusBadge, Mono, Button, Card, EmptyState } from './ui';
import { useAdminAction, useAdminQuery } from './hooks';
import { useConfirmAction } from './ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { adminPath } from '@/lib/adminPaths';
import { formatDateTime, formatMoney, humanize, fullName } from '@/lib/adminFormat';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';

export interface AdminTransaction {
  id: string;
  reference: string;
  type: string;
  category?: string;
  status: string;
  amount: string | number;
  fee?: string | number;
  description?: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  senderId?: string | null;
  recipientId?: string | null;
  sender?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
  recipient?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
}

/** Wallet payments BadePay can reverse itself (services/refunds.ts). */
const REFUNDABLE = ['transfer', 'qr_payment', 'store_order'];

/** Provider references and failure reasons worth showing; never the whole raw provider payload. */
const META_KEYS = [
  'providerReference', 'provider', 'seerbitReference', 'payoutId', 'linkingReference', 'requestId', 'vtpassRequestId',
  'failureReason', 'reason', 'reversalReason', 'bankName', 'accountName', 'accountNumber', 'channel', 'via', 'fraudReasons', 'resolution',
];

function metaItems(meta: Record<string, unknown> | null | undefined) {
  if (!meta || typeof meta !== 'object') return [];
  return META_KEYS.filter((k) => meta[k] !== undefined && meta[k] !== null && meta[k] !== '').map((k) => {
    const v = meta[k];
    return { label: humanize(k), value: typeof v === 'object' ? <Mono>{JSON.stringify(v)}</Mono> : String(v) };
  });
}

interface Approval { id: string; type: string; status: string; requestedByEmail: string; requestNote: string; decidedByEmail?: string | null; decisionNote?: string | null; error?: string | null; createdAt: string }

export function TransactionDrawer({ tx, onClose, disputeId }: { tx: AdminTransaction | null; onClose: () => void; disputeId?: string }) {
  const perms = useAdminAuthStore((s) => s.admin?.permissions ?? []);
  const can = (p: string) => perms.includes(p);
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();
  const seeApprovals = ['refunds.request', 'refunds.approve', 'review.request', 'review.approve', 'audit_logs.view'].some(can);
  const approvals = useAdminQuery<{ items: Approval[] }>(tx && seeApprovals ? '/admin/approvals' : null, { reference: tx?.reference ?? '' });

  if (!tx) return null;
  const isMirror = tx.reference.endsWith('-REC');
  const refundable = !isMirror && tx.status === 'success' && REFUNDABLE.includes(tx.type);
  const openRequest = approvals.data?.items.find((a) => a.status === 'pending');

  const requestRefund = async () => {
    const ok = await confirm({
      title: 'Request a refund?',
      description: <>Return <b>{formatMoney(tx.amount)}</b> ({tx.reference}) to the payer. A different admin with approval rights must approve it before any money moves.</>,
      confirmLabel: 'Send for approval', tone: 'danger', requireNote: true, noteLabel: 'Why should this be refunded?',
    });
    if (!ok) return;
    await run('refund', () => adminApiClient.post('/admin/approvals', {
      type: 'refund', reference: tx.reference, note: ok.note, payload: disputeId ? { disputeId } : {},
    }), 'Refund request sent for approval');
  };

  const decideHold = async (decision: 'release' | 'reverse') => {
    const ok = await confirm({
      title: decision === 'release' ? 'Release this payment?' : 'Reverse this payment?',
      description: decision === 'release'
        ? <>The held {formatMoney(tx.amount)} goes through to the recipient (or the payout is sent).</>
        : <>The {formatMoney(tx.amount)} goes back to the payer and the payment is cancelled.</>,
      confirmLabel: decision === 'release' ? 'Release' : 'Reverse', tone: decision === 'release' ? 'success' : 'danger', requireNote: true,
      noteLabel: 'How was this checked?',
    });
    if (!ok) return;
    await run(decision, () => adminApiClient.post(`/admin/fraud/${tx.reference}/${decision}`, { note: ok.note }));
    onClose();
  };

  const party = (p: AdminTransaction['sender'], id?: string | null) =>
    p ? <Link href={adminPath(`/users/${p.id}`)} className="text-[#0f766e] hover:underline">{fullName(p)}</Link>
      : id ? <Link href={adminPath(`/users/${id}`)} className="text-[#0f766e] hover:underline"><Mono>{id.slice(0, 8)}…</Mono></Link> : '—';

  return (
    <Drawer
      open={!!tx}
      onClose={onClose}
      title={<span className="flex items-center gap-2"><Mono>{tx.reference}</Mono><StatusBadge status={tx.status} /></span>}
      footer={(
        <>
          {tx.status === 'held' && can('fraud.decide') && (
            <>
              <Button variant="danger" loading={pending === 'reverse'} onClick={() => decideHold('reverse')}>Reverse</Button>
              <Button variant="success" loading={pending === 'release'} onClick={() => decideHold('release')}>Release</Button>
            </>
          )}
          {tx.status === 'review' && can('review.view') && (
            <Link href={adminPath('/review')}><Button>Open stuck payments</Button></Link>
          )}
          {refundable && can('refunds.request') && (
            <Button variant="danger" disabled={!!openRequest} loading={pending === 'refund'} onClick={requestRefund}
              title={openRequest ? 'A refund request is already waiting for approval' : undefined}>
              Request refund
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </>
      )}
    >
      <div className="space-y-5">
        <div>
          <p className="text-3xl font-bold tabular-nums text-(--ad-fg-strong)">{formatMoney(tx.amount)}</p>
          <p className="text-sm text-(--ad-muted)">{tx.description}</p>
        </div>
        <KeyValue items={[
          { label: 'Type', value: humanize(tx.type) },
          { label: 'Category', value: humanize(tx.category) },
          { label: 'Fee', value: formatMoney(tx.fee ?? 0) },
          { label: 'Currency', value: 'NGN' },
          { label: 'From', value: party(tx.sender, tx.senderId) },
          { label: 'To', value: party(tx.recipient, tx.recipientId) },
          { label: 'Created', value: formatDateTime(tx.createdAt) },
          { label: 'Status', value: <StatusBadge status={tx.status} /> },
        ]} />
        {tx.status === 'pending' && (
          <p className="rounded-lg bg-[rgba(29,78,216,0.08)] px-3 py-2 text-xs text-[#1d4ed8]">
            Pending means BadePay is still waiting for the provider’s final answer. It is not complete until it shows Success.
          </p>
        )}
        {metaItems(tx.metadata).length > 0 && (
          <Card title="Provider & processing details"><KeyValue items={metaItems(tx.metadata)} /></Card>
        )}
        {seeApprovals && (
          <Card title="Approval requests for this payment" bodyClassName="p-0">
            {!approvals.data?.items.length ? <EmptyState title="No requests" /> : (
              <ul className="divide-y divide-(--ad-border)">
                {approvals.data.items.map((a) => (
                  <li key={a.id} className="space-y-0.5 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-(--ad-fg-strong)">{humanize(a.type)}</span><StatusBadge status={a.status} />
                    </div>
                    <p className="text-xs text-(--ad-muted)">Requested by {a.requestedByEmail} · {formatDateTime(a.createdAt)}</p>
                    <p className="text-xs text-(--ad-fg)">“{a.requestNote}”</p>
                    {a.decidedByEmail && <p className="text-xs text-(--ad-muted)">Decided by {a.decidedByEmail}{a.decisionNote ? `: “${a.decisionNote}”` : ''}</p>}
                    {a.error && <p className="text-xs text-[#b91c1c]">Failed: {a.error}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
      {dialog}
    </Drawer>
  );
}
