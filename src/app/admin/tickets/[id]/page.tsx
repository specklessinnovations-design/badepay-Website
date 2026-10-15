import React, { useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Lock, MessageSquare, Send } from 'lucide-react';
import {
  Card, KeyValue, StatusBadge, Badge, Button, Spinner, ErrorState, Mono, Select, Timeline, TextArea, EmptyState,
} from '@/components/admin/ui';
import { useAdminQuery, useAdminAction } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import { AdminTransaction, TransactionDrawer } from '@/components/admin/TransactionDrawer';
import adminApiClient from '@/lib/adminApiClient';
import { adminPath } from '@/lib/adminPaths';
import { formatDateTime, formatMoney, formatRelative, fullName, humanize } from '@/lib/adminFormat';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { PRIORITY_TONE, SlaBadge, TicketRow } from '../page';

interface Message { id: string; authorType: 'customer' | 'admin'; authorId: string; authorName: string | null; body: string; internal: boolean; createdAt: string }
interface Event { id: string; type: string; actorType: string; actorName: string | null; data: Record<string, unknown> | null; createdAt: string }
interface TicketDetail extends Omit<TicketRow, 'user'> {
  description: string; transactionId: string; resolutionNote: string | null; resolvedBy: string | null; refundReference: string | null;
  user: TicketRow['user'] & { phone: string | null; accountNumber: string | null; kycLevel: number; isActive: boolean };
  messages: Message[];
  events: Event[];
  transaction: (AdminTransaction & { recipient?: AdminTransaction['recipient'] }) | null;
  refundRequest: { status: string; requestedByEmail: string; decidedByEmail: string | null; error: string | null } | null;
}

