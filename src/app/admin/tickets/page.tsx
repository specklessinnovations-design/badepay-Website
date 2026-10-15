import React from 'react';
import { useLocation } from 'wouter';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { PageHeader, DataTable, Pagination, StatusBadge, Badge, Button, Mono } from '@/components/admin/ui';
import { FilterPanel, FilterGroup, FilterSelect, DateGroup, QuickToggle, dateRangeLabel } from '@/components/admin/filters';
import { useAdminQuery, useUrlState } from '@/components/admin/hooks';
import { adminPath } from '@/lib/adminPaths';
import { formatDateTime, formatRelative, fullName, humanize, lagosDateToUtc } from '@/lib/adminFormat';

export interface TicketRow {
  id: string; ticketNumber: string; issueType: string; status: string; priority: string; amount: string; escalated: boolean;
  createdAt: string; lastActivityAt: string; lastResponseAt: string | null; firstResponseAt: string | null; resolvedAt: string | null;
  user: { id: string; firstName: string; lastName: string; email: string; userType: string };
  assignedTo: { id: string; name: string; email: string } | null;
  _count?: { messages: number };
  sla: { firstResponseDueAt: string; met: boolean; breached: boolean; overdue: boolean };
}

export const PRIORITY_TONE: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' };
const STATUS_LABEL: Record<string, string> = { all: 'All statuses', open: 'Open', under_review: 'Under review', resolved: 'Resolved', 'closed,rejected,cancelled': 'Closed' };

export const ISSUE_TYPES = ['wrong_debit', 'failed_transfer', 'failed_bill', 'account_hacked', 'unauthorized_charge', 'other'];

export function SlaBadge({ t }: { t: Pick<TicketRow, 'sla' | 'firstResponseAt' | 'status'> }) {
  if (t.sla.overdue) return <Badge tone="danger"><AlertTriangle size={11} /> Reply overdue</Badge>;
  if (t.firstResponseAt) return t.sla.met ? <Badge tone="success">Replied in time</Badge> : <Badge tone="warning">Replied late</Badge>;
  if (['resolved', 'closed', 'rejected', 'cancelled'].includes(t.status)) return null;
  return <Badge tone="info">Reply {formatRelative(t.sla.firstResponseDueAt)}</Badge>;
}

