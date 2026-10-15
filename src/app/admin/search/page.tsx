import React from 'react';
import { Link, useSearch } from 'wouter';
import { PageHeader, Card, StatusBadge, Mono, EmptyState, Spinner } from '@/components/admin/ui';
import { useAdminQuery } from '@/components/admin/hooks';
import { adminPath } from '@/lib/adminPaths';
import { formatDateTime, formatMoney, fullName, humanize } from '@/lib/adminFormat';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';

/** One search across the areas this admin may see. Each section uses its own server-side search. */
export default function SearchPage() {
  const q = new URLSearchParams(useSearch()).get('q')?.trim() ?? '';
  const perms = useAdminAuthStore((s) => s.admin?.permissions ?? []);
  const can = (p: string) => perms.includes(p);
  const query = { search: q, limit: 8 };
  const users = useAdminQuery<{ users: any[] }>(q && can('users.view') ? '/admin/users' : null, query);
  const merchants = useAdminQuery<{ merchants: any[] }>(q && can('merchants.view') ? '/admin/merchants' : null, query);
  const txs = useAdminQuery<{ transactions: any[] }>(q && can('transactions.view') ? '/admin/transactions' : null, query);
  const tickets = useAdminQuery<{ tickets: any[] }>(q && can('tickets.view') ? '/admin/tickets' : null, { ...query, status: '' });

  const section = (title: string, perm: string, state: { isLoading: boolean; data?: unknown }, rows: any[] | undefined, render: (r: any) => React.ReactNode, more: string) => can(perm) && (
    <Card title={title} actions={rows?.length ? <Link href={adminPath(more)} className="text-xs font-semibold text-[#0f766e] hover:underline">See all →</Link> : undefined} bodyClassName="p-0">
      {state.isLoading ? <Spinner /> : !rows?.length ? <EmptyState title="No matches" /> : <ul className="divide-y divide-(--ad-border)">{rows.map(render)}</ul>}
    </Card>
  );
  const enc = encodeURIComponent(q);

  return (
    <div>
      <PageHeader eyebrow="Search" title={q ? <>Results for “{q}”</> : 'Search'} description="Searches customers, merchants, transaction references and tickets you have access to." />
      {!q ? <Card><EmptyState title="Type in the search box at the top" /></Card> : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {section('Customers', 'users.view', users, users.data?.users, (u) => (
            <li key={u.id}><Link href={adminPath(`/users/${u.id}`)} className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-(--ad-card-hover)">
              <span className="min-w-0"><span className="block truncate text-sm font-medium">{fullName(u)}</span><span className="block truncate text-xs text-(--ad-muted)">{u.email}{u.phone ? ` · ${u.phone}` : ''}</span></span>
              <StatusBadge status={u.isActive ? 'active' : 'suspended'} />
            </Link></li>
          ), `/users?search=${enc}`)}
          {section('Merchants', 'merchants.view', merchants, merchants.data?.merchants, (m) => (
            <li key={m.id}><Link href={adminPath(`/merchants/${m.id}`)} className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-(--ad-card-hover)">
              <span className="min-w-0"><span className="block truncate text-sm font-medium">{m.merchantProfile?.tradingName || m.merchantProfile?.businessName}</span><span className="block truncate text-xs text-(--ad-muted)">{m.email}</span></span>
              <StatusBadge status={m.merchantProfile?.verified ? 'verified' : 'pending'} />
            </Link></li>
          ), `/merchants?search=${enc}`)}
          {section('Transactions', 'transactions.view', txs, txs.data?.transactions, (t) => (
            <li key={t.id}><Link href={adminPath(`/transactions?search=${encodeURIComponent(t.reference)}`)} className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-(--ad-card-hover)">
              <span className="min-w-0"><Mono>{t.reference}</Mono><span className="block truncate text-xs text-(--ad-muted)">{humanize(t.type)} · {formatDateTime(t.createdAt)}</span></span>
              <span className="flex items-center gap-2"><span className="text-sm tabular-nums">{formatMoney(t.amount)}</span><StatusBadge status={t.status} /></span>
            </Link></li>
          ), `/transactions?search=${enc}`)}
          {section('Tickets', 'tickets.view', tickets, tickets.data?.tickets, (t) => (
            <li key={t.id}><Link href={adminPath(`/tickets/${t.id}`)} className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-(--ad-card-hover)">
              <span className="min-w-0"><Mono>{t.ticketNumber}</Mono><span className="block truncate text-xs text-(--ad-muted)">{fullName(t.user)} · {humanize(t.issueType)}</span></span>
              <StatusBadge status={t.status} />
            </Link></li>
          ), `/tickets?status=all&search=${enc}`)}
        </div>
      )}
    </div>
  );
}
