import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { MapPin } from 'lucide-react';
import { ordersApi, Order, naira, orderStatusStyle } from './shared';

/** One order: items, payment, delivery address; card orders can re-check their payment (mobile app: Order). */
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const params = new URLSearchParams(window.location.search);
  const fromCheckout = params.get('checkout') === '1';
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    setChecking(true);
    try {
      const res = await ordersApi.verifyPayment(id);
      setOrder((o) => ({ ...(o as Order), ...res.order }));
      setNotice(res.order.paymentStatus === 'paid'
        ? { ok: true, text: 'Payment received — your order is confirmed.' }
        : res.order.status === 'cancelled'
          ? { ok: false, text: 'The card payment failed and the order was cancelled.' }
          : { ok: true, text: 'We’re still waiting for the payment to be confirmed.' });
    } catch (e) {
      setNotice({ ok: false, text: (e as Error)?.message || 'Could not check the payment' });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    ordersApi.get(id).then((o) => { setOrder(o); if (fromCheckout) void verify(); })
      .catch((e) => setError(e?.message || 'Could not load this order'));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!order) return <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>;
  const card = { background: 'var(--card)', border: '1px solid var(--border)' } as const;
  return (
    <div className="space-y-4">
      <Link href="/orders" className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>← My orders</Link>
      {notice && <p className="rounded-xl px-3 py-2.5 text-sm" style={{ background: notice.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: notice.ok ? '#10b981' : '#ef4444' }}>{notice.text}</p>}
      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{order.store?.name ?? order.merchantSlug}</span>
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize" style={orderStatusStyle(order.status)}>{order.status}</span>
        </div>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>Ref {order.reference} · {new Date(order.createdAt).toLocaleString('en-GB')}</p>
        <p className="mt-0.5 text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>Payment: {order.paymentMethod} · {order.paymentStatus}</p>
      </div>
      <div className="overflow-hidden rounded-2xl" style={card}>
        {order.items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 p-3" style={{ borderBottom: '1px solid var(--border)' }}>
            {it.product?.images?.[0] ? <img src={it.product.images[0].imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg" style={{ background: 'var(--surface-secondary)' }} />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{it.product?.name ?? 'Product'}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Qty {it.quantity}</p>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{naira(Number(it.priceAtPurchase) * it.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between p-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}><span>Total</span><span>{naira(order.totalAmount)}</span></div>
      </div>
      {order.shippingAddress && (
        <div className="flex gap-3 rounded-2xl p-4 text-sm" style={card}>
          <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{order.shippingAddress.recipientName}</p>
            <p style={{ color: 'var(--text-secondary)' }}>{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}, {order.shippingAddress.city}, {order.shippingAddress.state}</p>
            <p style={{ color: 'var(--text-secondary)' }}>{order.shippingAddress.phone}</p>
          </div>
        </div>
      )}
      {order.paymentMethod === 'card' && order.paymentStatus === 'unpaid' && order.status !== 'cancelled' && (
        <button type="button" onClick={verify} disabled={checking} className="w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60" style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          {checking ? 'Checking…' : 'Check payment status'}
        </button>
      )}
    </div>
  );
}
