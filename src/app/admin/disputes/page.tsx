
import React, { useMemo } from 'react';
import { useAdminDisputesStore, DisputeRecord } from '@/store/useAdminDisputesStore';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/utils/formatCurrency';
import { AlertTriangle } from 'lucide-react';

export default function AdminDisputesPage() {
  const { disputes, updateStatus } = useAdminDisputesStore();

  const openCount = disputes.filter((d) => d.status === 'open').length;
  const reviewCount = disputes.filter((d) => d.status === 'under_review').length;

  const columns = useMemo<ColumnDef<DisputeRecord>[]>(
    () => [
      {
        accessorKey: 'ticketNumber',
        header: 'Ticket #',
        cell: ({ row }) => (
          <span
            className="rounded-lg px-2.5 py-1 text-xs font-black tracking-tight"
            style={{ background: 'rgba(111,232,214,0.08)', color: '#6fe8d6' }}
          >
            {row.original.ticketNumber}
          </span>
        ),
      },
      {
        accessorKey: 'userName',
        header: 'Reporter',
        cell: ({ row }) => (
          <span className="font-bold text-sm" style={{ color: '#000000' }}>
            {row.original.userName}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Disputed Amount',
        cell: ({ row }) => (
          <span className="font-black text-sm" style={{ color: '#f87171' }}>
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: 'issueType',
        header: 'Issue Type',
        cell: ({ row }) => (
          <span
            className="capitalize rounded-lg px-3 py-1.5 text-xs font-black"
            style={{
              background: 'rgba(111,232,214,0.06)',
              color: '#666666',
              border: '1px solid rgba(111,232,214,0.1)',
            }}
          >
            {row.original.issueType.replace(/_/g, ' ')}
          </span>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => {
          const priority = row.original.priority;
          const map: Record<string, { bg: string; color: string }> = {
            high: { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
            medium: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
            low: { bg: 'rgba(111,232,214,0.07)', color: '#999999' },
          };
          const s = map[priority] ?? map.low;
          return (
            <span
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"
              style={{ background: s.bg, color: s.color }}
            >
              {priority}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <select
              value={status}
              onChange={(e) => updateStatus(row.original.id, e.target.value as any)}
              className="rounded-xl px-3 py-2 text-xs font-black focus:outline-none cursor-pointer transition-all"
              style={{
                background: 'rgba(111,232,214,0.08)',
                border: '1px solid rgba(111,232,214,0.15)',
                color: '#6fe8d6',
              }}
            >
              <option value="open">OPEN TICKET</option>
              <option value="under_review">UNDER REVIEW</option>
              <option value="resolved">MARK RESOLVED</option>
              <option value="closed">FORCE CLOSE</option>
            </select>
          );
        },
      },
    ],
    [updateStatus]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#999999' }}>
            Resolution Center
          </p>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: '#000000' }}>
            Disputes
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: '#666666' }}>
            Review and resolve customer chargebacks and transfer failures.
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Open', count: openCount, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
            { label: 'Under Review', count: reviewCount, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2"
              style={{ background: s.bg, border: `1px solid ${s.color}30` }}
            >
              <AlertTriangle size={12} style={{ color: s.color }} />
              <span className="text-xs font-black" style={{ color: s.color }}>
                {s.count} {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={disputes} />
    </div>
  );
}
