'use client';

import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft, Store, CreditCard, Activity, Package, FileText, User,
  CheckCircle2, AlertCircle, Clock, Wallet, MapPin, Globe, ShoppingBag,
  TrendingUp, RefreshCw, ExternalLink, Phone, Mail, Hash, Calendar,
  Truck, Star, Tag,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import adminApiClient from '@/lib/adminApiClient';
import { formatCurrency } from '@/utils/formatCurrency';

type Transaction = {
  id: string; reference: string; amount: number; type: string;
  category: string; status: string; createdAt: string;
  senderId?: string; recipientId?: string;
};
type Product = {
  id: string; name: string; price: number; description?: string;
  category?: string; stock: number; isActive: boolean; images?: any[];
};
type Order = {
  id: string; totalAmount: number; status: string; paymentStatus: string;
  createdAt: string; customerName?: string; items: any[];
};

const tabs = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'store', label: 'Store', icon: Store },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'transactions', label: 'Transactions', icon: Activity },
  { id: 'payments', label: 'Payments', icon: Wallet },
];

function StatusBadge({ status }: { status: string }) {
  const lower = status?.toLowerCase();
  let bg = 'rgba(156,163,175,0.15)', color = '#9ca3af', Icon = Clock;
  if (['success','completed','active','verified','approved','paid','delivered'].includes(lower)) {
    bg = 'rgba(52,211,153,0.12)'; color = '#34d399'; Icon = CheckCircle2;
  } else if (['pending','processing','in_review','preparing','in_transit'].includes(lower)) {
    bg = 'rgba(251,191,36,0.12)'; color = '#fbbf24'; Icon = Clock;
  } else if (['failed','rejected','inactive','suspended','cancelled','refunded'].includes(lower)) {
    bg = 'rgba(248,113,113,0.12)'; color = '#f87171'; Icon = AlertCircle;
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: bg, color }}>
      <Icon size={11} />
      {status || 'Unknown'}
    </span>
  );
}

function InfoRow({ label, value, mono = false, highlight = false }: { label: string; value: any; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ad-muted-soft)' }}>{label}</p>
      <p
        className={`text-sm font-semibold text-right max-w-[60%] break-all ${mono ? 'font-mono' : ''}`}
        style={{ color: highlight ? '#6fe8d6' : 'var(--ad-fg-strong)' }}
      >
        {value ?? '—'}
      </p>
    </div>
  );
}

