'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminMerchantsStore } from '@/store/useAdminUsersStore';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/utils/formatCurrency';
import { useToast } from '@/hooks/useToast';
import { Store, Check, X, Search, ExternalLink, RefreshCw, Package, ShoppingBag } from 'lucide-react';
import adminApiClient from '@/lib/adminApiClient';

export default function AdminMerchantsPage() {
  const [, navigate] = useLocation();
  const { merchants, toggleStatus, refresh, loading } = useAdminMerchantsStore() as any;
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'suspended'>('all');

  useEffect(() => {
    refresh();
  }, []);

  const filteredMerchants = useMemo(() => {
    return merchants.filter((m: any) => {
      const businessName = m.merchantProfile?.tradingName || m.merchantProfile?.businessName || m.firstName + ' ' + m.lastName;
      const matchesSearch =
        businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.phone && m.phone.includes(searchTerm));
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'pending' && !m.merchantProfile?.verified) ||
        (filterStatus === 'approved' && m.merchantProfile?.verified) ||
        (filterStatus === 'suspended' && !m.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [merchants, searchTerm, filterStatus]);

  const pendingCount = merchants.filter((m: any) => !m.merchantProfile?.verified).length;
  const approvedCount = merchants.filter((m: any) => m.merchantProfile?.verified).length;
  const suspendedCount = merchants.filter((m: any) => !m.isActive).length;

  const handleApprove = async (e: React.MouseEvent, merchantId: string) => {
    e.stopPropagation();
    try {
      await adminApiClient.verifyMerchant(merchantId);
      showSuccess('Merchant approved successfully');
      refresh();
    } catch {
      showError('Failed to approve merchant');
    }
  };

  const handleToggleStatus = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleStatus(id);
    showSuccess('Merchant status updated');
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Business Profile',
        cell: ({ row }) => {
          const m = row.original;
          const businessName = m.merchantProfile?.tradingName || m.merchantProfile?.businessName || `${m.firstName} ${m.lastName}`;
          const isVerified = m.merchantProfile?.verified;
          return (
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                style={{
                  background: isVerified ? 'rgba(111,232,214,0.12)' : 'rgba(251,191,36,0.12)',
                  color: isVerified ? '#6fe8d6' : '#fbbf24',
                  border: `1px solid ${isVerified ? 'rgba(111,232,214,0.2)' : 'rgba(251,191,36,0.2)'}`,
                }}
              >
                <Store size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: 'var(--ad-fg-strong)' }}>{businessName}</p>
                <p className="text-xs font-medium mt-0.5 truncate" style={{ color: 'var(--ad-muted)' }}>
                  {m.firstName} {m.lastName} · {m.email}
                </p>
              </div>
              <ExternalLink size={15} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          );
        },
      },
      {
        id: 'business',
        header: 'Business Type',
        cell: ({ row }) => (
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--ad-fg-strong)' }}>{row.original.merchantProfile?.businessType || 'N/A'}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--ad-muted)' }}>{row.original.merchantProfile?.category || '—'}</p>
          </div>
        ),
      },
      {
        id: 'store',
        header: 'Store',
        cell: ({ row }) => {
          const store = row.original.merchantProfile?.store;
          return store ? (
            <div className="flex items-center gap-1.5">
              <Package size={13} style={{ color: '#6fe8d6' }} />
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--ad-fg-strong)' }}>{store._count?.products || 0} products</p>
                <p className="text-[10px]" style={{ color: 'var(--ad-muted)' }}>{store._count?.orders || 0} orders</p>
              </div>
            </div>
          ) : (
            <span className="text-xs" style={{ color: 'var(--ad-muted)' }}>No store</span>
          );
        },
      },
      {
        id: 'balance',
        header: 'Merchant Wallet',
        cell: ({ row }) => {
          const balance = row.original.merchantProfile?.wallet?.balance ?? row.original.wallet?.balance ?? 0;
          return (
            <span className="font-black text-sm" style={{ color: '#6fe8d6' }}>
              {formatCurrency(Number(balance))}
            </span>
          );
        },
      },
      {
        id: 'verification',
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
        id: 'status',
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
          const m = row.original;
          const isVerified = m.merchantProfile?.verified;
          return (
            <div className="flex gap-2">
              {!isVerified && (
                <button
                  onClick={(e) => handleApprove(e, m.id)}
                  className="rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5 flex items-center gap-1"
                  style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
                  title="Approve Merchant"
                >
                  <Check size={13} /> Approve
                </button>
              )}
              <button
                onClick={(e) => handleToggleStatus(e, m.id)}
                className="rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: m.isActive ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                  color: m.isActive ? '#f87171' : '#34d399',
                  border: `1px solid ${m.isActive ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
                }}
                title={m.isActive ? 'Suspend' : 'Activate'}
              >
                {m.isActive ? <X size={13} /> : <Check size={13} />}
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ad-muted-soft)' }}>
            Business Registry
          </p>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--ad-fg-strong)' }}>
            Merchant Management
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--ad-muted)' }}>
            {merchants.length} registered merchant{merchants.length !== 1 ? 's' : ''} · {pendingCount} pending approval
          </p>
        </div>
        <div className="flex items-center gap-3">
          {[
            { label: 'Pending', count: pendingCount, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
            { label: 'Verified', count: approvedCount, color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
            { label: 'Suspended', count: suspendedCount, color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-4 py-2.5 text-center min-w-[80px]"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <p className="text-lg font-black" style={{ color: s.color }}>{s.count}</p>
              <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: s.color + 'aa' }}>{s.label}</p>
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
            placeholder="Search by business name, owner name, email or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
            style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)', color: 'var(--ad-fg-strong)' }}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'suspended'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterStatus(filter)}
              className="rounded-xl px-4 py-2.5 text-xs font-bold capitalize transition-all"
              style={{
                background: filterStatus === filter ? '#6fe8d6' : 'var(--ad-card)',
                color: filterStatus === filter ? '#1a1a1a' : 'var(--ad-muted)',
                border: filterStatus === filter ? '1px solid #6fe8d6' : '1px solid var(--ad-border)',
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredMerchants}
        onRowClick={(row) => navigate('/admin/merchants/' + row.original.id)}
        rowClassName="cursor-pointer hover:bg-white/5 transition-colors group"
      />
    </div>
  );
}
