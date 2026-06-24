
import React, { useMemo } from 'react';
import { AdminTxRecord, useAdminTransactionsStore } from '@/store/useAdminTransactionsStore';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/utils/formatCurrency';
import { ArrowRight } from 'lucide-react';

export default function AdminTransactionsPage() {
  const { transactions } = useAdminTransactionsStore();

  const successCount = transactions.filter((t) => t.status === 'success').length;
  const pendingCount = transactions.filter((t) => t.status === 'pending').length;
  const failedCount = transactions.filter((t) => t.status === 'failed').length;

  const columns = useMemo<ColumnDef<AdminTxRecord>[]>(
    () => [
      {
        accessorKey: 'reference',
        header: 'Reference',
        cell: ({ row }) => (
          <span
            className="rounded-lg px-2.5 py-1 text-xs font-black tracking-tight"
            style={{ background: 'rgba(111,232,214,0.08)', color: '#6fe8d6' }}
          >
            {row.original.reference}
          </span>
        ),
      },
      {
        accessorKey: 'senderName',
        header: 'Routing',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm" style={{ color: 'var(--ad-fg-strong)' }}>
              {row.original.senderName}
            </p>
            <ArrowRight size={12} style={{ color: 'var(--ad-muted-soft)' }} />
            <p className="text-xs font-bold" style={{ color: 'var(--ad-muted)' }}>
              {row.original.recipientName}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="text-base font-black" style={{ color: '#6fe8d6' }}>
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Category',
        cell: ({ row }) => (
          <span
            className="capitalize rounded-lg px-3 py-1 text-xs font-black"
            style={{
              background: 'rgba(111,232,214,0.06)',
              color: 'var(--ad-muted)',
              border: '1px solid rgba(111,232,214,0.1)',
            }}
          >
            {row.original.type}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const map: Record<string, { bg: string; color: string }> = {
            success: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
            pending: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
            failed: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
          };
          const s = map[status] ?? { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' };
          return (
            <span
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"
              style={{ background: s.bg, color: s.color }}
            >
              {status}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ad-muted-soft)' }}>
            Platform Ledger
          </p>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--ad-fg-strong)' }}>
            Transactions
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--ad-muted)' }}>
            {transactions.length} platform transaction{transactions.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Success', count: successCount, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
            { label: 'Pending', count: pendingCount, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
            { label: 'Failed', count: failedCount, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-3 py-2 text-center"
              style={{ background: s.bg, border: `1px solid ${s.color}30` }}
            >
              <p className="text-xs font-black" style={{ color: s.color }}>
                {s.count}
              </p>
              <p className="text-[9px] font-bold uppercase" style={{ color: s.color + 'aa' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      <DataTable columns={columns} data={transactions} />
    </div>
  );
}
