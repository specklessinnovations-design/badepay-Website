import React, { useState } from 'react';
import { CheckCircle2, Play, RefreshCw, Scale } from 'lucide-react';
import { PageHeader, Card, DataTable, Segmented, Button, Mono, Badge, EmptyState, ErrorState, Spinner, KeyValue, Can, TextInput } from '@/components/admin/ui';
import { useAdminQuery, useAdminAction, useUrlState } from '@/components/admin/hooks';
import { useConfirmAction } from '@/components/admin/ConfirmActionDialog';
import adminApiClient from '@/lib/adminApiClient';
import { formatDateTime, formatMoney, humanize } from '@/lib/adminFormat';

interface Issue {
  id: string; day: string; reference: string; kind: string; ourStatus: string; providerStatus: string; ourAmount: string; providerAmount: string | null;
  detail: string; resolvedAt: string | null; resolvedBy: string | null; resolutionNote: string | null; createdAt: string;
}
interface LedgerReport { checkedAt: string; mismatches: { kind: string; id: string; cached: string; ledger: string }[]; ledgerImbalance: string }

export default function ReconciliationPage() {
  const [f, setF] = useUrlState({ resolved: 'false' });
  const issues = useAdminQuery<{ issues: Issue[] }>('/admin/reconciliation/issues', { resolved: f.resolved });
  const [ledgerOn, setLedgerOn] = useState(false);
  const ledger = useAdminQuery<LedgerReport>(ledgerOn ? '/admin/ledger/reconciliation' : null);
  const [day, setDay] = useState('');
  const { run, pending } = useAdminAction();
  const { confirm, dialog } = useConfirmAction();

  const resolve = async (i: Issue) => {
    const ok = await confirm({
      title: 'Mark issue as resolved?', tone: 'success', confirmLabel: 'Mark resolved', requireNote: true, noteLabel: 'How was it resolved?',
      description: <>{humanize(i.kind)} <Mono>{i.reference}</Mono>: we say {i.ourStatus} {formatMoney(i.ourAmount)}, SeerBit says {i.providerStatus}{i.providerAmount ? ` ${formatMoney(i.providerAmount)}` : ''}. This only records the outcome; fix the money itself through refunds or stuck payments.</>,
    });
    if (ok) await run(`resolve-${i.id}`, () => adminApiClient.post(`/admin/reconciliation/issues/${i.id}/resolve`, { note: ok.note }));
  };
  const runProvider = () => run('run', () => adminApiClient.post('/admin/reconciliation/run', day ? { day } : {}), (r: any) =>
    `${r?.data?.day}: checked ${r?.data?.checked ?? 0} records, ${r?.data?.issuesFound ?? 0} disagreements${r?.data?.skipped?.length ? `; skipped: ${r.data.skipped.join(', ')}` : ''}`);

  const imbalance = ledger.data ? Number(ledger.data.ledgerImbalance) : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Reconciliation"
        description="Two checks: our ledger against the wallet balances it backs, and our records against SeerBit (card deposits, card orders and payouts, run daily for the previous Lagos day). Both are report-only."
      />

      <Card
        title="Ledger check"
        description="Every wallet, savings pocket and card balance must equal its ledger account, and all ledger lines must balance to zero."
        className="mb-4"
        actions={<Button size="sm" icon={<Scale size={14} />} loading={ledger.isFetching} onClick={() => (ledgerOn ? ledger.refetch() : setLedgerOn(true))}>{ledgerOn ? 'Run again' : 'Run ledger check'}</Button>}
      >
        {!ledgerOn ? <p className="text-sm text-(--ad-muted)">Not run yet in this session. The check also runs daily and alerts on any mismatch.</p>
          : ledger.isLoading ? <Spinner label="Checking every balance…" />
            : ledger.error ? <ErrorState error={ledger.error} onRetry={() => ledger.refetch()} />
              : ledger.data && (
                <>
                  <KeyValue columns={3} items={[
                    { label: 'Checked', value: formatDateTime(ledger.data.checkedAt) },
                    { label: 'Balance mismatches', value: ledger.data.mismatches.length ? <Badge tone="danger">{ledger.data.mismatches.length}</Badge> : <Badge tone="success">None</Badge> },
                    { label: 'Ledger imbalance', value: imbalance === 0 ? <Badge tone="success">₦0.00 — balanced</Badge> : <Badge tone="danger">{formatMoney(imbalance)}</Badge> },
                  ]} />
                  {ledger.data.mismatches.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {ledger.data.mismatches.map((m) => <li key={m.id}><Mono>{m.kind} {m.id}</Mono>: cached {formatMoney(m.cached)} vs ledger {formatMoney(m.ledger)}</li>)}
                    </ul>
                  )}
                </>
              )}
      </Card>

      <Card
        title="Provider reconciliation (SeerBit)"
        bodyClassName="p-0"
        actions={(
          <Can perm="reconciliation.run">
            <label className="flex items-center gap-1.5 text-xs text-(--ad-muted)">Day <TextInput type="date" className="h-8 w-auto" value={day} onChange={(e) => setDay(e.target.value)} /></label>
            <Button size="sm" icon={<Play size={13} />} loading={pending === 'run'} onClick={runProvider}>Run {day ? 'for that day' : 'for yesterday'}</Button>
          </Can>
        )}
      >
        <div className="border-b border-(--ad-border) px-4 py-2.5">
          <Segmented value={f.resolved} onChange={(v) => setF({ resolved: v })} options={[{ value: 'false', label: 'Open' }, { value: 'true', label: 'Resolved' }]} />
        </div>
        <DataTable
          rows={issues.data?.issues}
          loading={issues.isLoading || issues.isFetching}
          error={issues.error}
          onRetry={() => issues.refetch()}
          rowKey={(i) => i.id}
          empty={<EmptyState icon={<CheckCircle2 size={18} />} title={f.resolved === 'true' ? 'No resolved issues' : 'No open issues'} description="Disagreements with SeerBit appear here after the daily check." />}
          columns={[
            { key: 'ref', header: 'Reference', cell: (i) => <span><Mono>{i.reference}</Mono><br /><span className="text-xs text-(--ad-muted)">{humanize(i.kind)} · {i.day}</span></span> },
            { key: 'ours', header: 'BadePay', cell: (i) => <span>{humanize(i.ourStatus)}<br /><span className="text-xs">{formatMoney(i.ourAmount)}</span></span> },
            { key: 'theirs', header: 'SeerBit', cell: (i) => <span>{humanize(i.providerStatus)}<br /><span className="text-xs">{i.providerAmount ? formatMoney(i.providerAmount) : '—'}</span></span> },
            { key: 'detail', header: 'Detail', cell: (i) => <span className="text-xs">{i.detail}{i.resolutionNote && <><br /><span className="text-(--ad-muted)">Resolved: “{i.resolutionNote}”</span></>}</span> },
            {
              key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', cell: (i) => !i.resolvedAt && (
                <Can perm="reconciliation.resolve"><Button size="sm" loading={pending === `resolve-${i.id}`} onClick={() => resolve(i)}>Mark resolved</Button></Can>
              ),
            },
          ]}
        />
      </Card>
      <Button className="mt-3" variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={() => issues.refetch()}>Refresh issues</Button>
      {dialog}
    </div>
  );
}