const EVENT_TEXT: Record<string, (e: Event) => string> = {
  created: () => 'Ticket raised by the customer',
  admin_replied: () => 'Replied to the customer',
  customer_replied: () => 'Customer replied',
  internal_note: () => 'Internal note added',
  status_changed: (e) => `Status: ${humanize(String(e.data?.from))} → ${humanize(String(e.data?.to))}`,
  reopened: (e) => `Reopened (${humanize(String(e.data?.from))} → ${humanize(String(e.data?.to))})`,
  priority_changed: (e) => `Priority: ${humanize(String(e.data?.from))} → ${humanize(String(e.data?.to))}`,
  assigned: (e) => `Assigned to ${e.data?.to}${e.data?.from ? ` (was ${e.data.from})` : ''}`,
  unassigned: (e) => `Unassigned${e.data?.from ? ` from ${e.data.from}` : ''}`,
  escalated: () => 'Escalated',
  de_escalated: () => 'De-escalated',
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const me = useAdminAuthStore((s) => s.admin);
  const can = (p: string) => !!me?.permissions.includes(p);
  const { data: t, isLoading, error, refetch } = useAdminQuery<TicketDetail>(`/admin/tickets/${id}`, undefined, { refetchInterval: 30_000 });
  const assignees = useAdminQuery<{ id: string; name: string }[]>(can('tickets.assign') ? '/admin/tickets/assignees' : null);
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();
  const [mode, setMode] = useState<'reply' | 'note' | null>(null);
  const [body, setBody] = useState('');
  const [txOpen, setTxOpen] = useState(false);

  if (isLoading) return <Spinner />;
  if (error || !t) return <Card><ErrorState error={error} onRetry={() => refetch()} /></Card>;

  const final = ['resolved', 'closed', 'rejected', 'cancelled'].includes(t.status);
  const composer = mode ?? (final ? 'note' : 'reply');
  const manage = can('tickets.manage');

  const send = async () => {
    const internal = composer === 'note';
    const ok = await run('send', () => adminApiClient.post(`/admin/tickets/${t.id}/messages`, { body, internal }), internal ? 'Internal note saved' : 'Reply sent to the customer');
    if (ok) setBody('');
  };

  const setStatus = async (status: string) => {
    const needsNote = ['resolved', 'closed', 'rejected'].includes(status);
    if (needsNote) {
      const ok = await confirm({
        title: status === 'resolved' ? 'Resolve ticket?' : status === 'rejected' ? 'Reject ticket?' : 'Close ticket?',
        tone: status === 'resolved' ? 'success' : 'danger',
        confirmLabel: humanize(status === 'resolved' ? 'resolve' : status === 'rejected' ? 'reject' : 'close'),
        description: <>The customer is notified with your note. They can’t reply after this unless you reopen it.</>,
        requireNote: true, noteLabel: 'Resolution note (sent to the customer)',
      });
      if (!ok) return;
      await run('status', () => adminApiClient.patch(`/admin/tickets/${t.id}`, { status, resolutionNote: ok.note }));
    } else {
      await run('status', () => adminApiClient.patch(`/admin/tickets/${t.id}`, { status }), `Ticket ${final ? 'reopened' : 'updated'}`);
    }
  };

  const assign = (assigneeId: string | null) => run('assign', () => adminApiClient.post(`/admin/tickets/${t.id}/assign`, { assigneeId }), assigneeId ? 'Ticket assigned' : 'Ticket unassigned');

  return (
    <div>
      <Link href={adminPath('/tickets')} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-(--ad-muted) hover:text-(--ad-fg-strong)">
        <ArrowLeft size={13} /> Tickets
      </Link>
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-[22px] font-bold tracking-tight text-(--ad-fg-strong)">
            <Mono>{t.ticketNumber}</Mono> <StatusBadge status={t.status} />
            <Badge tone={PRIORITY_TONE[t.priority] ?? 'neutral'}>{humanize(t.priority)} priority</Badge>
            {t.escalated && <Badge tone="danger">Escalated</Badge>}
            <SlaBadge t={t} />
          </h1>
          <p className="mt-1 text-sm text-(--ad-muted)">
            {humanize(t.issueType)} · {formatMoney(t.amount)} · raised {formatDateTime(t.createdAt)} ({formatRelative(t.createdAt)})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title="Conversation" description="Internal notes are only visible to admins." bodyClassName="p-0">
            <ol className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
              {t.messages.map((m) => (
                <li key={m.id} className={`flex ${m.authorType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl border px-3.5 py-2.5 ${
                    m.internal ? 'border-[rgba(180,83,9,0.35)] bg-[rgba(251,191,36,0.10)]'
                      : m.authorType === 'admin' ? 'border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.06)]' : 'border-(--ad-border) bg-(--ad-bg-elev)'}`}>
                    <p className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-(--ad-muted)">
                      {m.internal && <Badge tone="warning"><Lock size={10} /> Internal note</Badge>}
                      {m.authorName ?? (m.authorType === 'customer' ? 'Customer' : 'Admin')}
                      <span className="font-normal">· {m.authorType === 'customer' ? 'customer' : 'BadePay'} · {formatDateTime(m.createdAt)}</span>
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-(--ad-fg-strong)">{m.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            {manage && (
              <div className="border-t border-(--ad-border) p-4">
                <div className="mb-2 flex gap-1">
                  <Button size="sm" variant={composer === 'reply' ? 'primary' : 'ghost'} icon={<MessageSquare size={13} />} onClick={() => setMode('reply')} disabled={final}>Reply to customer</Button>
                  <Button size="sm" variant={composer === 'note' ? 'primary' : 'ghost'} icon={<Lock size={13} />} onClick={() => setMode('note')}>Internal note</Button>
                </div>
                {final && composer === 'reply' ? (
                  <p className="text-xs text-(--ad-muted)">This ticket is {t.status}. Reopen it to reply to the customer.</p>
                ) : (
                  <>
                    <TextArea
                      rows={4}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      aria-label={composer === 'reply' ? 'Reply to the customer' : 'Internal note'}
                      placeholder={composer === 'reply' ? 'Write to the customer. They get a notification.' : 'Only admins see this. Use it for findings and hand-over notes.'}
                      className={composer === 'note' ? 'border-[rgba(180,83,9,0.4)] bg-[rgba(251,191,36,0.06)]' : ''}
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-(--ad-muted)">{composer === 'reply' ? 'Visible to the customer' : 'Not visible to the customer'}</p>
                      <Button variant={composer === 'reply' ? 'primary' : 'secondary'} icon={<Send size={13} />} loading={pending === 'send'} disabled={!body.trim()} onClick={send}>
                        {composer === 'reply' ? 'Send reply' : 'Save note'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>

          {t.resolutionNote && (
            <Card title="Resolution">
              <p className="whitespace-pre-wrap text-sm">{t.resolutionNote}</p>
              <p className="mt-1 text-xs text-(--ad-muted)">By {t.resolvedBy} · {formatDateTime(t.resolvedAt)}</p>
            </Card>
          )}

          <Card title="Activity">
            <Timeline
              formatTime={formatDateTime}
              items={t.events.map((e) => ({
                id: e.id, at: e.createdAt, title: (EVENT_TEXT[e.type] ?? (() => humanize(e.type)))(e),
                actor: e.actorName ?? undefined,
                detail: typeof e.data?.note === 'string' ? `“${e.data.note}”` : undefined,
                tone: e.type === 'escalated' ? 'danger' : e.type.includes('status') || e.type === 'reopened' ? 'info' : e.actorType === 'customer' ? 'accent' : 'neutral',
              }))}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Handling">
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-(--ad-muted)">Assigned to</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-(--ad-fg-strong)">{t.assignedTo?.name ?? 'Nobody'}</span>
                  {manage && t.assignedTo?.id !== me?.id && <Button size="sm" loading={pending === 'assign'} onClick={() => assign(me!.id)}>Take it</Button>}
                </div>
                {can('tickets.assign') && (
                  <Select className="mt-2" aria-label="Assign to" value={t.assignedTo?.id ?? ''} onChange={(e) => void assign(e.target.value || null)}
                    options={[{ value: '', label: 'Unassigned' }, ...(assignees.data ?? []).map((a) => ({ value: a.id, label: a.name }))]} />
                )}
              </div>
              {manage && (
                <>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-(--ad-muted)">Priority</p>
                    <Select aria-label="Priority" value={t.priority} onChange={(e) => void run('priority', () => adminApiClient.patch(`/admin/tickets/${t.id}`, { priority: e.target.value }), 'Priority changed')}
                      options={['critical', 'high', 'medium', 'low'].map((p) => ({ value: p, label: humanize(p) }))} />
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-(--ad-border) pt-3">
                    {!final ? (
                      <>
                        {t.status === 'open' && <Button size="sm" loading={pending === 'status'} onClick={() => setStatus('under_review')}>Mark under review</Button>}
                        <Button size="sm" variant="success" onClick={() => setStatus('resolved')}>Resolve</Button>
                        <Button size="sm" variant="danger" onClick={() => setStatus('rejected')}>Reject</Button>
                        <Button size="sm" onClick={() => setStatus('closed')}>Close</Button>
                      </>
                    ) : t.status !== 'cancelled' && <Button size="sm" loading={pending === 'status'} onClick={() => setStatus('under_review')}>Reopen</Button>}
                    <Button size="sm" variant={t.escalated ? 'secondary' : 'danger'} loading={pending === 'esc'}
                      onClick={() => run('esc', () => adminApiClient.patch(`/admin/tickets/${t.id}`, { escalated: !t.escalated }), t.escalated ? 'De-escalated' : 'Escalated')}>
                      {t.escalated ? 'De-escalate' : 'Escalate'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card title="Customer" actions={can('users.view') && <Link href={adminPath(`/users/${t.user.id}`)} className="text-xs font-semibold text-[#0f766e] hover:underline">Profile →</Link>}>
            <KeyValue columns={1} items={[
              { label: 'Name', value: fullName(t.user) },
              { label: 'Contact', value: [t.user.email, t.user.phone].filter(Boolean).join(' · ') },
              { label: 'Account', value: <>{t.user.userType === 'merchant' ? 'Business' : 'Personal'} · KYC level {t.user.kycLevel} · <StatusBadge status={t.user.isActive ? 'active' : 'suspended'} /></> },
            ]} />
          </Card>

          <Card title="Disputed transaction">
            {!t.transaction ? <EmptyState title="Transaction not found" /> : (
              <>
                <KeyValue columns={1} items={[
                  { label: 'Reference', value: <Mono>{t.transaction.reference}</Mono> },
                  { label: 'Amount', value: formatMoney(t.transaction.amount) },
                  { label: 'Type', value: humanize(t.transaction.type) },
                  { label: 'Status', value: <StatusBadge status={t.transaction.status} /> },
                  { label: 'Time', value: formatDateTime(t.transaction.createdAt) },
                ]} />
                {t.refundReference && <p className="mt-3 rounded-lg bg-[rgba(4,120,87,0.08)] px-3 py-2 text-xs text-[#047857]">Refunded: <Mono>{t.refundReference}</Mono></p>}
                {t.refundRequest && !t.refundReference && (
                  <p className="mt-3 text-xs text-(--ad-muted)">Refund request <StatusBadge status={t.refundRequest.status} /> by {t.refundRequest.requestedByEmail}{t.refundRequest.error ? ` — ${t.refundRequest.error}` : ''}</p>
                )}
                {can('transactions.view') && <Button size="sm" className="mt-3" onClick={() => setTxOpen(true)}>Open transaction</Button>}
              </>
            )}
          </Card>
        </div>
      </div>

      <TransactionDrawer tx={txOpen ? t.transaction : null} onClose={() => setTxOpen(false)} disputeId={t.id} />
      {dialog}
    </div>
  );
}
