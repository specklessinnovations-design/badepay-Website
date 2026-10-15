import React from 'react';
import { Link } from 'wouter';
import { RefreshCw, UserX } from 'lucide-react';
import { PageHeader, DataTable, Button, Mono, Badge, EmptyState, Can } from '@/components/admin/ui';
import { useAdminQuery, useAdminAction } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { adminPath } from '@/lib/adminPaths';
import { formatDateTime, formatMoney, formatRelative, fullName } from '@/lib/adminFormat';
import { useCan } from '@/store/useAdminAuthStore';

interface ClosureRequest {
  id: string; email: string; firstName: string; lastName: string; userType: string; accountNumber: string | null;
  deletionRequestedAt: string; deletionReason: string | null; wallet: { balance: string } | null;
}

export default function ClosuresPage() {
  const { data, isLoading, isFetching, error, refetch } = useAdminQuery<{ requests: ClosureRequest[] }>('/admin/deletion-requests');
  const seeBalances = useCan('wallets.view');
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();

  const approve = async (r: ClosureRequest) => {
    const balance = Number(r.wallet?.balance ?? 0);
    const ok = await confirm({
      title: 'Close this account permanently?', tone: 'danger', confirmLabel: 'Close account', stepUp: true,
      description: (
        <div className="space-y-1.5">
          <p><b>{fullName(r)}</b> ({r.email}) can no longer sign in. Their records are kept; the email and account number are released.</p>
          {balance > 0 && <p className="font-semibold text-[#b91c1c]">Their wallet still holds {formatMoney(balance)}. Make sure it has been paid out first.</p>}
          <p>This can’t be undone.</p>
        </div>
      ),
      requireNote: true, noteLabel: 'Reason',
    });
    if (ok) await run(`approve-${r.id}`, () => adminApiClient.post(`/admin/users/${r.id}/deletion/approve`, { reason: ok.note }, { otp: ok.otp }), 'Account closed');
  };
  const reject = async (r: ClosureRequest) => {
    const ok = await confirm({
      title: 'Keep the account open?', tone: 'success', confirmLabel: 'Reject closure request', requireNote: true, noteLabel: 'Reason (shared with the customer)',
      description: <><b>{fullName(r)}</b>’s account and wallet are reactivated.</>,
    });
    if (ok) await run(`reject-${r.id}`, () => adminApiClient.post(`/admin/users/${r.id}/deletion/reject`, { reason: ok.note }), 'Closure request rejected');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Customers"
        title="Account closures"
        description="Customers who asked to close their account. While a request is open they are signed out and their wallet is locked. Approving soft-deletes the account (records are kept)."
        actions={<Button icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Button>}
      />
      <DataTable
        rows={data?.requests}
        loading={isLoading || isFetching}
        error={error}
        onRetry={() => refetch()}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<UserX size={18} />} title="No closure requests" />}
        columns={[
          { key: 'who', header: 'Customer', cell: (r) => <Link href={adminPath(`/users/${r.id}`)} className="hover:underline"><span className="font-medium text-(--ad-fg-strong)">{fullName(r)}</span><br /><span className="text-xs text-(--ad-muted)">{r.email}</span></Link> },
          { key: 'acct', header: 'Account', cell: (r) => <span className="text-xs">{r.userType === 'merchant' ? 'Business' : 'Personal'}<br />{r.accountNumber ? <Mono>{r.accountNumber}</Mono> : '—'}</span> },
          ...(seeBalances ? [{ key: 'bal', header: 'Wallet', align: 'right' as const, cell: (r: ClosureRequest) => Number(r.wallet?.balance ?? 0) > 0 ? <Badge tone="danger">{formatMoney(r.wallet?.balance)}</Badge> : formatMoney(0) }] : []),
          { key: 'reason', header: 'Their reason', cell: (r) => <span className="text-xs">{r.deletionReason ?? '—'}</span> },
          { key: 'when', header: 'Requested', cell: (r) => <span className="text-xs text-(--ad-muted)" title={formatDateTime(r.deletionRequestedAt)}>{formatRelative(r.deletionRequestedAt)}</span> },
          {
            key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (r) => (
              <div className="flex justify-end gap-1.5">
                <Can perm="account_closure.decide"><Button size="sm" loading={pending === `reject-${r.id}`} onClick={() => reject(r)}>Keep open</Button></Can>
                <Can perm="account_closure.approve"><Button size="sm" variant="danger" loading={pending === `approve-${r.id}`} onClick={() => approve(r)}>Close account</Button></Can>
              </div>
            ),
          },
        ]}
      />
      {dialog}
    </div>
  );
}