export default function TicketsPage() {
  const [, navigate] = useLocation();
  const [f, setF] = useUrlState({
    status: 'active', priority: '', category: '', assignee: '', search: '', overdue: '', escalated: '', from: '', to: '', sort: 'lastActivity', page: '1',
  });

  const assignees = useAdminQuery<{ id: string; name: string }[]>('/admin/tickets/assignees');
  const { data, isLoading, isFetching, error, refetch } = useAdminQuery<{
    tickets: TicketRow[]; statusCounts: Record<string, number>; pagination: { page: number; pages: number; total: number };
  }>('/admin/tickets', {
    page: f.page, limit: 25, status: f.status === 'all' ? '' : f.status, priority: f.priority, category: f.category, assignee: f.assignee,
    search: f.search, overdue: f.overdue, escalated: f.escalated, sort: f.sort,
    from: f.from ? lagosDateToUtc(f.from) : undefined, to: f.to ? lagosDateToUtc(f.to, true) : undefined,
  }, { refetchInterval: 60_000 });
  const counts = data?.statusCounts ?? {};
  const active = (counts.open ?? 0) + (counts.under_review ?? 0);

  return (
    <div>
      <PageHeader
        eyebrow="Support"
        title="Tickets"
        description="Customer disputes and support requests. First-reply targets: critical 1h, high 4h, medium 24h, low 72h. Times in WAT."
        actions={<Button icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Button>}
      />
      <FilterPanel
        search={f.search}
        onSearch={(v) => setF({ search: v })}
        searchPlaceholder="Ticket number, customer or text"
        onClearAll={() => setF({ status: 'active', priority: '', category: '', assignee: '', search: '', overdue: '', escalated: '', from: '', to: '' })}
        quick={(
          <>
            <QuickToggle on={f.assignee === 'me'} onClick={() => setF({ assignee: f.assignee === 'me' ? '' : 'me' })}>Mine</QuickToggle>
            <QuickToggle tone="danger" on={f.overdue === 'true'} onClick={() => setF({ overdue: f.overdue === 'true' ? '' : 'true' })}>Overdue</QuickToggle>
            <QuickToggle tone="danger" on={f.escalated === 'true'} onClick={() => setF({ escalated: f.escalated === 'true' ? '' : 'true' })}>Escalated</QuickToggle>
          </>
        )}
        active={[
          ...(f.status !== 'active' ? [{ key: 'status', label: `Status: ${STATUS_LABEL[f.status] ?? humanize(f.status)}`, onRemove: () => setF({ status: 'active' }) }] : []),
          ...(f.priority ? [{ key: 'priority', label: `Priority: ${humanize(f.priority)}`, onRemove: () => setF({ priority: '' }) }] : []),
          ...(f.category ? [{ key: 'category', label: humanize(f.category), onRemove: () => setF({ category: '' }) }] : []),
          ...(f.assignee ? [{ key: 'assignee', label: f.assignee === 'me' ? 'Assigned to me' : f.assignee === 'unassigned' ? 'Unassigned' : `Assigned to ${(assignees.data ?? []).find((a) => a.id === f.assignee)?.name ?? 'someone'}`, onRemove: () => setF({ assignee: '' }) }] : []),
          ...(f.overdue ? [{ key: 'overdue', label: 'Reply overdue', onRemove: () => setF({ overdue: '' }) }] : []),
          ...(f.escalated ? [{ key: 'escalated', label: 'Escalated', onRemove: () => setF({ escalated: '' }) }] : []),
          ...(f.from || f.to ? [{ key: 'date', label: `Raised ${dateRangeLabel(f.from, f.to)}`, onRemove: () => setF({ from: '', to: '' }) }] : []),
        ]}
      >
        <FilterGroup label="Status">
          <FilterSelect label="Status" defaultValue="active" value={f.status} onChange={(v) => setF({ status: v })} options={[
            { value: 'active', label: 'Active (open + under review)', count: active },
            { value: 'open', label: 'Open', count: counts.open ?? 0 },
            { value: 'under_review', label: 'Under review', count: counts.under_review ?? 0 },
            { value: 'resolved', label: 'Resolved', count: counts.resolved ?? 0 },
            { value: 'closed,rejected,cancelled', label: 'Closed' },
            { value: 'all', label: 'All statuses' },
          ]} />
        </FilterGroup>
        <FilterGroup label="Priority">
          <FilterSelect label="Priority" value={f.priority} onChange={(v) => setF({ priority: v })}
            options={[{ value: '', label: 'Any priority' }, ...['critical', 'high', 'medium', 'low'].map((p) => ({ value: p, label: humanize(p) }))]} />
        </FilterGroup>
        <FilterGroup label="Category">
          <FilterSelect label="Category" value={f.category} onChange={(v) => setF({ category: v })}
            options={[{ value: '', label: 'Any category' }, ...ISSUE_TYPES.map((t) => ({ value: t, label: humanize(t) }))]} />
        </FilterGroup>
        <FilterGroup label="Assigned to">
          <FilterSelect label="Assigned to" value={f.assignee} onChange={(v) => setF({ assignee: v })}
            options={[{ value: '', label: 'Anyone' }, { value: 'me', label: 'Me' }, { value: 'unassigned', label: 'Unassigned' }, ...(assignees.data ?? []).map((a) => ({ value: a.id, label: a.name }))]} />
        </FilterGroup>
        <DateGroup label="Date raised (Lagos)" from={f.from} to={f.to} onChange={(from, to) => setF({ from, to })} />
        <FilterGroup label="Sort by">
          <FilterSelect label="Sort by" defaultValue="lastActivity" value={f.sort} onChange={(v) => setF({ sort: v })}
            options={[{ value: 'lastActivity', label: 'Latest activity' }, { value: 'created', label: 'Newest first' }, { value: 'priority', label: 'Priority, oldest first' }]} />
        </FilterGroup>
      </FilterPanel>

      <DataTable
        rows={data?.tickets}
        loading={isLoading || isFetching}
        error={error}
        onRetry={() => refetch()}
        rowKey={(t) => t.id}
        onRowClick={(t) => navigate(adminPath(`/tickets/${t.id}`))}
        dense
        columns={[
          {
            key: 'ticket', header: 'Ticket', cell: (t) => (
              <div className="min-w-0">
                <Mono>{t.ticketNumber}</Mono>
                <p className="truncate text-xs text-(--ad-muted)">{humanize(t.issueType)}{t.escalated && <Badge tone="danger" className="ml-1.5">Escalated</Badge>}</p>
              </div>
            ),
          },
          {
            key: 'customer', header: 'Customer', cell: (t) => (
              <div className="min-w-0 max-w-56">
                <p className="truncate text-(--ad-fg-strong)">{fullName(t.user)}</p>
                <p className="truncate text-xs text-(--ad-muted)">{t.user.userType === 'merchant' ? 'Merchant' : 'Customer'} · {t.user.email}</p>
              </div>
            ),
          },
          { key: 'priority', header: 'Priority', cell: (t) => <Badge tone={PRIORITY_TONE[t.priority] ?? 'neutral'}>{humanize(t.priority)}</Badge> },
          { key: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
          { key: 'assignee', header: 'Assigned', cell: (t) => t.assignedTo ? <span className="text-xs">{t.assignedTo.name}</span> : <span className="text-xs text-[#b45309]">Unassigned</span> },
          { key: 'sla', header: 'First reply', cell: (t) => <SlaBadge t={t} /> },
          { key: 'age', header: 'Age', hideOnMobile: true, cell: (t) => <span className="text-xs text-(--ad-muted)" title={formatDateTime(t.createdAt)}>{formatRelative(t.createdAt).replace(' ago', '')}</span> },
          {
            key: 'activity', header: 'Last activity', hideOnMobile: true, cell: (t) => (
              <span className="text-xs text-(--ad-muted)" title={formatDateTime(t.lastActivityAt)}>
                {formatRelative(t.lastActivityAt)}{t.lastResponseAt ? ` · replied ${formatRelative(t.lastResponseAt)}` : ''}
              </span>
            ),
          },
        ]}
        footer={data && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} label="tickets" onPage={(p) => setF({ page: String(p) })} />}
      />
    </div>
  );
}
