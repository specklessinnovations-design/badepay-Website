
import React, { useEffect, useState } from 'react';
import { useAdminAnalyticsStore } from '@/store/useAdminAnalyticsStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { DollarSign, Users, Activity, CreditCard, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

const A_CARD = {
  background: 'var(--ad-card)',
  border: '1px solid var(--ad-border)',
  borderRadius: '1rem',
  boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
} as const;

export default function AdminAnalyticsPage() {
  const { data, refresh, loading } = useAdminAnalyticsStore() as any;
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    refresh();
  }, []);

  const { kpiSummary, dailyRevenue, monthlyVolume, weeklyUsers } = data;

  // Calculate growth percentages
  const revenueGrowth = dailyRevenue.length > 1
    ? ((dailyRevenue[dailyRevenue.length - 1].amount - dailyRevenue[dailyRevenue.length - 2].amount) / dailyRevenue[dailyRevenue.length - 2].amount * 100).toFixed(1)
    : '0';
  const volumeGrowth = monthlyVolume.length > 1
    ? ((monthlyVolume[monthlyVolume.length - 1].volume - monthlyVolume[monthlyVolume.length - 2].volume) / monthlyVolume[monthlyVolume.length - 2].volume * 100).toFixed(1)
    : '0';

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
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="rounded-xl px-4 py-2.5 text-sm font-black focus:outline-none cursor-pointer"
            style={{
              background: 'rgba(111,232,214,0.08)',
              border: '1px solid rgba(111,232,214,0.15)',
              color: '#6fe8d6',
            }}
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">This Year</option>
          </select>
          <button
            onClick={refresh}
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-black transition-all hover:-translate-y-0.5"
            style={{
              background: 'var(--ad-card)',
              border: '1px solid var(--ad-border)',
              color: 'var(--ad-fg-strong)',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
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
          { 
            icon: DollarSign, 
            label: 'Gross Revenue', 
            value: formatCurrency(kpiSummary.totalRevenue), 
            color: '#6fe8d6',
            growth: revenueGrowth,
            isPositive: parseFloat(revenueGrowth) >= 0
          },
          { 
            icon: Activity, 
            label: 'Total Volume', 
            value: formatCurrency(kpiSummary.totalVolume), 
            color: '#60a5fa',
            growth: volumeGrowth,
            isPositive: parseFloat(volumeGrowth) >= 0
          },
          { icon: CreditCard, label: 'Transactions', value: kpiSummary.totalTransactions.toLocaleString(), color: '#a78bfa' },
          { icon: Users, label: 'Active Today', value: kpiSummary.activeToday.toLocaleString(), color: '#34d399' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl p-5" style={A_CARD}>
            <div className="flex items-start justify-between mb-4">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: `${kpi.color}18`, color: kpi.color }}
              >
                <kpi.icon size={22} />
              </div>
              {kpi.growth !== undefined && (
                <div className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black" style={{
                  background: kpi.isPositive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                  color: kpi.isPositive ? '#34d399' : '#f87171',
                }}>
                  {kpi.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(parseFloat(kpi.growth))}%
                </div>
              )}
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black" style={{ color: 'var(--ad-fg-strong)' }}>
              Daily Revenue Trend
            </h3>
            <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black" style={{
              background: 'rgba(111,232,214,0.1)',
              color: '#6fe8d6',
            }}>
              <span className="w-2 h-2 rounded-full bg-[#6fe8d6] animate-pulse" />
              Live
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6fe8d6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6fe8d6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6fe8d6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={A_CARD}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black" style={{ color: 'var(--ad-fg-strong)' }}>
              Monthly Volume Growth
            </h3>
            <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black" style={{
              background: 'rgba(96,165,250,0.1)',
              color: '#60a5fa',
            }}>
              <span className="w-2 h-2 rounded-full bg-[#60a5fa] animate-pulse" />
              Live
            </div>
          </div>
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
                <Bar dataKey="volume" fill="#60a5fa" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Users Chart */}
      <div className="rounded-2xl p-6" style={A_CARD}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-black" style={{ color: 'var(--ad-fg-strong)' }}>
            Weekly User Growth
          </h3>
          <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black" style={{
            background: 'rgba(167,139,250,0.1)',
            color: '#a78bfa',
          }}>
            <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
            Live
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyUsers}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(111,232,214,0.07)" />
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--ad-muted-soft)', fontWeight: 'bold' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--ad-muted-soft)', fontWeight: 'bold' }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [value.toLocaleString(), name === 'newUsers' ? 'New Users' : 'Active Users']}
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
                dataKey="newUsers"
                stroke="#a78bfa"
                strokeWidth={3}
                dot={{ fill: '#a78bfa', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#a78bfa', stroke: '#030f0d', strokeWidth: 2 }}
                name="New Users"
              />
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke="#34d399"
                strokeWidth={3}
                dot={{ fill: '#34d399', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#34d399', stroke: '#030f0d', strokeWidth: 2 }}
                name="Active Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
