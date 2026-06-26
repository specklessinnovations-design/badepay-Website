'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminUsersStore } from '@/store/useAdminUsersStore';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/utils/formatCurrency';
import { useToast } from '@/hooks/useToast';
import { Store, User, ExternalLink, Search, Shield, RefreshCw } from 'lucide-react';

export default function AdminUsersPage() {
  const [, navigate] = useLocation();
  const { users, toggleStatus, refresh, loading } = useAdminUsersStore() as any;
  const { showSuccess } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [kycFilter, setKycFilter] = useState<'all' | 'verified' | 'pending' | 'unverified'>('all');

  useEffect(() => {
    refresh();
  }, []);

  const handleToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleStatus(id);
    showSuccess('User status updated');
  };

  const filtered = useMemo(() => {
    return users.filter((u: any) => {
      const nameMatch =
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm) ||
        u.accountNumber?.includes(searchTerm);
      const statusMatch =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive) ||
        (statusFilter === 'suspended' && !u.isActive);
      const kycMatch =
        kycFilter === 'all' || u.kycStatus === kycFilter;
      return nameMatch && statusMatch && kycMatch;
    });
  }, [users, searchTerm, statusFilter, kycFilter]);

  const merchantCount = users.filter((u: any) => u.userType === 'merchant').length;
  const personalCount = users.filter((u: any) => u.userType !== 'merchant').length;
  const activeCount = users.filter((u: any) => u.isActive).length;

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'User Profile',
        cell: ({ row }) => {
          const u = row.original;
          const hasMerchant = u.userType === 'merchant' || !!u.merchantProfile;
          return (
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black flex-shrink-0"
                style={{
                  background: hasMerchant ? 'rgba(111,232,214,0.12)' : 'rgba(96,165,250,0.12)',
                  color: hasMerchant ? '#6fe8d6' : '#60a5fa',
                  border: `1px solid ${hasMerchant ? 'rgba(111,232,214,0.2)' : 'rgba(96,165,250,0.2)'}`,
                }}
              >
                {u.fullName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--ad-fg-strong)' }}>
                    {u.fullName}
                  </p>
                  {hasMerchant && (
                    <span
                      className="flex-shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                      style={{ background: 'rgba(111,232,214,0.15)', color: '#6fe8d6', border: '1px solid rgba(111,232,214,0.25)' }}
                    >
                      +Merchant
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium mt-0.5 truncate" style={{ color: 'var(--ad-muted)' }}>
                  {u.email}
                </p>
              </div>
              <ExternalLink size={15} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          );
        },
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <span className="text-sm font-medium" style={{ color: 'var(--ad-fg-strong)' }}>
            {row.original.phone || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'accountNumber',
        header: 'Account No.',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold" style={{ color: '#6fe8d6' }}>
            {row.original.accountNumber || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        cell: ({ row }) => (
          <span className="font-black text-sm" style={{ color: '#6fe8d6' }}>
            {formatCurrency(row.original.balance || 0)}
          </span>
        ),
      },
      {
        accessorKey: 'kycStatus',
        header: 'KYC',
        cell: ({ row }) => {
          const status = row.original.kycStatus;
          const styles: Record<string, { bg: string; color: string }> = {
            verified: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
            pending: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
            unverified: { bg: 'rgba(111,232,214,0.06)', color: 'var(--ad-muted-soft)' },
          };
          const s = styles[status] ?? styles.unverified;
          return (
            <span
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"
              style={{ background: s.bg, color: s.color }}
            >
              {status || 'unverified'}
            </span>
          );
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"
            style={{
              background: row.original.isActive ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              color: row.original.isActive ? '#34d399' : '#f87171',
            }}
          >
            {row.original.isActive ? 'Active' : 'Suspended'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleToggle(e, u.id)}
                className="rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: u.isActive ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                  color: u.isActive ? '#f87171' : '#34d399',
                  border: `1px solid ${u.isActive ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
                }}
              >
                {u.isActive ? 'Suspend' : 'Activate'}
              </button>
              {u.userType === 'merchant' && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/admin/merchants/' + u.id); }}
                  className="rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'rgba(111,232,214,0.1)',
                    color: '#6fe8d6',
                    border: '1px solid rgba(111,232,214,0.2)',
                  }}
                  title="View Merchant Account"
                >
                  <Store size={13} />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [users]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ad-muted-soft)' }}>
            User Registry
          </p>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--ad-fg-strong)' }}>
            User Management
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--ad-muted)' }}>
            {users.length} total registered accounts · {activeCount} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5"
            style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}
          >
            <User size={14} style={{ color: '#60a5fa' }} />
            <span className="text-xs font-black" style={{ color: '#60a5fa' }}>{personalCount} Personal</span>
          </div>
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5"
            style={{ background: 'rgba(111,232,214,0.1)', border: '1px solid rgba(111,232,214,0.2)' }}
          >
            <Store size={14} style={{ color: '#6fe8d6' }} />
            <span className="text-xs font-black" style={{ color: '#6fe8d6' }}>{merchantCount} Also Merchant</span>
          </div>
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
            placeholder="Search by name, email, phone, account number…"
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
          {(['all', 'active', 'suspended'] as const).map((s) => (
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
        <div className="flex gap-2">
          {(['all', 'verified', 'pending', 'unverified'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKycFilter(k)}
              className="rounded-xl px-4 py-2.5 text-xs font-bold capitalize transition-all"
              style={{
                background: kycFilter === k ? '#6fe8d6' : 'var(--ad-card)',
                color: kycFilter === k ? '#1a1a1a' : 'var(--ad-muted)',
                border: kycFilter === k ? '1px solid #6fe8d6' : '1px solid var(--ad-border)',
              }}
            >
              <Shield size={11} className="inline mr-1" />
              {k}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => navigate('/admin/users/' + row.original.id)}
        rowClassName="cursor-pointer hover:bg-white/5 transition-colors group"
      />
    </div>
  );
}
