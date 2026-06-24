
import React from 'react';
import { useAdminAnalyticsStore } from '@/store/useAdminAnalyticsStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, Users, Activity, CreditCard } from 'lucide-react';

const A_CARD = {
  background: 'var(--ad-card)',
  border: '1px solid #e5e5e5',
  borderRadius: '1rem',
  boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
} as const;

export default function AdminAnalyticsPage() {
  const { data } = useAdminAnalyticsStore();
  const { kpiSummary, dailyRevenue, monthlyVolume } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ad-muted-soft)' }}>
            Growth Metrics
          </p>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--ad-fg-strong)' }}>
            Platform Analytics
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--ad-muted)' }}>
            Real-time metrics, revenue tracking, and growth funnels.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            className="rounded-xl px-4 py-2.5 text-sm font-black focus:outline-none"
            style={{
              background: 'rgba(111,232,214,0.08)',
              border: '1px solid rgba(111,232,214,0.15)',
              color: '#6fe8d6',
            }}
          >
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Year</option>
          </select>
          <button
            className="rounded-xl px-6 py-2.5 text-sm font-black transition-all hover:-translate-y-0.5"
            style={{
              background: '#6fe8d6',
              color: '#030f0d',
              boxShadow: '0 4px 16px rgba(111,232,214,0.3)',
            }}
          >
            Export Report
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: DollarSign, label: 'Gross Revenue', value: formatCurrency(kpiSummary.totalRevenue), color: '#6fe8d6' },
          { icon: Activity, label: 'Total Volume', value: formatCurrency(kpiSummary.totalVolume), color: '#60a5fa' },
          { icon: CreditCard, label: 'Transactions', value: kpiSummary.totalTransactions.toLocaleString(), color: '#a78bfa' },
          { icon: Users, label: 'Active Today', value: kpiSummary.activeToday.toLocaleString(), color: '#34d399' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl p-5" style={A_CARD}>
            <div
              className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: `${kpi.color}18`, color: kpi.color }}
            >
              <kpi.icon size={22} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ad-muted-soft)' }}>
              {kpi.label}
            </p>
            <h3 className="mt-1 text-2xl font-black" style={{ color: 'var(--ad-fg-strong)' }}>
              {kpi.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl p-6" style={A_CARD}>
          <h3 className="mb-6 text-base font-black" style={{ color: 'var(--ad-fg-strong)' }}>
            Daily Revenue Trend
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(111,232,214,0.07)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'var(--ad-muted-soft)', fontWeight: 'bold' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'var(--ad-muted-soft)', fontWeight: 'bold' }}
                  tickFormatter={(val) => `₦${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value: number) => [`₦${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(111,232,214,0.2)',
                    background: 'var(--ad-card)',
                    color: 'var(--ad-fg-strong)',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                  labelStyle={{ color: 'var(--ad-muted)' }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#6fe8d6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#6fe8d6', stroke: '#030f0d', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={A_CARD}>
          <h3 className="mb-6 text-base font-black" style={{ color: 'var(--ad-fg-strong)' }}>
            Monthly Volume Growth
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyVolume}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(111,232,214,0.07)" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'var(--ad-muted-soft)', fontWeight: 'bold' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'var(--ad-muted-soft)', fontWeight: 'bold' }}
                  tickFormatter={(val) => `₦${val / 1000000}m`}
                />
                <Tooltip
                  formatter={(value: number) => [`₦${Number(value).toLocaleString()}`, 'Volume']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(111,232,214,0.2)',
                    background: 'var(--ad-card)',
                    color: 'var(--ad-fg-strong)',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                  labelStyle={{ color: 'var(--ad-muted)' }}
                  cursor={{ fill: 'rgba(111,232,214,0.04)' }}
                />
                <Bar dataKey="volume" fill="#6fe8d6" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
