import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { PageHeader, DataTable, Pagination, StatusBadge, Button, Mono, Can } from '@/components/admin/ui';
import { FilterPanel, FilterGroup, FilterSelect, DateGroup, dateRangeLabel } from '@/components/admin/filters';
import { useAdminQuery, useAdminAction, useUrlState } from '@/components/admin/hooks';
import { AdminTransaction, TransactionDrawer } from '@/components/admin/TransactionDrawer';
import { adminDownload } from '@/lib/adminApiClient';
import { formatDateTime, formatMoney, humanize, fullName, lagosDateToUtc } from '@/lib/adminFormat';

export const TX_TYPES = ['transfer', 'withdrawal', 'funding', 'card_funding', 'bill_payment', 'qr_payment', 'store_order', 'card_withdrawal'];
export const TX_STATUSES = ['success', 'pending', 'processing', 'failed', 'reversed', 'held', 'review'];

export default function TransactionsPage() {
  const [f, setF] = useUrlState({ search: '', type: '', status: '', from: '', to: '', page: '1' });
  const [open, setOpen] = useState<AdminTransaction | null>(null);
  const { run, pending } = useAdminAction();

  const filters = {
    search: f.search, type: f.type, status: f.status,
    startDate: f.from ? lagosDateToUtc(f.from) : undefined, endDate: f.to ? lagosDateToUtc(f.to, true) : undefined,
  };
  const { data, isLoading, isFetching, error, refetch } = useAdminQuery<{
    transactions: AdminTransaction[]; filteredVolume: number; pagination: { page: number; pages: number; total: number };
  }>('/admin/transactions', { ...filters, page: f.page, limit: 25 });

  const exportCsv = () => run('export', () => adminDownload('/admin/transactions/export', {
    search: filters.search, type: filters.type, status: filters.status, from: filters.startDate, to: filters.endDate,
  }), 'Export downloaded (recorded in the audit log)');

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Transactions"
        description="Each payment appears once (recipient mirror rows are hidden). Times are Lagos time."
        actions={(
          <>
            <Button icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>Refresh</Button>
            <Can perm="transactions.export">
              <Button icon={<Download size={14} />} loading={pending === 'export'} onClick={exportCsv}>Export CSV</Button>
            </Can>
          </>
        )}
      />
      <FilterPanel
        search={f.search}
        onSearch={(v) => setF({ search: v })}
        searchPlaceholder="Reference, description, customer name or email"
        onClearAll={() => setF({ search: '', type: '', status: '', from: '', to: '' })}
        active={[
          ...(f.status ? [{ key: 'status', label: `Status: ${humanize(f.status)}`, onRemove: () => setF({ status: '' }) }] : []),
          ...(f.type ? [{ key: 'type', label: `Type: ${humanize(f.type)}`, onRemove: () => setF({ type: '' }) }] : []),
          ...(f.from || f.to ? [{ key: 'date', label: dateRangeLabel(f.from, f.to), onRemove: () => setF({ from: '', to: '' }) }] : []),
        ]}
      >
        <FilterGroup label="Status">
          <FilterSelect label="Status" value={f.status} onChange={(v) => setF({ status: v })}
            options={[{ value: '', label: 'Any status' }, ...TX_STATUSES.map((s) => ({ value: s, label: humanize(s) }))]} />
        </FilterGroup>
        <FilterGroup label="Type">
          <FilterSelect label="Type" value={f.type} onChange={(v) => setF({ type: v })}
            options={[{ value: '', label: 'All types' }, ...TX_TYPES.map((t) => ({ value: t, label: humanize(t) }))]} />
        </FilterGroup>
        <DateGroup label="Date (Lagos)" from={f.from} to={f.to} onChange={(from, to) => setF({ from, to })} />
      </FilterPanel>

      {data && (
        <p className="mb-2 text-xs text-(--ad-muted)">
          {data.pagination.total.toLocaleString('en-NG')} transactions match · successful value <span className="font-semibold text-(--ad-fg-strong)">{formatMoney(data.filteredVolume)}</span>
        </p>
      )}

      <DataTable
        rows={data?.transactions}
        loading={isLoading || isFetching}
        error={error}
        onRetry={() => refetch()}
        rowKey={(t) => t.id}
        onRowClick={setOpen}
        columns={[
          { key: 'ref', header: 'Reference', cell: (t) => <Mono>{t.reference}</Mono> },
          {
            key: 'what', header: 'Description', cell: (t) => (
              <div className="min-w-0 max-w-[280px]">
                <p className="truncate text-(--ad-fg-strong)">{t.description || humanize(t.type)}</p>
                <p className="truncate text-xs text-(--ad-muted)">{humanize(t.type)}{t.sender ? ` · from ${fullName(t.sender)}` : ''}{t.recipient ? ` → ${fullName(t.recipient)}` : ''}</p>
              </div>
            ),
          },
          { key: 'amount', header: 'Amount', align: 'right', cell: (t) => <span className="font-semibold">{formatMoney(t.amount)}</span> },
          { key: 'fee', header: 'Fee', align: 'right', hideOnMobile: true, cell: (t) => <span className="text-xs text-(--ad-muted)">{Number(t.fee) ? formatMoney(t.fee) : '—'}</span> },
          { key: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
          { key: 'time', header: 'Time (WAT)', hideOnMobile: true, cell: (t) => <span className="whitespace-nowrap text-xs text-(--ad-muted)">{formatDateTime(t.createdAt)}</span> },
        ]}
        footer={data && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} label="transactions" onPage={(p) => setF({ page: String(p) })} />}
      />
      <TransactionDrawer tx={open} onClose={() => setOpen(null)} />
    </div>
  );
}
