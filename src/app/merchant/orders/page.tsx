import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp,
  Package, CreditCard, Banknote, X, Check, AlertCircle, Filter, TrendingUp
} from 'lucide-react';
import { useMerchantStoreData } from '@/store/useMerchantStoreData';
import { type Order } from '@/services/merchantService';
import { useAuthStore } from '@/store/useAuthStore';
import { formatNGN, formatDate, formatTimeAgo } from '@/utils/formatting';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Clock },
  confirmed: { label: 'Confirmed', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: CheckCircle2 },
  completed: { label: 'Completed', color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: XCircle },
};

function OrderCard({ order, onConfirm, onComplete, onCancel }: {
  order: Order;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CONFIG[order.status];
  const Icon = sc.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: sc.bg }}>
          <Icon size={18} style={{ color: sc.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>
              {order.customerName}
            </p>
            <span className="text-[10px] font-black rounded-full px-2 py-0.5 flex-shrink-0"
              style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
            {order.paymentStatus === 'paid' && (
              <span className="text-[10px] font-black rounded-full px-2 py-0.5 flex-shrink-0"
                style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>Paid</span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {order.reference} · {formatTimeAgo(order.createdAt)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-black" style={{ color: 'var(--accent-text)' }}>
            {formatNGN(order.totalAmount)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
          </p>
        </div>
        {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          : <ChevronDown size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />}
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" as const }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 space-y-3"
              style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>

              {/* Items list */}
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 rounded-xl p-2.5"
                    style={{ background: 'var(--surface-secondary)' }}>
                    {item.product.imageUrl && (
                      <img src={item.product.imageUrl} alt={item.product.name}
                        className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.product.name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        {formatNGN(item.product.price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-black flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                      {formatNGN(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Order meta */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-2.5" style={{ background: 'var(--surface-secondary)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}>Payment</p>
                  <div className="flex items-center gap-1.5">
                    {order.paymentMethod === 'wallet'
                      ? <CreditCard size={12} style={{ color: 'var(--accent-text)' }} />
                      : <Banknote size={12} style={{ color: '#60a5fa' }} />}
                    <p className="text-xs font-black capitalize" style={{ color: 'var(--text-primary)' }}>
                      {order.paymentMethod}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: 'var(--surface-secondary)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}>Customer Phone</p>
                  <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                    {order.customerPhone || '—'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              {order.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={onCancel}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-all active:scale-95"
                    style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                    <X size={12} /> Cancel
                  </button>
                  <button onClick={onConfirm}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-all active:scale-95"
                    style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                    <Check size={12} /> Confirm Order
                  </button>
                </div>
              )}
              {order.status === 'confirmed' && (
                <button onClick={onComplete}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black transition-all active:scale-95"
                  style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <CheckCircle2 size={13} /> Mark as Completed
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function MerchantOrdersPage() {
  const user = useAuthStore(s => s.user);
  const { orders, updateOrderStatus } = useMerchantStoreData();
  const merchantSlug = user?.merchantProfile?.qrSlug || user?.id || '';

  const myOrders = orders.filter(o => o.merchantSlug === merchantSlug);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = myOrders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchSearch = !search
      || o.customerName.toLowerCase().includes(search.toLowerCase())
      || o.reference.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: myOrders.length,
    pending: myOrders.filter(o => o.status === 'pending').length,
    completed: myOrders.filter(o => o.status === 'completed').length,
    revenue: myOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0),
  };

  const handleConfirm = (id: string) => {
    updateOrderStatus(id, 'confirmed');
    toast.success('Order confirmed!');
  };
  const handleComplete = (id: string) => {
    updateOrderStatus(id, 'completed');
    toast.success('Order completed!');
  };
  const handleCancel = (id: string) => {
    updateOrderStatus(id, 'cancelled');
    toast.error('Order cancelled');
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Orders</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {myOrders.length} total order{myOrders.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders', value: stats.total.toString(), color: 'var(--text-primary)', sub: 'All time' },
          { label: 'Pending', value: stats.pending.toString(), color: '#f59e0b', sub: 'Needs attention' },
          { label: 'Completed', value: stats.completed.toString(), color: '#34d399', sub: 'Fulfilled' },
          { label: 'Revenue', value: formatNGN(stats.revenue, { compact: true }), color: 'var(--accent-text)', sub: 'From paid orders' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
            <p className="text-2xl font-black tracking-tight" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer or reference…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all"
              style={{
                background: statusFilter === s ? '#6fe8d6' : 'transparent',
                color: statusFilter === s ? '#1a1a1a' : 'var(--text-secondary)',
              }}>{s}</button>
          ))}
        </div>
      </motion.div>

      {/* ── Orders list ── */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl p-14 text-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-4 accent-icon-wrap">
            <ShoppingBag size={28} style={{ color: 'var(--accent-text)' }} />
          </div>
          <p className="text-sm font-black mb-1" style={{ color: 'var(--text-primary)' }}>
            {myOrders.length === 0 ? 'No orders yet' : 'No orders match filter'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {myOrders.length === 0
              ? 'Orders placed at your store will appear here'
              : 'Try a different status filter'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onConfirm={() => handleConfirm(order.id)}
                onComplete={() => handleComplete(order.id)}
                onCancel={() => handleCancel(order.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
