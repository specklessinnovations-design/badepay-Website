import React, { useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, User } from 'lucide-react';
import {
  PageHeader, Card, KeyValue, StatusBadge, Badge, Button, Tabs, DataTable, Spinner, ErrorState, Mono, EmptyState, Can,
} from '@/components/admin/ui';
import { useAdminQuery, useAdminAction } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import { AdminTransaction, TransactionDrawer } from '@/components/admin/TransactionDrawer';
import adminApiClient from '@/lib/adminApiClient';
import { adminPath } from '@/lib/adminPaths';
import { formatDate, formatDateTime, formatMoney, fullName, humanize } from '@/lib/adminFormat';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';

interface MerchantDetail {
  user: {
    id: string; firstName: string; lastName: string; email: string; phone: string | null; isActive: boolean; createdAt: string; deletedAt: string | null;
    merchantProfile: {
      id: string; businessName: string; tradingName: string | null; businessType: string; category: string; address: string;
      rcNumber: string | null; taxId: string | null; verified: boolean; contactEmail: string | null; contactPhone: string | null;
      merchantAccountNumber: string | null; qrSlug: string;
      payoutSchedule: string; payoutWeekday: number | null; payoutMonthDay: number | null; payoutMinimum: string; payoutReserve: string;
      payoutAccountName: string | null; payoutAccountNumber: string | null; payoutBankName: string | null;
      payoutAccountVerifiedAt: string | null; payoutAccountChangedAt: string | null;
      payoutsPausedAt: string | null; payoutsPausedReason: string | null; seerbitSubAccountCode: string | null;
      wallet: { balance: string | null; isLocked: boolean } | null;
      store: {
        id: string; name: string; slug: string; isActive?: boolean;
        products: { id: string; name: string; price: string; stock?: number; isActive?: boolean }[];
        orders: { id: string; reference?: string; totalAmount: string; status: string; paymentStatus?: string; createdAt: string }[];
      } | null;
    };
  };
  transactions: AdminTransaction[];
  merchantTransactions: AdminTransaction[];
  revenueSummary: { count: number; totalRevenue: number };
}

interface Settlement { id: string; reference: string; trigger: string; amount: string; fee: string; status: string; accountNumber: string; bankName: string | null; failureReason: string | null; createdAt: string; completedAt: string | null }

