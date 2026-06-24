import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { TrendingUp, Users, QrCode, Eye, EyeOff, ArrowRight, Calendar, Package, ShoppingBag, Globe, Clock, Plus, LogOut, User, ChevronRight } from 'lucide-react';
import { formatNGN, formatDate } from '@/utils/formatting';
import { useAuthStore } from '@/store/useAuthStore';
import { useMerchantStore } from '@/store/useMerchantStore';
import { useMerchantStoreData } from '@/store/useMerchantStoreData';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: "easeOut" as const },
});

export default function MerchantDashboard() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const [, navigate] = useLocation();
  const payments = useMerchantStore(s => s.payments);
  const settlements = useMerchantStore(s => s.settlements);
  const fetchPayments = useMerchantStore(s => s.fetchPayments);
  const fetchSettlements = useMerchantStore(s => s.fetchSettlements);
  const { stores, products, orders } = useMerchantStoreData();
  const [showRevenue, setShowRevenue] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoToPersonal = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchPayments(),
          fetchSettlements(),
        ]);
        if (user?.id) {
          await Promise.all([
            useMerchantStoreData.getState().fetchStore(user.id),
            useMerchantStoreData.getState().fetchProducts(user.id),
          ]);
        }
        if (user?.merchantProfile?.qrSlug) {
          await useMerchantStoreData.getState().fetchOrders(user.merchantProfile.qrSlug);
        }
      } catch {
        // Silently handle fetch errors - data will be empty
      }
    };

    loadData();
  }, [fetchPayments, fetchSettlements, user?.id, user?.merchantProfile?.qrSlug]);

  const merchantId = user?.id || '';
  const merchantSlug = user?.merchantProfile?.qrSlug || '';
  const storeInfo = stores[merchantId];
  const storeProducts = products[merchantId] || [];
  const myOrders = orders.filter(o => o.merchantSlug === merchantSlug);
  const pendingOrders = myOrders.filter(o => o.status === 'pending').length;

  const profile = user?.merchantProfile;
  const businessName = profile?.tradingName || profile?.businessName || user?.firstName || 'Merchant';
  const initials = businessName.slice(0, 2).toUpperCase();

  const stats = useMemo(() => {
    const successful = payments.filter(p => p.status === 'success');
    const totalRevenue = successful.reduce((s, p) => s + p.amount, 0);
    const uniqueCustomers = new Set(successful.map(p => p.customerName)).size;
    const pendingSettlement = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0);
    return {
      totalRevenue,
      totalTransactions: successful.length,
      activeCustomers: uniqueCustomers,
      pendingSettlement,
    };
  }, [payments, settlements]);

  const recentPayments = payments.slice(0, 5);

  return (
    <div className="space-y-5">

      {/* ── Revenue hero — always dark gradient, lime text is fine here ── */}
      <motion.div {...fadeUp(0)} className="relative overflow-hidden rounded-3xl p-6 lg:p-8"
        style={{
          background: 'linear-gradient(135deg,#081a18 0%,#0d2e2a 55%,#051210 100%)',
          border: '1px solid rgba(111,232,214,0.18)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}>
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(111,232,214,0.22) 0%,transparent 70%)' }} />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-36 w-36 rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(111,232,214,0.12) 0%,transparent 70%)' }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.7) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center text-sm font-black"
                style={{ background: '#6fe8d6', color: '#081a18' }}>{initials}</div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(111,232,214,0.55)' }}>
                  {profile?.category || 'Merchant Portal'}
                </p>
                <p className="text-sm font-black" style={{ color: '#ffffff' }}>{businessName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ background: 'rgba(111,232,214,0.1)', border: '1px solid rgba(111,232,214,0.2)' }}>
              <div className="h-1.5 w-1.5 rounded-full bg-[#6fe8d6] animate-pulse" />
              <span className="text-[9px] font-black tracking-widest" style={{ color: '#6fe8d6' }}>LIVE</span>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: 'rgba(111,232,214,0.5)' }}>
            Total Revenue
          </p>
          <div className="flex items-center gap-3 mb-1">
            <p className="text-4xl lg:text-5xl font-black tracking-tight" style={{ color: '#ffffff' }}>
              {showRevenue ? formatNGN(stats.totalRevenue) : '₦ ••••••'}
            </p>
            <button onClick={() => setShowRevenue(v => !v)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(111,232,214,0.5)', background: 'rgba(111,232,214,0.06)' }}>
              {showRevenue ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs mb-5" style={{ color: 'rgba(111,232,214,0.4)' }}>
            {stats.pendingSettlement > 0 ? `${formatNGN(stats.pendingSettlement)} pending settlement` : 'All settled'}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/merchant/qr"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all active:scale-95"
              style={{ background: '#6fe8d6', color: '#081a18', boxShadow: '0 2px 16px rgba(111,232,214,0.4)' }}>
              <QrCode size={13} /> View QR
            </Link>
            <Link href="/merchant/payments"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all active:scale-95"
              style={{ background: 'rgba(111,232,214,0.1)', border: '1px solid rgba(111,232,214,0.2)', color: '#6fe8d6' }}>
              Payments <ArrowRight size={12} />
            </Link>
            <Link href="/merchant/settlements"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)' }}>
              Settlements
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── KPI cards ── */}
      <motion.div {...fadeUp(0.08)} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Transactions',
            value: stats.totalTransactions.toString(),
            sub: 'Successful',
            icon: TrendingUp,
            iconBg: 'rgba(52,211,153,0.1)',
            iconColor: '#34d399',
          },
          {
            label: 'Customers',
            value: stats.activeCustomers.toString(),
            sub: 'Unique payers',
            icon: Users,
            iconBg: 'var(--accent-bg)',
            iconColor: 'var(--accent-text)',
          },
          {
            label: 'Pending',
            value: formatNGN(stats.pendingSettlement),
            sub: 'In settlement',
            icon: Calendar,
            iconBg: 'rgba(245,158,11,0.1)',
            iconColor: '#f59e0b',
          },
          {
            label: 'QR Payments',
            value: payments.filter(p => p.status === 'success').length.toString(),
            sub: 'Via scan',
            icon: QrCode,
            iconBg: 'var(--accent-bg)',
            iconColor: 'var(--accent-text)',
          },
        ].map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: iconBg }}>
                <Icon size={14} style={{ color: iconColor }} />
              </div>
            </div>
            <p className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Store & Orders quick access ── */}
      <motion.div {...fadeUp(0.12)} className="grid grid-cols-2 gap-3">
        <Link href="/merchant/store"
          className="rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all active:scale-95 hover:opacity-90"
          style={{
            background: storeInfo?.isPublished
              ? 'linear-gradient(135deg,#081a18 0%,#0d2e2a 100%)'
              : 'var(--card)',
            border: storeInfo?.isPublished
              ? '1px solid rgba(111,232,214,0.2)'
              : '1px solid var(--border)',
          }}>
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: storeInfo?.isPublished ? 'rgba(111,232,214,0.15)' : 'var(--surface-secondary)' }}>
              <Package size={16} style={{ color: storeInfo?.isPublished ? '#6fe8d6' : 'var(--text-tertiary)' }} />
            </div>
            {storeInfo?.isPublished && (
              <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
                style={{ background: 'rgba(52,211,153,0.12)' }}>
                <div className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse" />
                <span className="text-[9px] font-black" style={{ color: '#34d399' }}>LIVE</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-black" style={{ color: storeInfo?.isPublished ? '#fff' : 'var(--text-primary)' }}>
              My Store
            </p>
            <p className="text-xs mt-0.5" style={{ color: storeInfo?.isPublished ? 'rgba(111,232,214,0.55)' : 'var(--text-tertiary)' }}>
              {storeProducts.length > 0 ? `${storeProducts.length} products` : 'Set up your store'}
            </p>
          </div>
        </Link>

        <Link href="/merchant/orders"
          className="rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all active:scale-95 hover:opacity-90"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--surface-secondary)' }}>
              <ShoppingBag size={16} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            {pendingOrders > 0 && (
              <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black"
                style={{ background: '#f59e0b', color: '#1a1a1a' }}>
                {pendingOrders}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Orders</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {pendingOrders > 0 ? `${pendingOrders} need attention` : `${myOrders.length} total`}
            </p>
          </div>
        </Link>
      </motion.div>

      {/* ── Recent payments ── */}
      <motion.div {...fadeUp(0.16)}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Recent Payments</h2>
          <Link href="/merchant/payments" className="text-xs font-bold transition-colors hover:opacity-80"
            style={{ color: 'var(--accent-text)' }}>See all →</Link>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {recentPayments.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl flex items-center justify-center accent-icon-wrap">
                <QrCode size={20} style={{ color: 'var(--accent-text)' }} />
              </div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>No payments yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Share your QR code to start receiving payments.
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: p.status === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)',
                    }}>
                    <div className="h-2 w-2 rounded-full"
                      style={{ background: p.status === 'success' ? '#34d399' : '#f59e0b' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>{p.customerName}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{formatDate(new Date(p.createdAt))}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black" style={{ color: '#34d399' }}>+{formatNGN(p.amount)}</p>
                    <p className="text-[10px] font-bold capitalize" style={{ color: p.status === 'success' ? '#34d399' : '#f59e0b' }}>
                      {p.status === 'success' ? 'Completed' : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Account actions ── */}
      <motion.div {...fadeUp(0.2)} className="space-y-2">
        <button onClick={handleGoToPersonal}
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors hover:bg-[var(--surface-secondary)] w-full"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--surface-secondary)' }}>
            <User size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Personal Profile</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Back to personal account</p>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
        </button>
        <button onClick={handleLogout}
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors hover:bg-[var(--surface-secondary)] w-full"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.1)' }}>
            <LogOut size={16} style={{ color: '#EF4444' }} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-black" style={{ color: '#EF4444' }}>Sign out</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Log out of your account</p>
          </div>
        </button>
      </motion.div>
    </div>
  );
}
