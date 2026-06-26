
import React, { useMemo, useState, useEffect } from 'react';
import { KYCSubmission, useAdminKYCStore } from '@/store/useAdminKYCStore';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { useToast } from '@/hooks/useToast';
import { ShieldCheck, Search, RefreshCw } from 'lucide-react';

export default function AdminKYCPage() {
  const { submissions, approveKYC, rejectKYC, refresh, loading } = useAdminKYCStore() as any;
  const { showSuccess } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return submissions.filter((s: any) => {
      const searchMatch =
        s.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch =
        statusFilter === 'all' || s.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [submissions, searchTerm, statusFilter]);

  const handleApprove = (id: string) => {
    approveKYC(id);
    showSuccess('KYC approved');
  };

  const handleReject = (id: string) => {
    rejectKYC(id);
    showSuccess('KYC rejected');
  };

  const pendingCount = submissions.filter((s: any) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s: any) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s: any) => s.status === 'rejected').length;

  const columns = useMemo<ColumnDef<KYCSubmission>[]>(
    () => [
      {
        accessorKey: 'userName',
        header: 'User Profile',
        cell: ({ row }) => (
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--ad-fg-strong)' }}>
              {row.original.userName}
            </p>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--ad-muted)' }}>
              {row.original.userEmail}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'idType',
        header: 'Document',
        cell: ({ row }) => (
          <span
            className="rounded-lg px-3 py-1.5 text-xs font-black"
            style={{
              background: 'rgba(111,232,214,0.08)',
              color: 'var(--ad-muted)',
              border: '1px solid rgba(111,232,214,0.12)',
            }}
          >
            {row.original.idType}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const map: Record<string, { bg: string; color: string }> = {
            approved: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
            pending: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
            rejected: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
          };
          const s = map[status] ?? map.pending;
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
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          if (row.original.status !== 'pending') {
            return (
              <span className="text-xs font-bold" style={{ color: 'var(--ad-muted-soft)' }}>
                —
              </span>
            );
          }
          return (
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(row.original.id)}
                className="rounded-xl px-4 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: 'rgba(52,211,153,0.1)',
                  color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.2)',
                }}
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(row.original.id)}
                className="rounded-xl px-4 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: 'rgba(248,113,113,0.1)',
                  color: '#f87171',
                  border: '1px solid rgba(248,113,113,0.2)',
                }}
              >
                Reject
              </button>
            </div>
          );
        },
      },
    ],
    [submissions]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ad-muted-soft)' }}>
            Identity Verification
          </p>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--ad-fg-strong)' }}>
            KYC Review Queue
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--ad-muted)' }}>
            {submissions.length} total submission{submissions.length !== 1 ? 's' : ''} · {pendingCount} awaiting review
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: 'Pending', count: pendingCount, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
            { label: 'Approved', count: approvedCount, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
            { label: 'Rejected', count: rejectedCount, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2"
              style={{ background: s.bg, border: `1px solid ${s.color}30` }}
            >
              <ShieldCheck size={12} style={{ color: s.color }} />
              <span className="text-xs font-black" style={{ color: s.color }}>
                {s.count} {s.label}
              </span>
            </div>
          ))}
          <button
            onClick={refresh}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)', color: 'var(--ad-fg-strong)' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ad-muted-soft)' }} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
            style={{
              background: 'var(--ad-card)',
              border: '1px solid var(--ad-border)',
              color: 'var(--ad-fg-strong)',
            }}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="rounded-xl px-4 py-2.5 text-xs font-bold capitalize transition-all"
              style={{
                background: statusFilter === s ? '#6fe8d6' : 'var(--ad-card)',
                color: statusFilter === s ? '#1a1a1a' : 'var(--ad-muted)',
                border: statusFilter === s ? '1px solid #6fe8d6' : '1px solid var(--ad-border)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
