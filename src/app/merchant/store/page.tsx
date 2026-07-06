import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  Store, Plus, Trash2, Package, RefreshCw, ExternalLink,
  ShoppingBag, Check, ArrowLeft, Sparkles, Copy
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useMerchantStoreData } from '@/store/useMerchantStoreData';
import toast from 'react-hot-toast';

const GRADIENTS = [
  'from-pink-500 to-rose-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-purple-500 to-violet-500',
];

export default function MerchantStorePage() {
  const user = useAuthStore(s => s.user);
  const {
    stores, products, orders, fetchStore, fetchProducts, fetchOrders,
    deleteProduct, updateOrderStatus, publishStore, unpublishStore,
  } = useMerchantStoreData();

  const merchantId = user?.id || '';
  const storeInfo = stores[merchantId];
  const storeProducts = products[merchantId] || [];
  const storeOrders = orders || [];

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings'>('products');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(!!storeInfo?.isPublished);
  const [storeSlug, setStoreSlug] = useState(storeInfo?.slug || user?.merchantProfile?.qrSlug || '');
  const [storeDesc, setStoreDesc] = useState(storeInfo?.description || '');

  const activeOrders = storeOrders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const completedOrders = storeOrders.filter(o => o.status === 'completed');

  useEffect(() => {
    if (merchantId) {
      fetchStore(merchantId);
      fetchProducts(merchantId);
      fetchOrders(storeSlug);
    }
  }, [merchantId, storeSlug]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchStore(merchantId),
      fetchProducts(merchantId),
      fetchOrders(storeSlug),
    ]);
    setIsRefreshing(false);
  };

  const handleTogglePublish = async () => {
    const next = !isPublished;
    setIsSaving(true);
    try {
      if (next) {
        await publishStore(merchantId);
        setIsPublished(true);
        toast.success('Store published live!');
      } else {
        await unpublishStore(merchantId);
        setIsPublished(false);
        toast.success('Store unpublished (draft mode)');
      }
      await handleRefresh();
    } catch {
      toast.error('Failed to update store visibility');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://badepay.com';
    const url = `${baseUrl}/store/${storeSlug}`;
    navigator.clipboard.writeText(url);
    toast.success('Store link copied to clipboard!');
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(merchantId, productId);
      toast.success('Product deleted');
      await handleRefresh();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'completed');
      toast.success('Order marked as delivered!');
      await handleRefresh();
    } catch {
      toast.error('Failed to update order');
    }
  };

  if (!user?.merchantProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Store size={48} style={{ color: 'var(--text-tertiary)' }} />
        <h2 className="text-xl font-black mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>Merchant Required</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Complete merchant onboarding to manage your store.
        </p>
        <Link href="/merchant/onboarding" className="rounded-xl px-5 py-2.5 text-sm font-black" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          Become a Merchant
        </Link>
      </div>
    );
  }

  const slug = storeSlug || user.merchantProfile.qrSlug || 'store';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://badepay.com';
  const storeUrl = `${baseUrl}/store/${slug}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/merchant" className="h-9 w-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
          <ArrowLeft size={16} style={{ color: 'var(--text-secondary)' }} />
        </Link>
        <div className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>BadePay Store</div>
        <div className="flex gap-2 items-center">
          <button onClick={handleRefresh} disabled={isRefreshing} className="h-9 px-3 rounded-full flex items-center gap-1 text-xs font-semibold disabled:opacity-50" style={{ background: 'rgba(111,232,214,0.1)', color: '#6fe8d6' }}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {isPublished ? (
            <a href={`/store/${slug}`} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-full flex items-center gap-1 text-xs font-semibold" style={{ background: 'rgba(111,232,214,0.1)', color: '#6fe8d6' }}>
              <span>Live Store</span>
              <ExternalLink size={12} />
            </a>
          ) : (
            <button onClick={handleTogglePublish} disabled={isSaving} className="h-9 px-3 rounded-full text-xs font-semibold disabled:opacity-50" style={{ background: 'var(--muted)', color: 'var(--text-tertiary)' }}>
              Publish Store
            </button>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {(['products', 'orders', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 pb-3 text-center text-sm font-semibold capitalize transition-all border-b-2 ${
            activeTab === tab ? 'border-[#6fe8d6] text-[#6fe8d6]' : 'border-transparent text-[var(--text-secondary)]'
          }`}>
            {tab === 'products' && `Products (${storeProducts.length})`}
            {tab === 'orders' && `Orders (${activeOrders.length})`}
            {tab === 'settings' && 'Settings'}
          </button>
        ))}
      </div>

      {/* Products tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-tertiary)' }}>Catalog</span>
            <button className="h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
              <Plus size={14} /> Add Product
            </button>
          </div>

          {storeProducts.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <Package size={40} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
              <p className="text-sm font-semibold mt-3" style={{ color: 'var(--text-primary)' }}>No products added yet</p>
              <p className="text-xs mt-1 max-w-[220px] mx-auto" style={{ color: 'var(--text-secondary)' }}>
                List items for your customers to purchase directly inside BadePay.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {storeProducts.map(p => {
                const outOfStock = p.stock === 0;
                return (
                  <div key={p.id} className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div className="h-28 relative" style={{ background: 'var(--surface-secondary)' }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${GRADIENTS[0]}`}>
                          📦
                        </div>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur flex items-center justify-center">
                          <span className="text-xs font-bold tracking-widest text-white uppercase border border-white/40 px-2 py-0.5 rounded">
                            Out of stock
                          </span>
                        </div>
                      )}
                      {p.stock > 0 && p.stock <= 5 && (
                        <div className="absolute top-2 left-2 bg-[#FF8C00] text-white font-bold text-xs uppercase tracking-wider px-1.5 py-0.5 rounded shadow">
                          Only {p.stock} left
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs uppercase font-bold" style={{ color: '#6fe8d6' }}>{p.category}</div>
                        <div className="text-sm font-semibold mt-0.5 line-clamp-1" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
                        <div className="text-xs font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                          ₦ {p.price.toLocaleString()}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-2 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
                        <span>Stock: {p.stock}</span>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-1" style={{ color: 'var(--text-secondary)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Orders tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <span className="text-xs uppercase tracking-widest font-semibold block" style={{ color: 'var(--text-tertiary)' }}>Active Orders</span>

          {activeOrders.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <ShoppingBag size={40} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
              <p className="text-sm font-semibold mt-3" style={{ color: 'var(--text-primary)' }}>No pending orders</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Once customers buy products from your storefront, they will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {activeOrders.map(o => (
                <div key={o.id} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div className="text-xs font-semibold">{o.customerName}</div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{o.customerPhone}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 font-semibold rounded-full uppercase" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                      {o.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {o.items?.map((it: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span>{it.name} <span style={{ color: 'var(--text-primary)' }}>x{it.quantity}</span></span>
                        <span>₦{(it.price * it.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
                    <div>
                      <div className="text-xs uppercase font-semibold" style={{ color: 'var(--text-tertiary)' }}>Total Amount</div>
                      <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                        ₦ {o.totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <button onClick={() => handleCompleteOrder(o.id)} className="h-8.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                      <Check size={14} /> Mark Delivered
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {completedOrders.length > 0 && (
            <div className="mt-8 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-xs uppercase tracking-widest font-semibold block mb-3" style={{ color: 'var(--text-tertiary)' }}>Completed Orders</span>
              <div className="space-y-2">
                {completedOrders.map(o => (
                  <div key={o.id} className="rounded-xl px-3.5 py-2 flex items-center justify-between opacity-75" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div>
                      <div className="text-xs font-semibold">{o.customerName}</div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{o.items?.length || 0} items</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>₦{o.totalAmount.toLocaleString()}</div>
                      <span className="text-xs font-bold uppercase" style={{ color: 'var(--text-tertiary)' }}>Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(111,232,214,0.05)', border: '1px solid rgba(111,232,214,0.15)' }}>
            <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#6fe8d6' }}>
              <Sparkles size={16} /> Live storefront link
            </div>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Share this link with customers to let them shop your store, build orders, and pay with their Bade Pay wallets or linked bank accounts.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
              <span className="text-xs font-mono truncate flex-1" style={{ color: 'var(--text-tertiary)' }}>{storeUrl}</span>
              <button onClick={handleCopyLink} className="p-1.5 rounded-lg" style={{ color: '#6fe8d6' }}>
                <Copy size={14} />
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Store Description</div>
            <textarea value={storeDesc} onChange={e => setStoreDesc(e.target.value)} rows={3} placeholder="Describe your store..." className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            <button onClick={() => toast.success('Settings saved!')} className="w-full mt-3 rounded-xl py-2.5 text-sm font-black" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
