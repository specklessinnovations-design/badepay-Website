import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, Store } from 'lucide-react';
import {
  PageHeader, Card, KeyValue, StatusBadge, Badge, Button, Tabs, DataTable, Timeline, Spinner, ErrorState, Mono, EmptyState,
} from '@/components/admin/ui';
import { useAdminQuery, useAdminAction } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import { AdminTransaction, TransactionDrawer } from '@/components/admin/TransactionDrawer';
import { KycChecks, KycSubmission } from '@/components/admin/KycChecks';
import adminApiClient from '@/lib/adminApiClient';
import { adminPath } from '@/lib/adminPaths';
import { formatDate, formatDateTime, formatMoney, formatRelative, fullName, humanize } from '@/lib/adminFormat';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';

interface UserDetail {
  user: {
    id: string; firstName: string; lastName: string; email: string; phone: string | null; userType: string;
    kycLevel: number; kycStatus: string; isActive: boolean; bvnVerified: boolean; ninVerified: boolean; twoFactorActive: boolean;
    accountNumber: string | null; dateOfBirth: string | null; location: string | null; createdAt: string; lastLoginAt: string | null;
    pinLockedUntil: string | null; loginLockedUntil: string | null; deletionRequestedAt: string | null; deletedAt: string | null;
    hasPassword: boolean; hasTransactionPin: boolean;
    wallet: { id: string; balance: string | null; isLocked: boolean; currency?: string } | null;
    merchantProfile: { id: string; businessName: string; tradingName?: string | null; verified: boolean; wallet?: { balance: string | null; isLocked: boolean } | null } | null;
    disputes: { id: string; ticketNumber: string; issueType: string; status: string; priority: string; createdAt: string }[];
  };
  transactions: AdminTransaction[];
  transactionSummary: { count: number; totalSent: number };
}

interface TimelineEvent { at: string; kind: string; title: string; detail?: string | null; actor?: string | null; ref?: string }
type Tab = 'overview' | 'transactions' | 'kyc' | 'tickets' | 'timeline';

