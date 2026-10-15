import React from 'react';
import { useLocation } from 'wouter';
import { RefreshCw } from 'lucide-react';
import { PageHeader, DataTable, Pagination, StatusBadge, Badge, Button, Mono, Can } from '@/components/admin/ui';
import { FilterPanel, FilterGroup, FilterSelect } from '@/components/admin/filters';
import { useAdminQuery, useAdminAction, useUrlState } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { adminPath } from '@/lib/adminPaths';
import { formatDate, formatMoney, formatRelative, fullName } from '@/lib/adminFormat';
import { useCan } from '@/store/useAdminAuthStore';

interface UserRow {
  id: string; firstName: string; lastName: string; email: string; phone: string | null; userType: string;
  kycLevel: number; kycStatus: string; isActive: boolean; createdAt: string; lastLoginAt: string | null;
  wallet: { balance: string | null; isLocked: boolean } | null;
  merchantProfile: { businessName?: string; tradingName?: string; verified?: boolean; wallet?: { balance: string | null } | null } | null;
}

const KYC_LABEL: Record<string, string> = { approved: 'Verified', pending: 'Pending', rejected: 'Rejected', unsubmitted: 'Not submitted' };

export default function UsersPage() {
  const [, navigate] = useLocation();
  const canManage = useCan('users.manage');
  const canSeeBalances = useCan('wallets.view');
  const [f, setF] = useUrlState({ search: '', userType: '', kycStatus: '', isActive: '', page: '1' });

  const { data, isLoading, isFetching, error, refetch } = useAdminQuery<{ users: UserRow[]; pagination: { page: number; pages: number; total: number } }>(
    '/admin/users', { page: f.page, limit: 25, search: f.search, userType: f.userType, kycStatus: f.kycStatus, isActive: f.isActive },
  );
  const { run } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();

  const toggle = async (u: UserRow) => {
    const name = fullName(u);
    const ok = await confirm(u.isActive ? {
      title: 'Suspend account?', confirmLabel: 'Suspend', tone: 'danger', requireNote: true, noteLabel: 'Reason for suspension',
      description: <><b>{name}</b> will be signed out and blocked from signing in and paying until reactivated.</>,
    } : {
      title: 'Reactivate account?', confirmLabel: 'Reactivate', tone: 'success', optionalNote: true, noteLabel: 'Comment',
      description: <><b>{name}</b> will be able to sign in and pay again.</>,
    });
    if (!ok) return;
    await run(`toggle-${u.id}`, () => adminApiClient.patch(`/admin/users/${u.id}/status`, { action: u.isActive ? 'ban' : 'unban', reason: ok.note }));
  };

  return (
    <div>
      <PageHeader
        eyebrow="Customers"
        title="Users"
        description="Every personal and business account. Click a row for the full profile, wallet, KYC history and timeline."
        actions={<Button icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Button>}
      />
      <FilterPanel
        search={f.search}
        onSearch={(v) => setF({ search: v })}
        searchPlaceholder="Name, email or phone"
        onClearAll={() => setF({ search: '', userType: '', kycStatus: '', isActive: '' })}
        active={[
          ...(f.userType ? [{ key: 'type', label: f.userType === 'merchant' ? 'Business accounts' : 'Personal accounts', onRemove: () => setF({ userType: '' }) }] : []),
          ...(f.kycStatus ? [{ key: 'kyc', label: `KYC: ${KYC_LABEL[f.kycStatus] ?? f.kycStatus}`, onRemove: () => setF({ kycStatus: '' }) }] : []),
          ...(f.isActive ? [{ key: 'active', label: f.isActive === 'true' ? 'Active' : 'Suspended', onRemove: () => setF({ isActive: '' }) }] : []),
        ]}
      >
        <FilterGroup label="Account type">
          <FilterSelect label="Account type" value={f.userType} onChange={(v) => setF({ userType: v })}
            options={[{ value: '', label: 'All account types' }, { value: 'consumer', label: 'Personal' }, { value: 'merchant', label: 'Business' }]} />
        </FilterGroup>
        <FilterGroup label="KYC status">
          <FilterSelect label="KYC status" value={f.kycStatus} onChange={(v) => setF({ kycStatus: v })}
            options={[{ value: '', label: 'Any KYC status' }, ...Object.entries(KYC_LABEL).map(([value, label]) => ({ value, label }))]} />
        </FilterGroup>
        <FilterGroup label="Account status">
          <FilterSelect label="Account status" value={f.isActive} onChange={(v) => setF({ isActive: v })}
            options={[{ value: '', label: 'Active & suspended' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Suspended' }]} />
        </FilterGroup>
      </FilterPanel>

      <DataTable
        rows={data?.users}
        loading={isLoading || isFetching}
        error={error}
        onRetry={() => refetch()}
        rowKey={(u) => u.id}
        onRowClick={(u) => navigate(adminPath(`/users/${u.id}`))}
        columns={[
          {
            key: 'name', header: 'Customer', cell: (u) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-(--ad-fg-strong)">{fullName(u)}</p>
                <p className="truncate text-xs text-(--ad-muted)">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
              </div>
            ),
          },
          {
            key: 'type', header: 'Type', cell: (u) => u.userType === 'merchant'
              ? <Badge tone="accent">Business{u.merchantProfile?.verified ? '' : ' · unverified'}</Badge>
              : <Badge tone="info">Personal</Badge>,
          },
          { key: 'kyc', header: 'KYC', cell: (u) => <span className="flex items-center gap-1.5"><StatusBadge status={u.kycStatus} /><span className="text-xs text-(--ad-muted)">L{u.kycLevel}</span></span> },
          ...(canSeeBalances ? [{
            key: 'balance', header: 'Wallet', align: 'right' as const, cell: (u: UserRow) => (
              <span className="tabular-nums">{formatMoney(u.wallet?.balance)}{u.wallet?.isLocked && <Badge tone="danger" className="ml-1.5">Locked</Badge>}</span>
            ),
          }] : []),
          { key: 'status', header: 'Status', cell: (u) => <StatusBadge status={u.isActive ? 'active' : 'suspended'} /> },
          { key: 'seen', header: 'Last sign-in', hideOnMobile: true, cell: (u) => <span className="text-xs text-(--ad-muted)" title={u.lastLoginAt ?? ''}>{u.lastLoginAt ? formatRelative(u.lastLoginAt) : 'Never'}</span> },
          { key: 'joined', header: 'Joined', hideOnMobile: true, cell: (u) => <span className="text-xs text-(--ad-muted)">{formatDate(u.createdAt)}</span> },
          ...(canManage ? [{
            key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right' as const, cell: (u: UserRow) => (
              <Button size="sm" variant={u.isActive ? 'secondary' : 'success'} onClick={(e) => { e.stopPropagation(); void toggle(u); }}>
                {u.isActive ? 'Suspend' : 'Reactivate'}
              </Button>
            ),
          }] : []),
        ]}
        footer={data && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} label="customers" onPage={(p) => setF({ page: String(p) })} />}
      />
      <Can perm="users.view"><p className="mt-2 text-[11px] text-(--ad-muted)"><Mono>{data?.pagination.total ?? 0}</Mono> matching accounts.</p></Can>
      {dialog}
    </div>
  );
}
