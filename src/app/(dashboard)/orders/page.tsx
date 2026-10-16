import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Package } from 'lucide-react';
import { ordersApi, Order, naira, orderStatusStyle } from './shared';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { ordersApi.list().then(setOrders).catch((e) => setError(e?.message || 'Could not load your orders')); }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!orders) return <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>;
  if (!orders.length) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <Package size={28} className="mx-auto" style={{ color: 'var(--text-tertiary)' }} />
        <p className="mt-3 font-semibold" style={{ color: 'var(--text-primary)' }}>No orders yet</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Your marketplace purchases will appear here.</p>
        <Link href="/marketplace" className="mt-4 inline-block text-sm font-semibold" style={{ color: '#6fe8d6' }}>Browse the marketplace</Link>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/orders/${o.id}`} className="block rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{o.store?.name ?? o.merchantSlug}</span>
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize" style={orderStatusStyle(o.status)}>{o.status}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span>{o.items.length} item{o.items.length === 1 ? '' : 's'} · {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{naira(o.totalAmount)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
