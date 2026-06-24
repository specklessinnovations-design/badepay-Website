import React, { useMemo, useState } from 'react';
import { useAdminUsersStore } from '@/store/useAdminUsersStore';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/utils/formatCurrency';
import { useToast } from '@/hooks/useToast';
import { Store, Check, X, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import adminApiClient from '@/lib/adminApiClient';

export default function AdminMerchantsPage() {
  const { users, toggleStatus } = useAdminUsersStore();
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'suspended'>('all');

  // Filter for merchants only
  const merchants = useMemo(() => {
    return users.filter((u) => u.userType === 'merchant');
  }, [users]);

  // Apply search and status filters
  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      const matchesSearch = 
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.phone && m.phone.includes(searchTerm));
      
      const matchesStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'pending' && !m.merchantProfile?.verified) ||
        (filterStatus === 'approved' && m.merchantProfile?.verified) ||
        (filterStatus === 'suspended' && !m.isActive);
      
      return matchesSearch && matchesStatus;
    });
  }, [merchants, searchTerm, filterStatus]);

  const pendingCount = merchants.filter((m) => !m.merchantProfile?.verified).length;
  const approvedCount = merchants.filter((m) => m.merchantProfile?.verified).length;
  const suspendedCount = merchants.filter((m) => !m.isActive).length;

  const handleApprove = async (merchantId: string) => {
    try {
      await adminApiClient.verifyMerchant(merchantId);
      showSuccess('Merchant approved successfully');
      // Refresh data
      useAdminUsersStore.getState().refresh();
    } catch {
      showError('Failed to approve merchant');
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleStatus(id);
    showSuccess('Merchant status updated');
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Business Profile',
        cell: ({ row }) => {
          const merchant = row.original;
          const businessName = merchant.merchantProfile?.tradingName || merchant.merchantProfile?.businessName || merchant.fullName;
          const isVerified = merchant.merchantProfile?.verified;
          return (
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black flex-shrink-0"
                style={{
                  background: isVerified ? 'rgba(111,232,214,0.12)' : 'rgba(251,191,36,0.12)',
                  color: isVerified ? '#6fe8d6' : '#fbbf24',
                  border: `1px solid ${isVerified ? 'rgba(111,232,214,0.2)' : 'rgba(251,191,36,0.2)'}`,
                }}
              >
                <Store size={18} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--ad-fg-strong)' }}>
                  {businessName}
                </p>
                <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--ad-muted)' }}>
                  {merchant.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'merchantProfile.businessType',
        header: 'Business Type',
        cell: ({ row }) => (
          <span className="text-xs font-bold" style={{ color: 'var(--ad-muted)' }}>
            {row.original.merchantProfile?.businessType || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'merchantProfile.category',
        header: 'Category',
        cell: ({ row }) => (
          <span
            className="rounded-lg px-3 py-1 text-xs font-black capitalize"
            style={{
              background: 'rgba(111,232,214,0.08)',
              color: 'var(--ad-muted)',
              border: '1px solid rgba(111,232,214,0.12)',
            }}
          >
            {row.original.merchantProfile?.category || 'N/A'}
          </span>
        ),
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
        accessorKey: 'merchantProfile.verified',
        header: 'Verification',
        cell: ({ row }) => {
          const isVerified = row.original.merchantProfile?.verified;
          return (
            <span
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"
              style={{
                background: isVerified ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
                color: isVerified ? '#34d399' : '#fbbf24',
              }}
            >
              {isVerified ? 'Verified' : 'Pending'}
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
        header: 'Actions',
        cell: ({ row }) => {
          const merchant = row.original;
          const isVerified = merchant.merchantProfile?.verified;
          return (
            <div className="flex gap-2">
              {!isVerified && (
                <button
                  onClick={() => handleApprove(merchant.id)}
                  className="rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'rgba(52,211,153,0.1)',
                    color: '#34d399',
                    border: '1px solid rgba(52,211,153,0.2)',
                  }}
                  title="Approve Merchant"
                >
                  <Check size={14} />
                </button>
              )}
              <button
                onClick={() => handleToggleStatus(merchant.id)}
                className="rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: merchant.isActive
                    ? 'rgba(248,113,113,0.1)'
                    : 'rgba(52,211,153,0.1)',
                  color: merchant.isActive ? '#f87171' : '#34d399',
                  border: `1px solid ${merchant.isActive ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
                }}
                title={merchant.isActive ? 'Suspend' : 'Activate'}
              >
                {merchant.isActive ? <X size={14} /> : <Check size={14} />}
              </button>
            </div>
          );
        },
      },
    ],
    [filteredMerchants]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ad-muted-soft)' }}>
            Business Registry
          </p>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--ad-fg-strong)' }}>
            Merchant Management
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--ad-muted)' }}>
            {merchants.length} registered merchant{merchants.length === 1 ? '' : 's'} · {pendingCount} pending approval
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Pending', count: pendingCount, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
            { label: 'Approved', count: approvedCount, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
            { label: 'Suspended', count: suspendedCount, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ad-muted-soft)' }} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
            style={{
              background: 'var(--ad-card)',
              border: '1px solid #e5e5e5',
              color: 'var(--ad-fg-strong)',
            }}
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'suspended', label: 'Suspended' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value as any)}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                filterStatus === filter.value
                  ? 'bg-[#6fe8d6] text-[#1a1a1a]'
                  : 'bg-[var(--ad-card)] text-[var(--ad-fg-strong)]/60 hover:bg-[var(--ad-card)]/5'
              }`}
              style={{
                border: filterStatus === filter.value ? '1px solid #6fe8d6' : '1px solid #e5e5e5',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={filteredMerchants} />
    </div>
  );
}
