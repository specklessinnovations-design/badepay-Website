import React from 'react';
import { Link } from 'wouter';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { PageHeader, Card, Button, Spinner, ErrorState, EmptyState, KeyValue, Can } from '@/components/admin/ui';
import { useAdminQuery, useAdminAction } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import { KycCheckDetails, KycSubmission } from '@/components/admin/KycChecks';
import adminApiClient from '@/lib/adminApiClient';
import { adminPath } from '@/lib/adminPaths';
import { formatDate, formatRelative, fullName } from '@/lib/adminFormat';

interface QueueItem extends KycSubmission {
  userId: string;
  providerData: Record<string, unknown> | null;
  user: { id: string; email: string; firstName: string; lastName: string; dateOfBirth: string | null; kycLevel: number } | null;
}

/** Names/date of birth the provider returned, for comparing against the account. */
function providerIdentity(data: Record<string, unknown> | null) {
  if (!data) return [];
  const pick = (...keys: string[]) => keys.map((k) => data[k]).find((v) => typeof v === 'string' && v) as string | undefined;
  return [
    { label: 'Provider first name', value: pick('firstName', 'first_name', 'firstname') ?? '—' },
    { label: 'Provider last name', value: pick('lastName', 'last_name', 'surname', 'lastname') ?? '—' },
    { label: 'Provider middle name', value: pick('middleName', 'middle_name', 'middlename') ?? '—' },
    { label: 'Provider date of birth', value: pick('dateOfBirth', 'date_of_birth', 'birthdate', 'dob') ?? '—' },
    { label: 'Date of birth the customer entered', value: pick('enteredDateOfBirth') ?? '—' },
  ];
}

export default function KycPage() {
  const { data, isLoading, error, refetch, isFetching } = useAdminQuery<{ queue: QueueItem[] }>('/admin/kyc/queue');
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();

  const decide = async (s: QueueItem, decision: 'approve' | 'reject') => {
    const name = fullName(s.user);
    const ok = await confirm(decision === 'approve' ? {
      title: `Approve ${s.type.toUpperCase()} check?`, tone: 'success', confirmLabel: 'Approve',
      description: <><b>{name}</b> moves to KYC level {s.level}. Approve only if you’re satisfied the identity belongs to this customer.</>,
      requireNote: true, noteLabel: 'How did you confirm it?',
    } : {
      title: `Reject ${s.type.toUpperCase()} check?`, tone: 'danger', confirmLabel: 'Reject',
      description: <><b>{name}</b> stays at level {s.user?.kycLevel ?? 0} and can try again in the app.</>,
      requireNote: true, noteLabel: 'Reason for rejection', notePlaceholder: 'e.g. Name on BVN does not match the account holder',
    });
    if (!ok) return;
    await run(`${decision}-${s.id}`, () => adminApiClient.post(`/admin/kyc/${s.id}/decision`, { decision, note: ok.note }),
      decision === 'approve' ? 'Check approved' : 'Check rejected');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Customers"
        title="KYC exceptions"
        description={<>Prembly verifies BVN (level 1) and NIN with a live selfie (level 2) automatically. Only checks it couldn’t approve — name mismatches, duplicate identities, flagged BVNs or PEP hits — land here. Every other result is on the customer’s KYC tab.</>}
        actions={<Button icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Button>}
      />

      {isLoading ? <Spinner /> : error ? <Card><ErrorState error={error} onRetry={() => refetch()} /></Card> : !data?.queue.length ? (
        <Card><EmptyState icon={<ShieldCheck size={18} />} title="No checks waiting" description="Every identity check has been decided." /></Card>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-(--ad-muted)">{data.queue.length} waiting, oldest first.</p>
          {data.queue.map((s) => (
            <Card
              key={s.id}
              title={<span>{fullName(s.user)} <span className="font-normal text-(--ad-muted)">· {s.type.toUpperCase()} · waiting {formatRelative(s.createdAt).replace(' ago', '')}</span></span>}
              description={s.user?.email}
              actions={(
                <>
                  {s.user && <Link href={adminPath(`/users/${s.user.id}`)}><Button size="sm" variant="ghost">Customer</Button></Link>}
                  <Can perm="kyc.decide">
                    <Button size="sm" variant="danger" loading={pending === `reject-${s.id}`} onClick={() => decide(s, 'reject')}>Reject</Button>
                    <Button size="sm" variant="success" loading={pending === `approve-${s.id}`} onClick={() => decide(s, 'approve')}>Approve</Button>
                  </Can>
                </>
              )}
            >
              <div className="mb-3 rounded-lg bg-[rgba(180,83,9,0.08)] px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#92400e]">Why it needs a person</p>
                <ul className="mt-0.5 list-disc pl-5 text-sm text-[#78350f]">{s.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
              <KycCheckDetails s={s} />
              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-(--ad-border) pt-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold text-(--ad-fg-strong)">On the BadePay account</p>
                  <KeyValue columns={1} items={[
                    { label: 'Name', value: fullName(s.user) },
                    { label: 'Date of birth', value: formatDate(s.user?.dateOfBirth) },
                    { label: 'Current level', value: `Level ${s.user?.kycLevel ?? 0}` },
                  ]} />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-(--ad-fg-strong)">Returned by Prembly</p>
                  <KeyValue columns={1} items={providerIdentity(s.providerData)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {dialog}
    </div>
  );
}