type Tab = 'overview' | 'payments' | 'settlements' | 'store';
const WEEKDAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const perms = useAdminAuthStore((s) => s.admin?.permissions ?? []);
  const can = (p: string) => perms.includes(p);
  const [tab, setTab] = useState<Tab>('overview');
  const [tx, setTx] = useState<AdminTransaction | null>(null);
  const { data, isLoading, error, refetch } = useAdminQuery<MerchantDetail>(`/admin/merchants/${id}`);
  const profileId = data?.user.merchantProfile.id;
  const settlements = useAdminQuery<{ settlements: Settlement[] }>(
    tab === 'settlements' && profileId && can('settlements.view') ? '/admin/settlements' : null, { merchantId: profileId ?? '', limit: 100 },
  );
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();

  if (isLoading) return <Spinner />;
  if (error || !data) return <Card><ErrorState error={error} onRetry={() => refetch()} /></Card>;
  const u = data.user;
  const mp = u.merchantProfile;
  const name = mp.tradingName || mp.businessName;

  const verify = async () => {
    const ok = await confirm({
      title: 'Verify this business?', tone: 'success', confirmLabel: 'Verify merchant', requireNote: true, noteLabel: 'What did you check?',
      description: <>Mark <b>{name}</b> as verified. Check the registration ({mp.rcNumber ?? 'no RC number on file'}) first.</>,
    });
    if (ok) await run('verify', () => adminApiClient.post(`/admin/merchants/${u.id}/verify`, { note: ok.note }));
  };
  const toggleAccount = async () => {
    const ok = await confirm(u.isActive
      ? { title: 'Suspend merchant account?', tone: 'danger', confirmLabel: 'Suspend', requireNote: true, description: <><b>{name}</b> will be signed out and can’t take or send payments.</> }
      : { title: 'Reactivate merchant account?', tone: 'success', confirmLabel: 'Reactivate', optionalNote: true, noteLabel: 'Comment', description: <><b>{name}</b> can sign in and trade again.</> });
    if (ok) await run('account', () => adminApiClient.patch(`/admin/users/${u.id}/status`, { action: u.isActive ? 'ban' : 'unban', reason: ok.note }));
  };
  const pause = async () => {
    const ok = await confirm({ title: 'Pause payouts?', tone: 'danger', confirmLabel: 'Pause payouts', requireNote: true, description: <>No automatic or manual payouts to <b>{name}</b>’s bank until resumed. Money stays in their business wallet.</> });
    if (ok) await run('pause', () => adminApiClient.post(`/admin/merchants/${mp.id}/payouts/pause`, { reason: ok.note }));
  };
  const resume = async () => {
    const ok = await confirm({ title: 'Resume payouts?', tone: 'success', confirmLabel: 'Resume', optionalNote: true, noteLabel: 'Comment', stepUp: true, description: <>Payouts to <b>{name}</b> continue on their {humanize(mp.payoutSchedule)} schedule.</> });
    if (ok) await run('resume', () => adminApiClient.post(`/admin/merchants/${mp.id}/payouts/resume`, { note: ok.note }, { otp: ok.otp }));
  };
  const payNow = async () => {
    const ok = await confirm({
      title: 'Pay out now?', tone: 'danger', confirmLabel: 'Start payout', requireNote: true, stepUp: true, noteLabel: 'Why now?',
      description: <>Sends the business wallet balance (minus reserve and fee) to {mp.payoutBankName ?? 'their bank'} ••••{mp.payoutAccountNumber?.slice(-4)}. The payout is final only when the bank confirms it.</>,
      fields: [{ name: 'amount', label: 'Amount (leave empty for the full available balance)', type: 'number' }],
    });
    if (ok) await run('payout', () => adminApiClient.post(`/admin/merchants/${mp.id}/payouts/run`, {
      amount: ok.values.amount ? Number(ok.values.amount) : undefined, note: ok.note,
    }, { otp: ok.otp }), (r: any) => (r?.data?.status === 'paid'
      ? `Payout of ${formatMoney(r.data.amount)} sent to the bank (status: ${r.data.payoutStatus}). It’s final only when the bank confirms — watch Settlements.`
      : `No payout made: ${r?.data?.reason ?? 'nothing to pay out'}`));
  };
  const linkSplit = async () => {
    const ok = await confirm({
      title: mp.seerbitSubAccountCode ? 'Change split account' : 'Link split account', tone: 'danger', confirmLabel: 'Save', stepUp: true,
      requireNote: true, noteLabel: 'Reason',
      description: <>Card store orders for instant-payout merchants are split at SeerBit to this sub-account. Leave the code empty to unlink.</>,
      fields: [{ name: 'code', label: 'SeerBit sub-account code', defaultValue: mp.seerbitSubAccountCode ?? '' }],
    });
    if (ok) await run('split', () => adminApiClient.put(`/admin/merchants/${mp.id}/split`, { subAccountCode: ok.values.code || null, note: ok.note }, { otp: ok.otp }));
  };

  const schedule = mp.payoutSchedule === 'weekly' ? `Weekly on ${WEEKDAYS[mp.payoutWeekday ?? 0] ?? '—'}`
    : mp.payoutSchedule === 'monthly' ? `Monthly on day ${mp.payoutMonthDay ?? '—'}` : humanize(mp.payoutSchedule);

  return (
    <div>
      <Link href={adminPath('/merchants')} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-(--ad-muted) hover:text-(--ad-fg-strong)">
        <ArrowLeft size={13} /> Merchants
      </Link>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-2">{name}<StatusBadge status={mp.verified ? 'verified' : 'pending'} label={mp.verified ? 'Verified' : 'Awaiting verification'} /><StatusBadge status={u.isActive ? 'active' : 'suspended'} /></span>}
        description={<>{humanize(mp.businessType)} · {humanize(mp.category)} · owner {fullName(u)} ({u.email}) · joined {formatDate(u.createdAt)}</>}
        actions={(
          <>
            <Can perm="users.view"><Link href={adminPath(`/users/${u.id}`)}><Button icon={<User size={14} />}>Owner’s profile</Button></Link></Can>
            {!mp.verified && can('merchants.verify') && <Button variant="success" loading={pending === 'verify'} onClick={verify}>Verify</Button>}
            {can('users.manage') && <Button variant={u.isActive ? 'danger' : 'success'} loading={pending === 'account'} onClick={toggleAccount}>{u.isActive ? 'Suspend' : 'Reactivate'}</Button>}
          </>
        )}
      />

      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'overview', label: 'Overview' },
        { value: 'payments', label: 'Payments received', count: data.merchantTransactions.length },
        { value: 'settlements', label: 'Settlements', hidden: !can('settlements.view') },
        { value: 'store', label: 'Store', hidden: !mp.store },
      ]} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Business" className="lg:col-span-2">
            <KeyValue items={[
              { label: 'Registered name', value: mp.businessName },
              { label: 'Trading name', value: mp.tradingName ?? '—' },
              { label: 'RC number', value: mp.rcNumber ?? '—' },
              { label: 'Tax ID', value: mp.taxId ?? '—' },
              { label: 'Address', value: mp.address },
              { label: 'Contact', value: [mp.contactEmail, mp.contactPhone].filter(Boolean).join(' · ') || '—' },
              { label: 'Business account number', value: mp.merchantAccountNumber ? <Mono>{mp.merchantAccountNumber}</Mono> : '—' },
              { label: 'QR handle', value: <Mono>{mp.qrSlug}</Mono> },
            ]} />
          </Card>
          <Card title="Money">
            <KeyValue columns={1} items={[
              { label: 'Business wallet', value: can('wallets.view') ? formatMoney(mp.wallet?.balance) : 'Hidden' },
              { label: 'Payments received (successful)', value: `${formatMoney(data.revenueSummary.totalRevenue)} · ${data.revenueSummary.count} payments` },
            ]} />
          </Card>
          <Card
            title="Payouts"
            className="lg:col-span-3"
            actions={(
              <>
                {!mp.payoutsPausedAt && can('merchants.payouts.pause') && <Button size="sm" variant="danger" loading={pending === 'pause'} onClick={pause}>Pause payouts</Button>}
                {mp.payoutsPausedAt && can('merchants.payouts.manage') && <Button size="sm" variant="success" loading={pending === 'resume'} onClick={resume}>Resume payouts</Button>}
                {can('merchants.payouts.manage') && mp.payoutAccountNumber && !mp.payoutsPausedAt && <Button size="sm" loading={pending === 'payout'} onClick={payNow}>Pay out now</Button>}
                {can('merchants.payouts.manage') && <Button size="sm" loading={pending === 'split'} onClick={linkSplit}>Split account</Button>}
              </>
            )}
          >
            {mp.payoutsPausedAt && (
              <p className="mb-3 rounded-lg bg-[rgba(185,28,28,0.08)] px-3 py-2 text-sm text-[#991b1b]">
                Paused {formatDateTime(mp.payoutsPausedAt)}{mp.payoutsPausedReason ? ` — “${mp.payoutsPausedReason}”` : ''}
              </p>
            )}
            <KeyValue columns={3} items={[
              { label: 'Schedule', value: schedule },
              { label: 'Minimum payout', value: formatMoney(mp.payoutMinimum) },
              { label: 'Reserve kept', value: formatMoney(mp.payoutReserve) },
              { label: 'Bank account', value: mp.payoutAccountNumber ? `${mp.payoutAccountName ?? ''} · ${mp.payoutBankName ?? ''} ••••${mp.payoutAccountNumber.slice(-4)}` : 'Not set' },
              { label: 'Account name-checked', value: mp.payoutAccountVerifiedAt ? formatDateTime(mp.payoutAccountVerifiedAt) : <Badge tone="warning">Not verified</Badge> },
              { label: 'Account last changed', value: formatDateTime(mp.payoutAccountChangedAt) },
              { label: 'SeerBit split sub-account', value: mp.seerbitSubAccountCode ? <Mono>{mp.seerbitSubAccountCode}</Mono> : 'Not linked' },
            ]} />
          </Card>
        </div>
      )}

      {tab === 'payments' && (
        <DataTable
          rows={data.merchantTransactions}
          rowKey={(t) => t.id}
          onRowClick={setTx}
          empty={<EmptyState title="No payments received yet" />}
          columns={[
            { key: 'ref', header: 'Reference', cell: (t) => <Mono>{t.reference}</Mono> },
            { key: 'type', header: 'Type', cell: (t) => humanize(t.type) },
            { key: 'amount', header: 'Amount', align: 'right', cell: (t) => formatMoney(t.amount) },
            { key: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
            { key: 'time', header: 'Time (WAT)', cell: (t) => <span className="text-xs text-(--ad-muted)">{formatDateTime(t.createdAt)}</span> },
          ]}
        />
      )}

      {tab === 'settlements' && (
        <DataTable
          rows={settlements.data?.settlements}
          loading={settlements.isLoading}
          error={settlements.error}
          onRetry={() => settlements.refetch()}
          rowKey={(s) => s.id}
          empty={<EmptyState title="No payouts yet" />}
          columns={[
            { key: 'ref', header: 'Reference', cell: (s) => <Mono>{s.reference}</Mono> },
            { key: 'trigger', header: 'Trigger', cell: (s) => humanize(s.trigger) },
            { key: 'amount', header: 'Amount', align: 'right', cell: (s) => formatMoney(s.amount) },
            { key: 'fee', header: 'Fee', align: 'right', cell: (s) => formatMoney(s.fee) },
            { key: 'status', header: 'Status', cell: (s) => <span title={s.failureReason ?? ''}><StatusBadge status={s.status} /></span> },
            { key: 'bank', header: 'To', hideOnMobile: true, cell: (s) => <span className="text-xs">{s.bankName} ••••{s.accountNumber.slice(-4)}</span> },
            { key: 'time', header: 'Started (WAT)', cell: (s) => <span className="text-xs text-(--ad-muted)">{formatDateTime(s.createdAt)}</span> },
          ]}
        />
      )}

      {tab === 'store' && mp.store && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title={`Products (${mp.store.products.length})`} bodyClassName="p-0">
            {!mp.store.products.length ? <EmptyState title="No products" /> : (
              <ul className="divide-y divide-(--ad-border)">
                {mp.store.products.slice(0, 50).map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="truncate">{p.name}</span><span className="tabular-nums">{formatMoney(p.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title={`Orders (${mp.store.orders.length})`} bodyClassName="p-0">
            {!mp.store.orders.length ? <EmptyState title="No orders" /> : (
              <ul className="divide-y divide-(--ad-border)">
                {mp.store.orders.slice(0, 50).map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span className="min-w-0"><Mono>{o.reference ?? o.id.slice(0, 8)}</Mono> <span className="text-xs text-(--ad-muted)">{formatDate(o.createdAt)}</span></span>
                    <span className="flex items-center gap-2"><StatusBadge status={o.paymentStatus ?? o.status} /><span className="tabular-nums">{formatMoney(o.totalAmount)}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <TransactionDrawer tx={tx} onClose={() => setTx(null)} />
      {dialog}
    </div>
  );
}