const KIND_TONE: Record<string, 'accent' | 'info' | 'warning' | 'danger' | 'neutral'> = { admin: 'warning', kyc: 'info', ticket: 'accent', account: 'neutral' };

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const perms = useAdminAuthStore((s) => s.admin?.permissions ?? []);
  const can = (p: string) => perms.includes(p);
  const [tab, setTab] = useState<Tab>('overview');
  const [tx, setTx] = useState<AdminTransaction | null>(null);
  const { data, isLoading, error, refetch } = useAdminQuery<UserDetail>(`/admin/users/${id}`);
  const kyc = useAdminQuery<KycSubmission[]>(can('kyc.view') && tab === 'kyc' ? `/admin/users/${id}/kyc` : null);
  const timeline = useAdminQuery<TimelineEvent[]>(tab === 'timeline' ? `/admin/users/${id}/timeline` : null);
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();

  if (isLoading) return <Spinner />;
  if (error || !data) return <Card><ErrorState error={error} onRetry={() => refetch()} /></Card>;
  const u = data.user;
  const name = fullName(u);
  const closed = !!u.deletedAt;

  const setStatus = async (action: 'ban' | 'unban' | 'lock_wallet' | 'unlock_wallet') => {
    const copy = {
      ban: { title: 'Suspend account?', confirmLabel: 'Suspend', desc: 'They will be signed out and blocked from signing in and paying until reactivated.', danger: true },
      unban: { title: 'Reactivate account?', confirmLabel: 'Reactivate', desc: 'They will be able to sign in and pay again.', danger: false },
      lock_wallet: { title: 'Lock wallet?', confirmLabel: 'Lock wallet', desc: 'No money can leave this wallet until it is unlocked. Incoming payments still arrive.', danger: true },
      unlock_wallet: { title: 'Unlock wallet?', confirmLabel: 'Unlock wallet', desc: 'They will be able to send and withdraw again.', danger: false },
    }[action];
    const ok = await confirm({
      title: copy.title, confirmLabel: copy.confirmLabel, tone: copy.danger ? 'danger' : 'success',
      description: <><b>{name}</b>: {copy.desc}</>,
      ...(copy.danger ? { requireNote: true, noteLabel: 'Reason' } : { optionalNote: true, noteLabel: 'Comment' }),
    });
    if (!ok) return;
    await run(action, () => adminApiClient.patch(`/admin/users/${u.id}/status`, { action, reason: ok.note }));
  };

  const overrideKyc = async () => {
    const ok = await confirm({
      title: 'Change KYC level manually?',
      description: <>Prembly sets levels 1–2 automatically. Use this only for level 3 or corrections. Current: level {u.kycLevel} ({humanize(u.kycStatus)}).</>,
      confirmLabel: 'Change level', tone: 'danger', requireNote: true, noteLabel: 'Reason and evidence', stepUp: true,
      fields: [
        { name: 'status', label: 'New status', type: 'select', required: true, options: [{ value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: 'pending', label: 'Pending' }] },
        { name: 'level', label: 'Level (if approved)', type: 'select', options: [0, 1, 2, 3].map((l) => ({ value: String(l), label: `Level ${l}` })), defaultValue: '3' },
      ],
    });
    if (!ok) return;
    await run('kyc', () => adminApiClient.patch(`/admin/users/${u.id}/kyc`, {
      kycStatus: ok.values.status, kycLevel: ok.values.status === 'approved' ? Number(ok.values.level) : undefined, reason: ok.note,
    }, { otp: ok.otp }), 'KYC updated');
  };

  return (
    <div>
      <Link href={adminPath('/users')} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-(--ad-muted) hover:text-(--ad-fg-strong)">
        <ArrowLeft size={13} /> Users
      </Link>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-2">{name}<StatusBadge status={closed ? 'closed' : u.isActive ? 'active' : 'suspended'} />{u.userType === 'merchant' && <Badge tone="accent">Business</Badge>}</span>}
        description={<>{u.email}{u.phone ? ` · ${u.phone}` : ''} · joined {formatDate(u.createdAt)} · last sign-in {u.lastLoginAt ? formatRelative(u.lastLoginAt) : 'never'}</>}
        actions={!closed && (
          <>
            {u.merchantProfile && can('merchants.view') && (
              <Link href={adminPath(`/merchants/${u.id}`)}><Button icon={<Store size={14} />}>Merchant view</Button></Link>
            )}
            {can('wallets.lock') && u.wallet && (
              <Button loading={pending === 'lock_wallet' || pending === 'unlock_wallet'} onClick={() => setStatus(u.wallet!.isLocked ? 'unlock_wallet' : 'lock_wallet')}>
                {u.wallet.isLocked ? 'Unlock wallet' : 'Lock wallet'}
              </Button>
            )}
            {can('kyc.override') && <Button loading={pending === 'kyc'} onClick={overrideKyc}>Change KYC</Button>}
            {can('users.manage') && (
              <Button variant={u.isActive ? 'danger' : 'success'} loading={pending === 'ban' || pending === 'unban'} onClick={() => setStatus(u.isActive ? 'ban' : 'unban')}>
                {u.isActive ? 'Suspend' : 'Reactivate'}
              </Button>
            )}
          </>
        )}
      />

      {closed && <p className="mb-4 rounded-lg bg-[rgba(15,23,42,0.06)] px-3 py-2 text-sm">This account was closed on {formatDateTime(u.deletedAt)}. Records are kept; nothing can be changed.</p>}
      {u.deletionRequestedAt && !closed && (
        <p className="mb-4 rounded-lg bg-[rgba(180,83,9,0.10)] px-3 py-2 text-sm text-[#92400e]">
          The customer asked to close this account {formatRelative(u.deletionRequestedAt)}. <Link href={adminPath('/closures')} className="font-semibold underline">Review closure requests</Link>
        </p>
      )}

      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'overview', label: 'Overview' },
        { value: 'transactions', label: 'Transactions', count: data.transactionSummary.count },
        { value: 'kyc', label: 'KYC checks', hidden: !can('kyc.view') },
        { value: 'tickets', label: 'Tickets', count: u.disputes.length },
        { value: 'timeline', label: 'Timeline' },
      ]} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Profile" className="lg:col-span-2">
            <KeyValue items={[
              { label: 'Customer ID', value: <Mono>{u.id}</Mono> },
              { label: 'Account number', value: u.accountNumber ? <Mono>{u.accountNumber}</Mono> : '—' },
              { label: 'Account type', value: u.userType === 'merchant' ? 'Business' : 'Personal' },
              { label: 'Date of birth', value: formatDate(u.dateOfBirth) },
              { label: 'KYC', value: <span className="flex items-center gap-1.5"><StatusBadge status={u.kycStatus} /> Level {u.kycLevel}</span> },
              { label: 'BVN / NIN', value: `${u.bvnVerified ? 'BVN verified' : 'BVN not verified'} · ${u.ninVerified ? 'NIN verified' : 'NIN not verified'}` },
              { label: 'Location', value: u.location ?? '—' },
              { label: 'Joined', value: formatDateTime(u.createdAt) },
            ]} />
          </Card>
          <Card title="Security">
            <KeyValue columns={1} items={[
              { label: 'Two-factor', value: u.twoFactorActive ? <Badge tone="success">On</Badge> : <Badge>Off</Badge> },
              { label: 'Transaction PIN', value: u.hasTransactionPin ? 'Set' : 'Not set' },
              { label: 'PIN lock', value: u.pinLockedUntil && new Date(u.pinLockedUntil) > new Date() ? <Badge tone="danger">Locked until {formatDateTime(u.pinLockedUntil)}</Badge> : 'None' },
              { label: 'Sign-in lock', value: u.loginLockedUntil && new Date(u.loginLockedUntil) > new Date() ? <Badge tone="danger">Locked until {formatDateTime(u.loginLockedUntil)}</Badge> : 'None' },
            ]} />
          </Card>
          <Card title="Wallets" className="lg:col-span-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-(--ad-border) p-3">
                <p className="text-xs text-(--ad-muted)">Personal wallet</p>
                <p className="text-xl font-bold tabular-nums text-(--ad-fg-strong)">{can('wallets.view') ? formatMoney(u.wallet?.balance) : 'Hidden'}</p>
                {u.wallet?.isLocked && <Badge tone="danger">Locked</Badge>}
              </div>
              {u.merchantProfile && (
                <div className="rounded-lg border border-(--ad-border) p-3">
                  <p className="text-xs text-(--ad-muted)">Business wallet · {u.merchantProfile.tradingName || u.merchantProfile.businessName}</p>
                  <p className="text-xl font-bold tabular-nums text-(--ad-fg-strong)">{can('wallets.view') ? formatMoney(u.merchantProfile.wallet?.balance) : 'Hidden'}</p>
                </div>
              )}
              <div className="rounded-lg border border-(--ad-border) p-3">
                <p className="text-xs text-(--ad-muted)">Total sent (successful)</p>
                <p className="text-xl font-bold tabular-nums text-(--ad-fg-strong)">{formatMoney(data.transactionSummary.totalSent)}</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-(--ad-muted)">Balances come from the ledger-backed wallet records. They can’t be edited here; money only moves through payments, refunds and reversals.</p>
          </Card>
        </div>
      )}

      {tab === 'transactions' && (
        <>
          <DataTable
            rows={data.transactions}
            rowKey={(t) => t.id}
            onRowClick={setTx}
            empty={<EmptyState title="No transactions yet" />}
            columns={[
              { key: 'ref', header: 'Reference', cell: (t) => <Mono>{t.reference}</Mono> },
              { key: 'type', header: 'Type', cell: (t) => humanize(t.type) },
              { key: 'dir', header: 'Direction', cell: (t) => (t.senderId === u.id ? <Badge tone="warning">Out</Badge> : <Badge tone="success">In</Badge>) },
              { key: 'amount', header: 'Amount', align: 'right', cell: (t) => formatMoney(t.amount) },
              { key: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
              { key: 'time', header: 'Time (WAT)', hideOnMobile: true, cell: (t) => <span className="text-xs text-(--ad-muted)">{formatDateTime(t.createdAt)}</span> },
            ]}
          />
          <p className="mt-2 text-xs text-(--ad-muted)">Showing the {data.transactions.length} most recent. <Link href={adminPath(`/transactions?search=${encodeURIComponent(u.email)}`)} className="text-[#0f766e] hover:underline">Search all transactions for this customer →</Link></p>
        </>
      )}

      {tab === 'kyc' && <KycChecks loading={kyc.isLoading} error={kyc.error} items={kyc.data} onRetry={() => kyc.refetch()} />}

      {tab === 'tickets' && (
        <DataTable
          rows={u.disputes}
          rowKey={(d) => d.id}
          onRowClick={can('tickets.view') ? (d) => navigate(adminPath(`/tickets/${d.id}`)) : undefined}
          empty={<EmptyState title="No tickets" />}
          columns={[
            { key: 'n', header: 'Ticket', cell: (d) => <Mono>{d.ticketNumber}</Mono> },
            { key: 'issue', header: 'Issue', cell: (d) => humanize(d.issueType) },
            { key: 'priority', header: 'Priority', cell: (d) => humanize(d.priority) },
            { key: 'status', header: 'Status', cell: (d) => <StatusBadge status={d.status} /> },
            { key: 'created', header: 'Raised', cell: (d) => <span className="text-xs text-(--ad-muted)">{formatDateTime(d.createdAt)}</span> },
          ]}
        />
      )}

      {tab === 'timeline' && (
        <Card>
          {timeline.isLoading ? <Spinner /> : timeline.error ? <ErrorState error={timeline.error} onRetry={() => timeline.refetch()} /> : (
            <Timeline
              formatTime={formatDateTime}
              items={(timeline.data ?? []).map((e, i) => ({
                id: `${e.ref ?? e.kind}-${i}`, at: e.at, title: e.title, detail: e.detail ? `“${e.detail}”` : undefined,
                actor: e.actor ?? undefined, tone: KIND_TONE[e.kind] ?? 'neutral',
              }))}
            />
          )}
        </Card>
      )}

      <TransactionDrawer tx={tx} onClose={() => setTx(null)} />
      {dialog}
    </div>
  );
}
