
import React from 'react';
import { Users, CreditCard, Activity, AlertCircle, Store, User, TrendingUp, Zap } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAdminAnalyticsStore } from '@/store/useAdminAnalyticsStore';
import { useAdminUsersStore } from '@/store/useAdminUsersStore';
import { useAdminDisputesStore } from '@/store/useAdminDisputesStore';
import { useAdminTransactionsStore } from '@/store/useAdminTransactionsStore';

const A_CARD = {
  background: '#ffffff',
  border: '1px solid #e5e5e5',
  borderRadius: '1rem',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(111,232,214,0.06)',
} as const;

export default function AdminDashboardPage() {
  const { data } = useAdminAnalyticsStore();
  const { kpiSummary } = data;
  const { users } = useAdminUsersStore();
  const { disputes } = useAdminDisputesStore();
  const { transactions } = useAdminTransactionsStore();

  const merchantCount = users.filter((u) => u.userType === 'merchant').length;
  const personalCount = users.filter((u) => u.userType === 'consumer').length;
  const openDisputes = disputes.filter((d) => d.status === 'open').length;
  const pendingTx = transactions.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#666666' }}>
          BadePay · Admin Console
        </p>
        <h2 className="text-3xl font-black tracking-tight" style={{ color: '#000000' }}>
          Platform Dashboard
        </h2>
        <p className="text-sm font-medium" style={{ color: '#666666' }}>
          Live registry — {users.length} accounts across web and mobile clients
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={kpiSummary.totalUsers.toLocaleString()}
          sub={`${personalCount} personal · ${merchantCount} merchant`}
          color="#6fe8d6"
        />
        <StatCard
          icon={Activity}
          label="Total Volume"
          value={formatCurrency(kpiSummary.totalVolume)}
          sub="All-time platform volume"
          color="#60a5fa"
        />
        <StatCard
          icon={CreditCard}
          label="Transactions"
          value={kpiSummary.totalTransactions.toLocaleString()}
          sub={`${pendingTx} pending`}
          color="#a78bfa"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending KYC"
          value={String(kpiSummary.pendingKYC)}
          sub="Awaiting verification"
          color="#fbbf24"
        />
      </div>

      {/* Account type breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl p-5" style={A_CARD}>
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}
            >
              <User size={20} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#666666' }}>
              Personal accounts
            </p>
          </div>
          <p className="text-3xl font-black" style={{ color: '#000000' }}>
            {personalCount}
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(111,232,214,0.1)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.round((personalCount / Math.max(users.length, 1)) * 100)}%`, background: '#60a5fa' }}
            />
          </div>
        </div>

        <div className="rounded-2xl p-5" style={A_CARD}>
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(111,232,214,0.12)', color: '#6fe8d6' }}
            >
              <Store size={20} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#666666' }}>
              Merchant accounts
            </p>
          </div>
          <p className="text-3xl font-black" style={{ color: '#000000' }}>
            {merchantCount}
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(111,232,214,0.1)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.round((merchantCount / Math.max(users.length, 1)) * 100)}%`, background: '#6fe8d6' }}
            />
          </div>
        </div>

        <div className="rounded-2xl p-5" style={A_CARD}>
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}
            >
              <AlertCircle size={20} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#666666' }}>
              Open disputes
            </p>
          </div>
          <p className="text-3xl font-black" style={{ color: openDisputes > 0 ? '#f87171' : '#000000' }}>
            {openDisputes}
          </p>
          <p className="mt-2 text-xs font-medium" style={{ color: '#666666' }}>
            {disputes.length} total raised
          </p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl p-6" style={A_CARD}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} style={{ color: '#6fe8d6' }} />
            <h3 className="text-sm font-black" style={{ color: '#000000' }}>
              Revenue Summary
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Gross Revenue', value: formatCurrency(kpiSummary.totalRevenue), color: '#6fe8d6' },
              { label: 'Platform Volume', value: formatCurrency(kpiSummary.totalVolume), color: '#60a5fa' },
              { label: 'Active Today', value: kpiSummary.activeToday.toLocaleString() + ' users', color: '#a78bfa' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: '#666666' }}>{row.label}</span>
                <span className="text-sm font-black" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-6" style={A_CARD}>
          <div className="mb-4 flex items-center gap-2">
            <Zap size={16} style={{ color: '#6fe8d6' }} />
            <h3 className="text-sm font-black" style={{ color: '#000000' }}>
              Platform Status
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'KYC Verification Queue', value: `${kpiSummary.pendingKYC} pending`, ok: kpiSummary.pendingKYC === 0 },
              { label: 'Open Disputes', value: `${openDisputes} unresolved`, ok: openDisputes === 0 },
              { label: 'Pending Transactions', value: `${pendingTx} awaiting`, ok: pendingTx === 0 },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: '#666666' }}>{row.label}</span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase"
                  style={{
                    background: row.ok ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
                    color: row.ok ? '#34d399' : '#fbbf24',
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info note */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(111,232,214,0.04)',
          border: '1px solid rgba(111,232,214,0.1)',
        }}
      >
        <p className="text-xs font-bold" style={{ color: '#666666' }}>
          <span style={{ color: '#6fe8d6' }}>Data note:</span> All signups — web and mobile — write to the same
          account registry. Admin reads directly from that registry plus platform transactions, disputes, and merchant
          payments. When a live API is connected, this layer swaps to API calls without changing the admin UI.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200"
      style={{
        background: '#ffffff',
        border: '1px solid #e5e5e5',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}
    >
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: `${color}18`, color }}
      >
        <Icon size={22} />
      </div>
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#666666' }}>
        {label}
      </p>
      <h3 className="mt-1 text-2xl font-black" style={{ color: '#000000' }}>
        {value}
      </h3>
      <p className="mt-1 text-[10px] font-medium" style={{ color: '#666666' }}>
        {sub}
      </p>
    </div>
  );
}
