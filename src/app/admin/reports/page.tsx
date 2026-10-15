import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { PageHeader, Card, Segmented, Spinner, ErrorState, EmptyState, StatCard, Button, Can, DataTable } from '@/components/admin/ui';
import { useAdminQuery, useAdminAction } from '@/components/admin/hooks';
import { adminDownload } from '@/lib/adminApiClient';
import { formatMoney, formatNumber, humanize, lagosDayStart } from '@/lib/adminFormat';
import { useCan } from '@/store/useAdminAuthStore';

interface Day { day: string; count: number; value: number; failed: number; revenue: number; byType: Record<string, number> }
type Range = '7' | '30' | '90';

const dayLabel = (ymd: string) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Single-series column chart: daily successful volume. Hover a column for the day's numbers. */
function VolumeChart({ days, showRevenue }: { days: Day[]; showRevenue: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...days.map((d) => d.value), 1);
  const h = hover !== null ? days[hover] : null;
  return (
    <div className="relative">
      <div className="flex h-56 items-end gap-[2px] border-b border-(--ad-border-strong) pt-6" role="img" aria-label="Daily successful transaction volume">
        {days.map((d, i) => (
          <div
            key={d.day}
            className="flex h-full flex-1 items-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            aria-label={`${dayLabel(d.day)}: ${formatMoney(d.value)}`}
          >
            <div
              className="w-full rounded-t-[4px] transition-opacity"
              style={{ height: `${Math.max((d.value / max) * 100, d.value ? 1 : 0)}%`, background: '#0f766e', opacity: hover === null || hover === i ? 1 : 0.45 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-(--ad-muted)">
        <span>{dayLabel(days[0].day)}</span>
        <span>{dayLabel(days[days.length - 1].day)}</span>
      </div>
      <p className="absolute left-0 top-0 text-[10px] text-(--ad-muted)">{formatMoney(max, { compact: true })}</p>
      {h && (
        <div className="pointer-events-none absolute right-0 top-0 z-10 w-56 rounded-lg border border-(--ad-border) bg-(--ad-card) p-3 text-xs shadow-lg">
          <p className="font-semibold text-(--ad-fg-strong)">{dayLabel(h.day)}</p>
          <p className="mt-1 flex justify-between"><span className="text-(--ad-muted)">Successful volume</span><span className="font-semibold">{formatMoney(h.value)}</span></p>
          <p className="flex justify-between"><span className="text-(--ad-muted)">Successful payments</span><span>{formatNumber(h.count)}</span></p>
          <p className="flex justify-between"><span className="text-(--ad-muted)">Failed / reversed</span><span>{formatNumber(h.failed)}</span></p>
          {showRevenue && <p className="flex justify-between"><span className="text-(--ad-muted)">Revenue</span><span>{formatMoney(h.revenue)}</span></p>}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const showRevenue = useCan('finance.reports.view');
  const [range, setRange] = useState<Range>('30');
  const from = useMemo(() => new Date(lagosDayStart().getTime() - (Number(range) - 1) * 86_400_000).toISOString(), [range]);
  const { data, isLoading, error, refetch } = useAdminQuery<{ days: Day[] }>('/admin/reports/daily', { from });
  const { run, pending } = useAdminAction();

  // Fill days with no activity so the chart's time axis is continuous.
  const days = useMemo(() => {
    const byDay = new Map((data?.days ?? []).map((d) => [d.day, d]));
    const out: Day[] = [];
    const start = new Date(from).getTime() + 3_600_000; // Lagos midnight → that Lagos date
    for (let i = 0; i < Number(range); i += 1) {
      const ymd = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
      out.push(byDay.get(ymd) ?? { day: ymd, count: 0, value: 0, failed: 0, revenue: 0, byType: {} });
    }
    return out;
  }, [data, from, range]);

  const totals = days.reduce((t, d) => ({ value: t.value + d.value, count: t.count + d.count, failed: t.failed + d.failed, revenue: t.revenue + d.revenue }), { value: 0, count: 0, failed: 0, revenue: 0 });
  const byType = days.reduce<Record<string, number>>((acc, d) => { for (const [k, v] of Object.entries(d.byType)) acc[k] = (acc[k] ?? 0) + v; return acc; }, {});

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Reports"
        description="Daily figures by Lagos calendar day, computed on the server from the full records. Volume = successful payments (each counted once); revenue = net fee income from the ledger. Wallet balances and settled funds are separate measures."
        actions={(
          <>
            <Segmented value={range} onChange={setRange} options={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: '90', label: '90 days' }]} />
            <Can perm="transactions.export">
              <Button icon={<Download size={14} />} loading={pending === 'export'} onClick={() => run('export', () => adminDownload('/admin/transactions/export', { from }), 'Export downloaded (recorded in the audit log)')}>Export transactions</Button>
            </Can>
          </>
        )}
      />
      {isLoading ? <Spinner /> : error ? <Card><ErrorState error={error} onRetry={() => refetch()} /></Card> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Successful volume" value={formatMoney(totals.value, { compact: true })} definition="Sum of successful transaction amounts, excluding recipient mirror rows." />
            <StatCard label="Successful payments" value={formatNumber(totals.count)} />
            <StatCard label="Failed / reversed" value={formatNumber(totals.failed)} tone="danger" />
            {showRevenue && <StatCard label="Revenue" value={formatMoney(totals.revenue, { compact: true })} tone="success" definition="Net credits to the fee_income ledger account." />}
          </div>
          <Card title="Daily successful volume">
            {totals.count === 0 ? <EmptyState title="No successful payments in this period" /> : <VolumeChart days={days} showRevenue={showRevenue} />}
          </Card>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card title="Volume by type" className="lg:col-span-1">
              {Object.keys(byType).length === 0 ? <EmptyState title="Nothing yet" /> : (
                <ul className="space-y-2 text-sm">
                  {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, v]) => (
                    <li key={t} className="flex justify-between"><span>{humanize(t)}</span><span className="tabular-nums">{formatMoney(v)}</span></li>
                  ))}
                </ul>
              )}
            </Card>
            <div className="lg:col-span-2">
              <DataTable
                dense
                rows={[...days].reverse()}
                rowKey={(d) => d.day}
                columns={[
                  { key: 'day', header: 'Day (Lagos)', cell: (d) => dayLabel(d.day) },
                  { key: 'value', header: 'Volume', align: 'right', cell: (d) => formatMoney(d.value) },
                  { key: 'count', header: 'Payments', align: 'right', cell: (d) => formatNumber(d.count) },
                  { key: 'failed', header: 'Failed', align: 'right', cell: (d) => formatNumber(d.failed) },
                  ...(showRevenue ? [{ key: 'rev', header: 'Revenue', align: 'right' as const, cell: (d: Day) => formatMoney(d.revenue) }] : []),
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
