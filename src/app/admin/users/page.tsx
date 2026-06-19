
import React, { useMemo } from 'react';
import { AdminUserRecord, useAdminUsersStore } from '@/store/useAdminUsersStore';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/utils/formatCurrency';
import { useToast } from '@/hooks/useToast';
import { Store, User } from 'lucide-react';

export default function AdminUsersPage() {
  const { users, toggleStatus } = useAdminUsersStore();
  const { showSuccess } = useToast();

  const handleToggle = (id: string) => {
    toggleStatus(id);
    showSuccess('User status updated');
  };

  const merchantCount = users.filter((u) => u.userType === 'merchant').length;
  const personalCount = users.filter((u) => u.userType === 'consumer').length;

  const columns = useMemo<ColumnDef<AdminUserRecord>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'User Profile',
        cell: ({ row }) => {
          const isMerchant = row.original.userType === 'merchant';
          return (
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black flex-shrink-0"
                style={{
                  background: isMerchant ? 'rgba(111,232,214,0.12)' : 'rgba(96,165,250,0.12)',
                  color: isMerchant ? '#6fe8d6' : '#60a5fa',
                  border: `1px solid ${isMerchant ? 'rgba(111,232,214,0.2)' : 'rgba(96,165,250,0.2)'}`,
                }}
              >
                {row.original.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: '#000000' }}>
                  {row.original.fullName}
                </p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#666666' }}>
                  {row.original.email}
                </p>
              </div>
            </div>
          );
        },
      },
      { accessorKey: 'phone', header: 'Phone Number' },
      {
        accessorKey: 'userType',
        header: 'Account Type',
        cell: ({ row }) => {
          const isMerchant = row.original.userType === 'merchant';
          return (
            <div className="flex items-center gap-1.5">
              <span
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black capitalize"
                style={{
                  background: isMerchant ? 'rgba(111,232,214,0.1)' : 'rgba(96,165,250,0.1)',
                  color: isMerchant ? '#6fe8d6' : '#60a5fa',
                  border: `1px solid ${isMerchant ? 'rgba(111,232,214,0.2)' : 'rgba(96,165,250,0.2)'}`,
                }}
              >
                {isMerchant ? <Store size={11} /> : <User size={11} />}
                {row.original.userType}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'balance',
        header: 'Wallet Balance',
        cell: ({ row }) => (
          <span className="font-black text-sm" style={{ color: '#6fe8d6' }}>
            {formatCurrency(row.original.balance)}
          </span>
        ),
      },
      {
        accessorKey: 'kycStatus',
        header: 'KYC Tier',
        cell: ({ row }) => {
          const status = row.original.kycStatus;
          const styles: Record<string, { bg: string; color: string }> = {
            verified: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
            pending: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
            unverified: { bg: 'rgba(111,232,214,0.06)', color: '#999999' },
          };
          const s = styles[status] ?? styles.unverified;
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
        cell: ({ row }) => (
          <button
            onClick={() => handleToggle(row.original.id)}
            className="rounded-xl px-4 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
            style={{
              background: row.original.isActive
                ? 'rgba(248,113,113,0.1)'
                : 'rgba(52,211,153,0.1)',
              color: row.original.isActive ? '#f87171' : '#34d399',
              border: `1px solid ${row.original.isActive ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
            }}
          >
            {row.original.isActive ? 'Suspend' : 'Activate'}
          </button>
        ),
      },
    ],
    [users]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#999999' }}>
            User Registry
          </p>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: '#000000' }}>
            User Management
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: '#666666' }}>
            {users.length} registered account{users.length === 1 ? '' : 's'} · live from platform registry
          </p>
        </div>
        <div className="flex gap-3">
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5"
            style={{
              background: 'rgba(96,165,250,0.1)',
              border: '1px solid rgba(96,165,250,0.2)',
            }}
          >
            <User size={14} style={{ color: '#60a5fa' }} />
            <span className="text-xs font-black" style={{ color: '#60a5fa' }}>
              {personalCount} Personal
            </span>
          </div>
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5"
            style={{
              background: 'rgba(111,232,214,0.1)',
              border: '1px solid rgba(111,232,214,0.2)',
            }}
          >
            <Store size={14} style={{ color: '#6fe8d6' }} />
            <span className="text-xs font-black" style={{ color: '#6fe8d6' }}>
              {merchantCount} Merchant
            </span>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={users} />
    </div>
  );
}