export default function AdminMerchantDetailPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [merchant, setMerchant] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [merchantTransactions, setMerchantTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<any>({});
  const [activeTab, setActiveTab] = useState('overview');
  const { showError, showSuccess } = useToast();
  const [, navigate] = useLocation();

  const [location] = useLocation();
  const segments = location.split('/');
  const merchantUserId = segments[segments.length - 1];

  useEffect(() => {
    if (merchantUserId) loadMerchantDetails();
  }, [merchantUserId]);

  const loadMerchantDetails = async () => {
    try {
      setLoading(true);
      const data = await adminApiClient.getMerchantDetail(merchantUserId);
      const userData = data?.data?.user || data?.data;
      setUser(userData);
      const profile = userData?.merchantProfile;
      setMerchant(profile ? { ...profile, merchantId: profile.id } : null);
      setAllTransactions(data?.data?.transactions || []);
      setMerchantTransactions(data?.data?.merchantTransactions || []);
      setRevenueSummary(data?.data?.revenueSummary || {});
      if (userData?.merchantProfile?.store) {
        setProducts(userData.merchantProfile.store.products || []);
        setOrders(userData.merchantProfile.store.orders || []);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load merchant details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await adminApiClient.verifyMerchant(merchantUserId);
      showSuccess('Merchant verified successfully');
      await loadMerchantDetails();
    } catch (e: any) {
      showError(e.message || 'Failed to verify merchant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      await adminApiClient.toggleUserActive(merchantUserId, !user?.isActive);
      showSuccess(`Merchant ${user?.isActive ? 'suspended' : 'activated'} successfully`);
      await loadMerchantDetails();
    } catch (e: any) {
      showError(e.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-sm font-medium" style={{ color: 'var(--ad-muted)' }}>Loading merchant details…</p>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Store className="h-16 w-16 mb-4" style={{ color: 'var(--ad-muted)' }} />
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--ad-fg-strong)' }}>Merchant Not Found</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--ad-muted)' }}>This merchant profile doesn't exist or has been removed.</p>
        <button onClick={() => window.history.back()} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>Go Back</button>
      </div>
    );
  }

  const store = merchant?.store;
  const merchantWalletBalance = merchant?.wallet?.balance ?? 0;
  const personalWalletBalance = user?.wallet?.balance ?? 0;
  const totalRevenue = revenueSummary?.totalRevenue ?? merchantTransactions.filter(tx => tx.status === 'success').reduce((s, tx) => s + Number(tx.amount), 0);
  const successfulOrders = orders.filter(o => o.paymentStatus === 'paid' || o.status === 'delivered' || o.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center h-10 w-10 rounded-xl flex-shrink-0 transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)' }}
        >
          <ArrowLeft size={18} style={{ color: 'var(--ad-fg-strong)' }} />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black" style={{ color: 'var(--ad-fg-strong)' }}>
              {merchant.tradingName || merchant.businessName || `${user?.firstName} ${user?.lastName}`}
            </h1>
            <StatusBadge status={merchant.verified ? 'Verified' : 'Pending'} />
            <StatusBadge status={user?.isActive ? 'Active' : 'Suspended'} />
          </div>
          <p className="text-sm mt-1 flex items-center gap-3 flex-wrap" style={{ color: 'var(--ad-muted)' }}>
            {merchant.merchantAccountNumber && (
              <span className="flex items-center gap-1 font-mono font-bold" style={{ color: '#6fe8d6' }}>
                <Hash size={12} />{merchant.merchantAccountNumber}
              </span>
            )}
            {merchant.merchantId && (
              <span className="flex items-center gap-1 font-mono text-xs" style={{ color: 'var(--ad-muted)' }}>
                ID: {merchant.merchantId}
              </span>
            )}
            <span className="flex items-center gap-1"><User size={12} />{user?.firstName} {user?.lastName}</span>
            <span className="flex items-center gap-1"><Mail size={12} />{user?.email}</span>
            {user?.phone && <span className="flex items-center gap-1"><Phone size={12} />{user.phone}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!merchant.verified && (
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
            >
              <CheckCircle2 size={14} /> Approve Merchant
            </button>
          )}
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{
              background: user?.isActive ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
              color: user?.isActive ? '#f87171' : '#34d399',
              border: `1px solid ${user?.isActive ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
            }}
          >
            {user?.isActive ? 'Suspend' : 'Activate'}
          </button>
          <button
            onClick={() => navigate('/admin/users/' + merchantUserId)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}
          >
            <User size={14} /> User View
          </button>
          <button
            onClick={loadMerchantDetails}
            className="flex items-center justify-center h-9 w-9 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)', color: 'var(--ad-muted)' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Merchant Wallet', value: formatCurrency(merchantWalletBalance), icon: Wallet, color: '#6fe8d6' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, color: '#34d399' },
          { label: 'Merchant Transactions', value: merchantTransactions.length, icon: Activity, color: '#60a5fa' },
          { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: '#fbbf24' },
          { label: 'Products Listed', value: products.length, icon: Package, color: '#a78bfa' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold" style={{ color: 'var(--ad-muted)' }}>{kpi.label}</p>
                <Icon size={16} style={{ color: kpi.color }} />
              </div>
              <p className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: 'var(--ad-border)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all whitespace-nowrap relative flex-shrink-0"
              style={{
                color: activeTab === tab.id ? '#6fe8d6' : 'var(--ad-muted)',
                borderBottom: activeTab === tab.id ? '2px solid #6fe8d6' : '2px solid transparent',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Info */}
          <div className="rounded-xl p-6 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ad-fg-strong)' }}>
              <Store size={18} style={{ color: '#6fe8d6' }} /> Business Information
            </h3>
            <InfoRow label="Business Name" value={merchant.businessName} />
            <InfoRow label="Trading Name" value={merchant.tradingName} />
            <InfoRow
              label="Merchant Account Number"
              value={merchant.merchantAccountNumber || 'Not assigned yet'}
              mono
              highlight
            />
            <InfoRow label="Personal Account Number" value={user?.accountNumber} mono />
            <InfoRow label="Merchant ID" value={merchant.merchantId || merchant.id} mono />
            <InfoRow label="Business Type" value={merchant.businessType} />
            <InfoRow label="Category" value={merchant.category} />
            <InfoRow label="Verification" value={merchant.verified ? '✅ Verified' : '⏳ Pending'} />
            <InfoRow label="Registered" value={merchant.createdAt ? new Date(merchant.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
          </div>

          {/* Wallets */}
          <div className="space-y-4">
            <div className="rounded-xl p-6 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
              <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ad-fg-strong)' }}>
                <Wallet size={18} style={{ color: '#6fe8d6' }} /> Merchant Wallet
              </h3>
              {merchant.wallet ? (
                <>
                  <div className="rounded-xl p-4 mb-3 text-center" style={{ background: 'rgba(111,232,214,0.06)', border: '1px solid rgba(111,232,214,0.15)' }}>
                    <p className="text-3xl font-black" style={{ color: '#6fe8d6' }}>{formatCurrency(merchantWalletBalance)}</p>
                    <p className="text-xs mt-1 font-bold" style={{ color: 'var(--ad-muted)' }}>Merchant Wallet Balance</p>
                  </div>
                  <InfoRow label="Currency" value={merchant.wallet?.currency || 'NGN'} />
                  <InfoRow label="Status" value={merchant.wallet?.isLocked ? '🔒 Locked' : '✅ Active'} />
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--ad-muted)' }}>No merchant wallet</p>
              )}
            </div>
            <div className="rounded-xl p-4 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--ad-muted)' }}>Personal Wallet (Owner)</p>
              <p className="text-xl font-black" style={{ color: '#60a5fa' }}>{formatCurrency(personalWalletBalance)}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--ad-muted)' }}>{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Store */}
      {activeTab === 'store' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {store ? (
            <>
              <div className="rounded-xl p-6 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
                <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ad-fg-strong)' }}>
                  <Store size={18} style={{ color: '#6fe8d6' }} /> Store Details
                </h3>
                <InfoRow label="Store Name" value={store.name} highlight />
                <InfoRow label="Slug / URL" value={store.slug} mono />
                <InfoRow label="Status" value={store.isPublished ? '✅ Published' : '❌ Unpublished'} />
                <InfoRow label="Total Products" value={store._count?.products ?? products.length} />
                <InfoRow label="Total Orders" value={store._count?.orders ?? orders.length} />
                {store.description && <InfoRow label="Description" value={store.description} />}
                {store.deliveryOptions && <InfoRow label="Delivery Options" value={Array.isArray(store.deliveryOptions) ? store.deliveryOptions.join(', ') : store.deliveryOptions} />}
              </div>
              <div className="rounded-xl p-6 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
                <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ad-fg-strong)' }}>
                  <TrendingUp size={18} style={{ color: '#6fe8d6' }} /> Store Performance
                </h3>
                <InfoRow label="Successful Orders" value={successfulOrders.length} />
                <InfoRow label="Total Revenue" value={formatCurrency(totalRevenue)} highlight />
                <InfoRow label="Avg. Order Value" value={orders.length > 0 ? formatCurrency(orders.reduce((s, o) => s + Number(o.totalAmount), 0) / orders.length) : '—'} />
                <InfoRow label="Active Products" value={products.filter(p => p.isActive).length} />
              </div>
            </>
          ) : (
            <div className="lg:col-span-2 text-center py-20" style={{ color: 'var(--ad-muted)' }}>
              <Store className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-bold mb-2">No Store Created</p>
              <p className="text-sm">This merchant has not set up a store yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Products */}
      {activeTab === 'products' && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
          <div className="p-5 border-b" style={{ borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black" style={{ color: 'var(--ad-fg-strong)' }}>Products</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--ad-muted)' }}>{products.length} products listed · {products.filter(p => p.isActive).length} active</p>
          </div>
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <tr>
                    {['Product', 'Category', 'Price', 'Stock', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--ad-muted-soft)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt={p.name} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(111,232,214,0.08)', border: '1px solid rgba(111,232,214,0.15)' }}>
                              <Package size={16} style={{ color: '#6fe8d6' }} />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--ad-fg-strong)' }}>{p.name}</p>
                            {p.description && <p className="text-xs mt-0.5 truncate max-w-[200px]" style={{ color: 'var(--ad-muted)' }}>{p.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ad-muted)' }}>
                          {p.category || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-black text-sm" style={{ color: '#6fe8d6' }}>{formatCurrency(p.price)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="text-sm font-bold"
                          style={{ color: p.stock > 0 ? 'var(--ad-fg-strong)' : '#f87171' }}
                        >
                          {p.stock} {p.stock === 0 ? '(out of stock)' : 'units'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={p.isActive ? 'Active' : 'Inactive'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16" style={{ color: 'var(--ad-muted)' }}>
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No products yet</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
          <div className="p-5 border-b" style={{ borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black" style={{ color: 'var(--ad-fg-strong)' }}>Orders</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--ad-muted)' }}>{orders.length} total orders · {successfulOrders.length} completed</p>
          </div>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <tr>
                    {['Order', 'Items', 'Total', 'Payment', 'Status', 'Date'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--ad-muted-soft)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold" style={{ color: '#6fe8d6' }}>{o.id.substring(0, 12)}…</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium" style={{ color: 'var(--ad-fg-strong)' }}>
                          {o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        {o.items?.slice(0, 2).map((item: any, i: number) => (
                          <p key={i} className="text-xs" style={{ color: 'var(--ad-muted)' }}>{item.product?.name || item.productId}</p>
                        ))}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-black text-sm" style={{ color: '#6fe8d6' }}>{formatCurrency(o.totalAmount)}</span>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={o.paymentStatus} /></td>
                      <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                      <td className="px-5 py-4 text-xs" style={{ color: 'var(--ad-muted)' }}>
                        {new Date(o.createdAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16" style={{ color: 'var(--ad-muted)' }}>
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No orders yet</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Merchant Transactions */}
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
            <div className="p-5 border-b" style={{ borderColor: 'var(--ad-border)' }}>
              <h3 className="text-base font-black" style={{ color: 'var(--ad-fg-strong)' }}>Merchant Transactions</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--ad-muted)' }}>QR payments & store orders received — {merchantTransactions.length} total</p>
            </div>
            {merchantTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <tr>
                      {['Reference', 'Type', 'Amount', 'Status', 'Date'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--ad-muted-soft)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {merchantTransactions.map((tx) => (
                      <tr key={tx.id} className="border-t hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <td className="px-5 py-3.5"><span className="font-mono text-xs font-bold" style={{ color: '#6fe8d6' }}>{tx.reference || tx.id.substring(0, 12)}</span></td>
                        <td className="px-5 py-3.5"><span className="text-xs font-bold capitalize px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ad-muted)' }}>{tx.type?.replace('_', ' ')}</span></td>
                        <td className="px-5 py-3.5"><span className="text-sm font-black" style={{ color: '#34d399' }}>+{formatCurrency(tx.amount)}</span></td>
                        <td className="px-5 py-3.5"><StatusBadge status={tx.status} /></td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--ad-muted)' }}>{new Date(tx.createdAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12" style={{ color: 'var(--ad-muted)' }}>
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold">No merchant transactions yet</p>
              </div>
            )}
          </div>

          {/* All Transactions */}
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
            <div className="p-5 border-b" style={{ borderColor: 'var(--ad-border)' }}>
              <h3 className="text-base font-black" style={{ color: 'var(--ad-fg-strong)' }}>All Account Transactions</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--ad-muted)' }}>All transactions on this user's account — {allTransactions.length} total</p>
            </div>
            {allTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <tr>
                      {['Reference', 'Type', 'Amount', 'Status', 'Date'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--ad-muted-soft)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allTransactions.map((tx) => (
                      <tr key={tx.id} className="border-t hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <td className="px-5 py-3.5"><span className="font-mono text-xs font-bold" style={{ color: '#6fe8d6' }}>{tx.reference || tx.id.substring(0, 12)}</span></td>
                        <td className="px-5 py-3.5"><span className="text-xs font-bold capitalize px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ad-muted)' }}>{tx.type?.replace('_', ' ')}</span></td>
                        <td className="px-5 py-3.5"><span className={`text-sm font-black`} style={{ color: tx.senderId === user?.id ? '#f87171' : '#34d399' }}>{tx.senderId === user?.id ? '-' : '+'}{formatCurrency(tx.amount)}</span></td>
                        <td className="px-5 py-3.5"><StatusBadge status={tx.status} /></td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--ad-muted)' }}>{new Date(tx.createdAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12" style={{ color: 'var(--ad-muted)' }}>
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold">No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Payments / Settlements */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl p-6 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ad-fg-strong)' }}>
              <Wallet size={18} style={{ color: '#6fe8d6' }} /> Payment Summary
            </h3>
            <InfoRow label="Merchant Wallet Balance" value={formatCurrency(merchantWalletBalance)} highlight />
            <InfoRow label="Total Revenue (Success)" value={formatCurrency(totalRevenue)} highlight />
            <InfoRow label="Total Merchant Transactions" value={merchantTransactions.length} />
            <InfoRow label="Successful Transactions" value={merchantTransactions.filter(tx => tx.status === 'success').length} />
            <InfoRow label="Failed Transactions" value={merchantTransactions.filter(tx => tx.status === 'failed').length} />
            <InfoRow label="Total Orders" value={orders.length} />
            <InfoRow label="Paid Orders" value={orders.filter(o => o.paymentStatus === 'paid').length} />
            <InfoRow label="Avg. Transaction Value" value={merchantTransactions.length > 0 ? formatCurrency(merchantTransactions.reduce((s, tx) => s + Number(tx.amount), 0) / merchantTransactions.length) : '—'} />
          </div>
          <div className="rounded-xl p-6 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ad-fg-strong)' }}>
              <TrendingUp size={18} style={{ color: '#6fe8d6' }} /> Revenue Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { label: 'QR Payments', txs: merchantTransactions.filter(tx => tx.type === 'qr_payment') },
                { label: 'Store Orders', txs: merchantTransactions.filter(tx => tx.type === 'store_order') },
              ].map((cat) => (
                <div key={cat.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--ad-fg-strong)' }}>{cat.label}</p>
                    <p className="text-xs" style={{ color: 'var(--ad-muted)' }}>{cat.txs.length} transactions</p>
                  </div>
                  <p className="font-black" style={{ color: '#6fe8d6' }}>
                    {formatCurrency(cat.txs.filter(tx => tx.status === 'success').reduce((s, tx) => s + Number(tx.amount), 0))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
