import React, { useState } from 'react';
import { Download, RefreshCw, Lock } from 'lucide-react';
import { PageHeader, DataTable, Pagination, StatusBadge, Button, Mono, Drawer, KeyValue, Can } from '@/components/admin/ui';
import { FilterPanel, FilterGroup, FilterSelect, FilterText, DateGroup, dateRangeLabel } from '@/components/admin/filters';
import { useAdminQuery, useAdminAction, useUrlState } from '@/components/admin/hooks';
import { adminDownload } from '@/lib/adminApiClient';
import { formatDateTime, humanize, lagosDateToUtc } from '@/lib/adminFormat';

interface AuditRow {
  id: string; adminId: string | null; adminEmail: string | null; adminRole: string | null; action: string; resourceId: string | null;
  targetType: string | null; statusCode: number; success: boolean; outcome: string; ipAddress: string; userAgent: string | null;
  requestId: string | null; reason: string | null; details: unknown; changes: { before?: unknown; after?: unknown } | null; createdAt: string;
}

const TARGETS = ['user', 'wallet', 'merchant', 'ticket', 'transaction', 'approval', 'admin_user', 'admin_role', 'settings', 'export'];
const short = (action: string) => action.replace('/api/v1/admin', '');

function Json({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-(--ad-muted)">—</span>;
  return <pre className="max-h-64 overflow-auto rounded-lg bg-(--ad-bg-elev) p-3 font-mono text-[11px] leading-relaxed text-(--ad-fg-strong)">{JSON.stringify(value, null, 2)}</pre>;
}

export default function AuditLogPage() {
  const [f, setF] = useUrlState({ adminEmail: '', action: '', targetType: '', resourceId: '', outcome: '', requestId: '', from: '', to: '', page: '1' });
  const [open, setOpen] = useState<AuditRow | null>(null);
  const { run, pending } = useAdminAction();

  const filters = {
    adminEmail: f.adminEmail, action: f.action, targetType: f.targetType, resourceId: f.resourceId, outcome: f.outcome, requestId: f.requestId,
    from: f.from ? lagosDateToUtc(f.from) : undefined, to: f.to ? lagosDateToUtc(f.to, true) : undefined,
  };
  const { data, isLoading, isFetching, error, refetch } = useAdminQuery<{ logs: AuditRow[]; pagination: { page: number; pages: number; total: number } }>(
    '/admin/audit-logs', { ...filters, page: f.page, limit: 50 },
  );

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        description={<span className="inline-flex items-center gap-1"><Lock size={12} /> Append-only: the database refuses edits and deletions. Every admin write, refusal, export and sign-in attempt is recorded server-side. Secrets are redacted.</span>}
        actions={(
          <>
            <Button icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Button>
            <Can perm="audit_logs.export">
              <Button icon={<Download size={14} />} loading={pending === 'export'} onClick={() => run('export', () => adminDownload('/admin/audit-logs/export', filters), 'Export downloaded (this export is itself audited)')}>Export CSV</Button>
            </Can>
          </>
        )}
      />
      <FilterPanel
        search={f.action}
        onSearch={(v) => setF({ action: v })}
        searchPlaceholder="Action contains… (e.g. refund, /users, settings)"
        onClearAll={() => setF({ adminEmail: '', action: '', targetType: '', resourceId: '', outcome: '', requestId: '', from: '', to: '' })}
        active={[
          ...(f.outcome ? [{ key: 'outcome', label: `Outcome: ${humanize(f.outcome)}`, onRemove: () => setF({ outcome: '' }) }] : []),
          ...(f.targetType ? [{ key: 'target', label: `Target: ${humanize(f.targetType)}`, onRemove: () => setF({ targetType: '' }) }] : []),
          ...(f.adminEmail ? [{ key: 'admin', label: `Admin: ${f.adminEmail}`, onRemove: () => setF({ adminEmail: '' }) }] : []),
          ...(f.resourceId ? [{ key: 'rid', label: `Target id: ${f.resourceId.slice(0, 12)}`, onRemove: () => setF({ resourceId: '' }) }] : []),
          ...(f.requestId ? [{ key: 'req', label: `Request: ${f.requestId.slice(0, 12)}`, onRemove: () => setF({ requestId: '' }) }] : []),
          ...(f.from || f.to ? [{ key: 'date', label: dateRangeLabel(f.from, f.to), onRemove: () => setF({ from: '', to: '' }) }] : []),
        ]}
      >
        <FilterGroup label="Outcome">
          <FilterSelect label="Outcome" value={f.outcome} onChange={(v) => setF({ outcome: v })}
            options={[{ value: '', label: 'Any outcome' }, { value: 'success', label: 'Success' }, { value: 'failure', label: 'Failure' }, { value: 'denied', label: 'Denied' }]} />
        </FilterGroup>
        <FilterGroup label="Target type">
          <FilterSelect label="Target type" value={f.targetType} onChange={(v) => setF({ targetType: v })}
            options={[{ value: '', label: 'Any target' }, ...TARGETS.map((t) => ({ value: t, label: humanize(t) }))]} />
        </FilterGroup>
        <FilterGroup label="Who">
          <FilterText label="Admin email" value={f.adminEmail} onChange={(v) => setF({ adminEmail: v })} placeholder="Admin email contains…" />
        </FilterGroup>
        <DateGroup label="Date (Lagos)" from={f.from} to={f.to} onChange={(from, to) => setF({ from, to })} />
        <FilterGroup label="Record" wide>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <FilterText label="Target id" value={f.resourceId} onChange={(v) => setF({ resourceId: v })} placeholder="Target id (user, ticket…)" />
            <FilterText label="Request id" value={f.requestId} onChange={(v) => setF({ requestId: v })} placeholder="Request id" />
          </div>
        </FilterGroup>
      </FilterPanel>

      <DataTable
        rows={data?.logs}
        loading={isLoading || isFetching}
        error={error}
        onRetry={() => refetch()}
        rowKey={(l) => l.id}
        onRowClick={setOpen}
        dense
        columns={[
          { key: 'time', header: 'Time (WAT)', cell: (l) => <span className="whitespace-nowrap text-xs">{formatDateTime(l.createdAt)}</span> },
          { key: 'admin', header: 'Admin', cell: (l) => <span className="text-xs">{l.adminEmail ?? 'unknown'}<br /><span className="text-(--ad-muted)">{l.adminRole ? humanize(l.adminRole) : '—'}</span></span> },
          { key: 'action', header: 'Action', cell: (l) => <Mono>{short(l.action)}</Mono> },
          { key: 'target', header: 'Target', cell: (l) => <span className="text-xs">{l.targetType ? humanize(l.targetType) : '—'}<br />{l.resourceId && <Mono>{l.resourceId.length > 20 ? `${l.resourceId.slice(0, 18)}…` : l.resourceId}</Mono>}</span> },
          { key: 'reason', header: 'Reason', hideOnMobile: true, cell: (l) => <span className="line-clamp-2 max-w-xs text-xs">{l.reason ?? '—'}</span> },
          { key: 'outcome', header: 'Outcome', cell: (l) => <span><StatusBadge status={l.outcome} /> <span className="text-[10px] text-(--ad-muted)">{l.statusCode}</span></span> },
        ]}
        footer={data && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} label="events" onPage={(p) => setF({ page: String(p) })} />}
      />

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? <Mono>{short(open.action)}</Mono> : ''}>
        {open && (
          <div className="space-y-5">
            <KeyValue items={[
              { label: 'Event id', value: <Mono>{open.id}</Mono> },
              { label: 'Time', value: formatDateTime(open.createdAt) },
              { label: 'Admin', value: `${open.adminEmail ?? 'unknown'}${open.adminId ? ` (${open.adminId})` : ''}` },
              { label: 'Role at the time', value: open.adminRole ? humanize(open.adminRole) : '—' },
              { label: 'Target', value: `${open.targetType ? humanize(open.targetType) : '—'} ${open.resourceId ?? ''}` },
              { label: 'Outcome', value: <><StatusBadge status={open.outcome} /> HTTP {open.statusCode}</> },
              { label: 'Request id', value: open.requestId ? <Mono>{open.requestId}</Mono> : '—' },
              { label: 'IP address', value: <Mono>{open.ipAddress}</Mono> },
            ]} />
            <div><p className="mb-1 text-xs font-semibold">Reason / comment</p><p className="text-sm">{open.reason ?? '—'}</p></div>
            <div><p className="mb-1 text-xs font-semibold">Before → after</p><Json value={open.changes} /></div>
            <div><p className="mb-1 text-xs font-semibold">Request (secrets redacted)</p><Json value={open.details} /></div>
            <p className="text-[11px] text-(--ad-muted)">{open.userAgent}</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
