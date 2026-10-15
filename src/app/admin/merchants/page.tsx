import React from 'react';
import { useLocation } from 'wouter';
import { RefreshCw } from 'lucide-react';
import { PageHeader, DataTable, Pagination, StatusBadge, Badge, Button } from '@/components/admin/ui';
import { FilterPanel, FilterGroup, FilterSelect } from '@/components/admin/filters';
import { useAdminQuery, useAdminAction, useUrlState } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { adminPath } from '@/lib/adminPaths';
import { formatDate, formatMoney, fullName, humanize } from '@/lib/adminFormat';
import { useCan } from '@/store/useAdminAuthStore';

export interface MerchantRow {
  id: string; firstName: string; lastName: string; email: string; phone: string | null; isActive: boolean; createdAt: string;
  merchantProfile: {
    id: string; businessName: string; tradingName: string | null; businessType: string; category: string; verified: boolean;
    payoutSchedule: string; payoutsPausedAt: string | null;
    wallet: { balance: string | null; isLocked: boolean } | null;
    store?: { _count?: { products: number; orders: number } } | null;
  };
}

export const merchantName = (m: Pick<MerchantRow, 'merchantProfile' | 'firstName' | 'lastName' | 'email'>) =>
  m.merchantProfile?.tradingName || m.merchantProfile?.businessName || fullName(m);

export default function MerchantsPage() {
  const [, navigate] = useLocation();
  const canVerify = useCan('merchants.verify');
  const canSeeBalances = useCan('wallets.view');
  const [f, setF] = useUrlState({ search: '', verified: '', isActive: '', page: '1' });

  const { data, isLoading, isFetching, error, refetch } = useAdminQuery<{ merchants: MerchantRow[]; pagination: { page: number; pages: number; total: number } }>(
    '/admin/merchants', { page: f.page, limit: 25, search: f.search, verified: f.verified, isActive: f.isActive },
  );
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();

  const verify = async (m: MerchantRow) => {
    const ok = await confirm({
      title: 'Verify this business?', tone: 'success', confirmLabel: 'Verify merchant',
      description: <>Mark <b>{merchantName(m)}</b> ({humanize(m.merchantProfile.businessType)}) as a verified BadePay merchant. Check their registration documents first.</>,
      requireNote: true, noteLabel: 'What did you check?', notePlaceholder: 'e.g. CAC RC1234567 matches business name and director',
    });
    if (!ok) return;
    await run(`verify-${m.id}`, () => adminApiClient.post(`/admin/merchants/${m.id}/verify`, { note: ok.note }));
  };

  return (
    <div>
      <PageHeader
        eyebrow="Customers"
        title="Merchants"
        description="Business accounts, their verification and payout state. Click a row for the store, settlements and payout controls."
        actions={<Button icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Button>}
      />
      <FilterPanel
        search={f.search}
        onSearch={(v) => setF({ search: v })}
        searchPlaceholder="Business, owner, email or phone"
        onClearAll={() => setF({ search: '', verified: '', isActive: '' })}
        active={[
          ...(f.verified ? [{ key: 'verified', label: f.verified === 'true' ? 'Verified' : 'Awaiting verification', onRemove: () => setF({ verified: '' }) }] : []),
          ...(f.isActive ? [{ key: 'active', label: f.isActive === 'true' ? 'Active' : 'Suspended', onRemove: () => setF({ isActive: '' }) }] : []),
        ]}
      >
        <FilterGroup label="Verification">
          <FilterSelect label="Verification" value={f.verified} onChange={(v) => setF({ verified: v })}
            options={[{ value: '', label: 'Verified & awaiting' }, { value: 'false', label: 'Awaiting verification' }, { value: 'true', label: 'Verified' }]} />
        </FilterGroup>
        <FilterGroup label="Account status">
          <FilterSelect label="Account status" value={f.isActive} onChange={(v) => setF({ isActive: v })}
            options={[{ value: '', label: 'Active & suspended' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Suspended' }]} />
        </FilterGroup>
      </FilterPanel>

      <DataTable
        rows={data?.merchants}
        loading={isLoading || isFetching}
        error={error}
        onRetry={() => refetch()}
        rowKey={(m) => m.id}
        onRowClick={(m) => navigate(adminPath(`/merchants/${m.id}`))}
        columns={[
          {
            key: 'name', header: 'Business', cell: (m) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-(--ad-fg-strong)">{merchantName(m)}</p>
                <p className="truncate text-xs text-(--ad-muted)">{fullName(m)} · {m.email}</p>
              </div>
            ),
          },
          { key: 'type', header: 'Type', hideOnMobile: true, cell: (m) => <span className="text-xs">{humanize(m.merchantProfile.businessType)}<br /><span className="text-(--ad-muted)">{humanize(m.merchantProfile.category)}</span></span> },
          { key: 'verified', header: 'Verification', cell: (m) => <StatusBadge status={m.merchantProfile.verified ? 'verified' : 'pending'} label={m.merchantProfile.verified ? 'Verified' : 'Awaiting'} /> },
          {
            key: 'payouts', header: 'Payouts', cell: (m) => m.merchantProfile.payoutsPausedAt
              ? <Badge tone="danger">Paused</Badge> : <span className="text-xs">{humanize(m.merchantProfile.payoutSchedule)}</span>,
          },
          ...(canSeeBalances ? [{ key: 'balance', header: 'Business wallet', align: 'right' as const, cell: (m: MerchantRow) => formatMoney(m.merchantProfile.wallet?.balance) }] : []),
          { key: 'status', header: 'Account', cell: (m) => <StatusBadge status={m.isActive ? 'active' : 'suspended'} /> },
          { key: 'joined', header: 'Joined', hideOnMobile: true, cell: (m) => <span className="text-xs text-(--ad-muted)">{formatDate(m.createdAt)}</span> },
          ...(canVerify ? [{
            key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right' as const, cell: (m: MerchantRow) => !m.merchantProfile.verified && (
              <Button size="sm" variant="success" loading={pending === `verify-${m.id}`} onClick={(e) => { e.stopPropagation(); void verify(m); }}>Verify</Button>
            ),
          }] : []),
        ]}
        footer={data && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} label="merchants" onPage={(p) => setF({ page: String(p) })} />}
      />
      {dialog}
    </div>
  );
}
