import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Search, Plus, Minus, X, CheckCircle2, ArrowLeft,
  Store, Package, Star, Wallet, Shield, ChevronRight, Loader2, CreditCard, Truck
} from 'lucide-react';
import { merchantService } from '@/services/merchantService';
import { MerchantMark } from '@/components/merchant/MerchantBrand';
import { useAuthStore } from '@/store/useAuthStore';
import apiClient from '@/lib/apiClient';
import { formatNGN } from '@/utils/formatting';
import toast from 'react-hot-toast';

interface Variation { id: string; name: string; value: string; priceAdjust: number; stock: number }
/** A store product as the public API returns it, with numbers parsed (prices come back as decimal strings). */
interface Product {
  id: string; name: string; description: string; category: string; type: string; deliveryInfo?: string | null;
  price: number; discount: number; stock: number; imageUrl?: string; images: string[]; variations: Variation[];
}
interface CartLine { key: string; product: Product; variation?: Variation; quantity: number }

/** Only physical goods have stock; services can't sell out (same rule as the backend). */
const UNLIMITED = Number.POSITIVE_INFINITY;

function toProduct(p: any): Product {
  const unlimited = (p.type ?? 'physical') !== 'physical';
  const images = [...(p.images ?? [])].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)).map((i: any) => i.imageUrl).filter(Boolean);
  return {
    id: p.id, name: p.name, description: p.description ?? '', category: p.category ?? 'Other', type: p.type ?? 'physical',
    deliveryInfo: p.deliveryInfo, price: Number(p.price) || 0, discount: Number(p.discount) || 0, stock: unlimited ? UNLIMITED : Number(p.stock) || 0,
    images, imageUrl: images[0] ?? p.imageUrl,
    variations: (p.variations ?? []).map((v: any) => ({ id: v.id, name: v.name, value: v.value, priceAdjust: Number(v.priceAdjust) || 0, stock: unlimited ? UNLIMITED : Number(v.stock) || 0 })),
  };
}
const inStock = (p: Product) => p.variations.length ? p.variations.some(v => v.stock > 0) : p.stock > 0;
/** Same as the backend: discount on the base price, plus the option's price adjustment. */
const unitPrice = (p: Product, v?: Variation) => p.price * (1 - p.discount / 100) + (v?.priceAdjust ?? 0);
const lineKey = (p: Product, v?: Variation) => (v ? `${p.id}:${v.id}` : p.id);

type CheckoutStep = 'browse' | 'cart' | 'details' | 'payment' | 'pin' | 'success';

function PinPad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
      {digits.map((d, i) => (
        <button key={i} disabled={!d}
          onClick={() => {
            if (d === '⌫') onChange(value.slice(0, -1));
            else if (value.length < 4) onChange(value + d);
          }}
          className="h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all active:scale-95 disabled:invisible"
          style={{
            background: d ? 'var(--card)' : 'transparent',
            border: d ? '1px solid var(--border)' : 'none',
            color: 'var(--text-primary)',
          }}>
          {d}
        </button>
      ))}
    </div>
  );
}

interface CustomerStoreProps {
  slug: string;
}

export default function CustomerStore({ slug }: CustomerStoreProps) {
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [loadingStore, setLoadingStore] = useState(true);
  const [, navigate] = useLocation();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    let cancelled = false;
    const loadStoreData = async () => {
      setLoadingStore(true);
      try {
        const [storeRes, productsRes] = await Promise.all([
          merchantService.getPublicStore(slug),
          merchantService.getPublicStoreProducts(slug),
        ]);

        if (cancelled) return;

        let storeResult = null;
        if (storeRes) {
          if ('store' in storeRes) storeResult = storeRes.store;
          else if ('data' in storeRes && 'store' in storeRes.data) storeResult = storeRes.data.store;
          else storeResult = storeRes;
        }
        setStoreInfo(storeResult);

        let productsList: any[] = [];
        if (productsRes) {
          if (Array.isArray(productsRes)) productsList = productsRes;
          else if ('products' in productsRes) productsList = productsRes.products;
          else if ('data' in productsRes && 'products' in productsRes.data) productsList = productsRes.data.products;
        }
        const list = productsList.map(toProduct).filter(inStock);
        setStoreProducts(list);
        // Opened from the marketplace: /store/:slug?product=<id> shows that product straight away.
        const wanted = new URLSearchParams(window.location.search).get('product');
        if (wanted) setViewing(list.find(p => p.id === wanted) ?? null);
      } catch (err) {
        console.error('Failed to load store:', err);
      } finally {
        if (!cancelled) setLoadingStore(false);
      }
    };
    loadStoreData();
    return () => { cancelled = true; };
  }, [slug]);

  const isLive = storeInfo?.isPublished !== false;

  const [step, setStep] = useState<CheckoutStep>('browse');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [filterCat, setFilterCat] = useState('All');
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [delivery, setDelivery] = useState(true);
  const [address1, setAddress1] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ id: string; reference: string; total: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    setCustomerName(n => n || [user.firstName, user.lastName].filter(Boolean).join(' '));
    setCustomerPhone(n => n || user.phone || '');
  }, [user]);

  const categories = ['All', ...Array.from(new Set(storeProducts.map(p => p.category)))];
  const detailsProblem =
    customerName.trim().length < 2 ? 'Enter your name'
    : customerPhone.replace(/\D/g, '').length < 10 ? 'Enter a phone number'
    : delivery && (address1.trim().length < 5 || city.trim().length < 2 || region.trim().length < 2) ? 'Enter your delivery address'
    : '';

  const filtered = storeProducts.filter(p => {
    const matchCat = filterCat === 'All' || p.category === filterCat;
    const matchQ = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const cartTotal = cart.reduce((s, i) => s + unitPrice(i.product, i.variation) * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const stockFor = (p: Product, v?: Variation) => (v ? v.stock : p.stock);

  const addToCart = (p: Product, v?: Variation, qty = 1) => {
    const key = lineKey(p, v);
    const have = cart.find(i => i.key === key)?.quantity ?? 0;
    if (have + qty > stockFor(p, v)) { toast.error(`Only ${stockFor(p, v)} left in stock`); return; }
    setCart(prev => prev.some(i => i.key === key)
      ? prev.map(i => i.key === key ? { ...i, quantity: i.quantity + qty } : i)
      : [...prev, { key, product: p, variation: v, quantity: qty }]);
    toast.success(`${p.name} added to cart`);
  };

  const removeFromCart = (key: string) => setCart(prev => prev.filter(i => i.key !== key));

  const updateQty = (key: string, qty: number) => {
    if (qty <= 0) { removeFromCart(key); return; }
    const line = cart.find(i => i.key === key);
    if (line && qty > stockFor(line.product, line.variation)) { toast.error(`Only ${stockFor(line.product, line.variation)} left in stock`); return; }
    setCart(prev => prev.map(i => i.key === key ? { ...i, quantity: qty } : i));
  };

  const goToDetails = () => {
    if (!isAuthenticated) {
      toast('Log in to your BadePay account to check out');
      navigate(`/login?next=${encodeURIComponent(`/store/${slug}`)}`);
      return;
    }
    setStep('details');
  };

  /** POST /stores/:slug/orders (login required). Wallet pays now with the PIN; card goes to the hosted checkout. */
  const handlePay = async () => {
    if (paymentMethod === 'wallet' && pin.length !== 4) { toast.error('Enter your 4-digit PIN'); return; }
    setLoading(true);
    try {
      const body = {
        customerName: customerName.trim(),
        customerEmail: user?.email,
        customerPhone: customerPhone.replace(/^\+234/, '0').replace(/\s/g, ''),
        paymentMethod,
        channel: 'web',
        ...(paymentMethod === 'wallet' ? { pin } : {}),
        items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity, variationId: i.variation?.id })),
        shippingAddress: delivery ? {
          recipientName: customerName.trim(), addressLine1: address1.trim(), city: city.trim(), state: region.trim(),
          country: 'Nigeria', phone: customerPhone,
        } : undefined,
      };
      const res = await apiClient.postIdempotent(`/stores/${slug}/orders`, body, crypto.randomUUID());
      const order = res?.data?.order;
      const payment = res?.data?.payment;
      if (!order) throw new Error(res?.message || 'Could not place the order');
      if (paymentMethod === 'card') {
        const url = payment?.authorizationUrl ?? payment?.redirectLink ?? payment?.checkoutUrl;
        if (!url) throw new Error('Card checkout could not start. Your order is saved in My orders.');
        window.location.href = url;
        return;
      }
      setCompletedOrder({ id: order.id, reference: order.reference, total: Number(order.totalAmount ?? cartTotal) });
      setStep('success');
    } catch (err: any) {
      setPin('');
      toast.error(err?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const storeName = storeInfo?.name || 'Store';
  const storeDesc = storeInfo?.description || '';
  const bannerUrl = storeInfo?.bannerUrl || '';
  const logoUrl = storeInfo?.logoUrl || undefined;

  if (loadingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6fe8d6] border-t-transparent" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading Store…</p>
        </div>
      </div>
    );
  }

  if (!isLive && !storeInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--background)' }}>
        <div className="text-center px-6 py-12">
          <div className="mx-auto h-20 w-20 rounded-3xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(111,232,214,0.1)', border: '1px solid rgba(111,232,214,0.2)' }}>
            <Store size={32} style={{ color: 'var(--accent-text)' }} />
          </div>
          <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Store not found</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This store doesn't exist or isn't live yet.
          </p>
        </div>
      </div>
    );
  }

  /* ── Success screen ── */
  if (step === 'success') return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--background)' }}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-full max-w-sm text-center space-y-5">
        <div className="mx-auto h-24 w-24 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(52,211,153,0.15)', border: '2px solid #34d399' }}>
          <CheckCircle2 size={44} style={{ color: 'var(--success-text)' }} />
        </div>
        <div>
          <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Order paid</h2>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            {storeName} has your order. Track it in My orders.
          </p>
        </div>
        <div className="rounded-2xl p-4 text-left space-y-2"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex justify-between">
            <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>Reference</span>
            <span className="text-xs font-black font-mono" style={{ color: 'var(--text-primary)' }}>{completedOrder?.reference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>Amount Paid</span>
            <span className="text-xs font-black" style={{ color: 'var(--success-text)' }}>{formatNGN(completedOrder?.total ?? cartTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>Store</span>
            <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{storeName}</span>
          </div>
        </div>
        {completedOrder && (
          <button onClick={() => navigate(`/orders/${completedOrder.id}`)}
            className="w-full rounded-2xl py-3.5 text-sm font-black transition-all active:scale-95"
            style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
            View order
          </button>
        )}
        <button onClick={() => { setCart([]); setStep('browse'); setPin(''); setCompletedOrder(null); }}
          className="w-full rounded-2xl py-3.5 text-sm font-black transition-all active:scale-95"
          style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          Shop again
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* ── Store header: the store's own brand (banner, logo, name) ── */}
      <header>
        <div className="h-36 sm:h-44 overflow-hidden" style={{ background: '#0b2724' }}>
          {bannerUrl && <img src={bannerUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex gap-4 px-4 pb-3">
          <div className="-mt-9 shrink-0 rounded-2xl" style={{ border: '3px solid var(--background)', background: 'var(--background)' }}>
            <MerchantMark name={storeName} logoUrl={logoUrl} size={72} />
          </div>
          <div className="min-w-0 flex-1 pt-3">
            <h1 className="truncate text-xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{storeName}</h1>
            {storeDesc && <p className="mt-0.5 line-clamp-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{storeDesc}</p>}
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {storeProducts.length} {storeProducts.length === 1 ? 'item' : 'items'} · Pay securely with BadePay
            </p>
          </div>
        </div>
      </header>

      {/* ── Browse / Cart / Checkout nav ── */}
      <div className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
        {step !== 'browse' && (
          <button onClick={() => setStep(step === 'cart' ? 'browse' : step === 'details' ? 'cart' : step === 'payment' ? 'details' : step === 'pin' ? 'payment' : 'browse')}
            className="h-8 w-8 flex items-center justify-center rounded-xl flex-shrink-0 transition-all active:scale-95"
            style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={15} />
          </button>
        )}
        {step === 'browse' && (
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <Search size={13} style={{ color: 'var(--text-tertiary)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products…" className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }} />
          </div>
        )}
        {step !== 'browse' && (
          <div className="flex-1">
            <h2 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
              {step === 'cart' ? 'My Cart' : step === 'details' ? 'Your Details' : step === 'payment' ? 'Payment Method' : 'Enter PIN'}
            </h2>
          </div>
        )}
        {/* Cart button */}
        {cartCount > 0 && step === 'browse' && (
          <button onClick={() => setStep('cart')}
            className="relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition-all active:scale-95"
            style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
            <ShoppingCart size={14} />
            <span>{formatNGN(cartTotal, { compact: true })}</span>
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-black"
              style={{ background: '#1a1a1a', color: '#6fe8d6' }}>{cartCount}</span>
          </button>
        )}
      </div>

      <div className="px-4 pb-24">

        {/* ── BROWSE step ── */}
        <AnimatePresence mode="wait">
          {step === 'browse' && (
            <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
                {categories.map(c => (
                  <button key={c} onClick={() => setFilterCat(c)}
                    className="rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                    style={{
                      background: filterCat === c ? '#6fe8d6' : 'var(--card)',
                      color: filterCat === c ? '#1a1a1a' : 'var(--text-secondary)',
                      border: filterCat === c ? 'none' : '1px solid var(--border)',
                    }}>{c}</button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Package size={32} className="mx-auto mb-3 opacity-25" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>No products available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map((p, i) => {
                    const discPrice = unitPrice(p);
                    const inCart = p.variations.length ? undefined : cart.find(c => c.key === p.id);
                    const isLowStock = p.stock > 0 && p.stock <= 3;
                    return (
                      <motion.div key={p.id}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="rounded-2xl overflow-hidden group cursor-pointer"
                        style={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                        }}
                        whileHover={{ y: -2 }}>
                        <div className="relative h-44 overflow-hidden" onClick={() => setViewing(p)}
                          style={{ background: 'var(--surface-secondary)' }}>
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            : <div className="h-full w-full flex items-center justify-center">
                                <Package size={28} style={{ color: 'var(--text-tertiary)' }} />
                              </div>
                          }
                          {/* Shade behind the category tag only when there's a photo */}
                          {p.imageUrl && <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 45%)' }} />}
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {p.discount > 0 && (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-black"
                                style={{ background: '#f59e0b', color: '#1a1a1a' }}>-{p.discount}%</span>
                            )}
                            {isLowStock && (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-black"
                                style={{ background: 'rgba(248,113,113,0.9)', color: '#fff' }}>Only {p.stock} left</span>
                            )}
                          </div>
                          {/* Category tag bottom */}
                          <div className="absolute bottom-2 left-2">
                            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm"
                              style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.75)' }}>
                              {p.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <button type="button" onClick={() => setViewing(p)} className="text-left text-xs font-black leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>{p.name}</button>
                          <div className="flex items-center justify-between mt-2.5">
                            <div>
                              <p className="text-sm font-black" style={{ color: 'var(--accent-text)' }}>{formatNGN(discPrice)}</p>
                              {p.discount > 0 && (
                                <p className="text-[10px] line-through" style={{ color: 'var(--text-tertiary)' }}>{formatNGN(p.price)}</p>
                              )}
                            </div>
                            {inCart ? (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => updateQty(p.id, inCart.quantity - 1)}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg transition-all active:scale-95"
                                  style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                                  <Minus size={11} />
                                </button>
                                <span className="text-xs font-black w-4 text-center" style={{ color: 'var(--text-primary)' }}>
                                  {inCart.quantity}
                                </span>
                                <button onClick={() => updateQty(p.id, inCart.quantity + 1)}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg transition-all active:scale-95"
                                  style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                                  <Plus size={11} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => (p.variations.length ? setViewing(p) : addToCart(p))} aria-label={`Add ${p.name}`}
                                className="h-8 w-8 flex items-center justify-center rounded-xl transition-all active:scale-95 hover:scale-105"
                                style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CART step ── */}
          {step === 'cart' && (
            <motion.div key="cart" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }} className="pt-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart size={32} className="mx-auto mb-3 opacity-25" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Your cart is empty</p>
                  <button onClick={() => setStep('browse')}
                    className="mt-4 rounded-xl px-5 py-2.5 text-sm font-black"
                    style={{ background: '#6fe8d6', color: '#1a1a1a' }}>Browse Products</button>
                </div>
              ) : (
                <>
                  {cart.map(item => {
                    const eff = unitPrice(item.product, item.variation);
                    return (
                      <div key={item.key}
                        className="flex items-center gap-3 rounded-2xl p-3"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                        {item.product.imageUrl && (
                          <img src={item.product.imageUrl} alt={item.product.name}
                            className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>
                            {item.product.name}
                          </p>
                          {item.variation && <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{item.variation.name}: {item.variation.value}</p>}
                          <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--accent-text)' }}>
                            {formatNGN(eff)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => updateQty(item.key, item.quantity - 1)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg"
                            style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                            <Minus size={11} />
                          </button>
                          <span className="text-sm font-black w-5 text-center"
                            style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.key, item.quantity + 1)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg"
                            style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                            <Plus size={11} />
                          </button>
                          <button onClick={() => removeFromCart(item.key)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg"
                            style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Order summary */}
                  <div className="rounded-2xl p-4 space-y-2"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    {cart.map(item => {
                      const eff = unitPrice(item.product, item.variation);
                      return (
                        <div key={item.key} className="flex justify-between text-xs">
                          <span style={{ color: 'var(--text-secondary)' }}>{item.product.name} × {item.quantity}</span>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatNGN(eff * item.quantity)}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Total</span>
                      <span className="text-sm font-black" style={{ color: 'var(--accent-text)' }}>{formatNGN(cartTotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── DETAILS step ── */}
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }} className="pt-4 space-y-4">
              <div className="rounded-2xl p-5 space-y-4"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Your Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: 'var(--text-tertiary)' }}>Full name</label>
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Amara Okafor" autoComplete="name"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: 'var(--text-tertiary)' }}>Phone</label>
                    <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="080 0000 0000" type="tel" autoComplete="tel"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                    <input type="checkbox" checked={delivery} onChange={e => setDelivery(e.target.checked)} className="h-4 w-4 accent-[#0b7367]" />
                    <Truck size={14} /> Deliver to an address
                  </label>
                  {delivery && (
                    <>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: 'var(--text-tertiary)' }}>Address</label>
                    <input value={address1} onChange={e => setAddress1(e.target.value)} placeholder="House number and street" autoComplete="address-line1"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                      <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: 'var(--text-tertiary)' }}>City</label>
                    <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Ikeja" autoComplete="address-level2"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: 'var(--text-tertiary)' }}>State</label>
                    <input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Lagos" autoComplete="address-level1"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                      </div>
                    </>
                  )}
                  <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Receipts go to {user?.email}.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PAYMENT step ── */}
          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }} className="pt-4 space-y-4">
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>
                  Choose Payment Source
                </h3>
                {[
                  { id: 'wallet' as const, icon: Wallet, label: 'BadePay Wallet', desc: `Balance ${formatNGN(Number(user?.balance ?? 0))}`, color: 'var(--accent-text)' },
                  { id: 'card' as const, icon: CreditCard, label: 'Debit card', desc: 'Secure card checkout', color: 'var(--accent-text)' },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setPaymentMethod(opt.id)}
                    className="w-full flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all"
                    style={{
                      background: paymentMethod === opt.id ? 'rgba(111,232,214,0.08)' : 'var(--surface-secondary)',
                      border: paymentMethod === opt.id ? '1px solid rgba(111,232,214,0.3)' : '1px solid var(--border)',
                    }}>
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: paymentMethod === opt.id ? 'rgba(111,232,214,0.15)' : 'var(--card)' }}>
                      <opt.icon size={18} style={{ color: paymentMethod === opt.id ? 'var(--accent-text)' : 'var(--text-tertiary)' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{opt.desc}</p>
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all`}
                      style={{
                        borderColor: paymentMethod === opt.id ? '#6fe8d6' : 'var(--border)',
                        background: paymentMethod === opt.id ? '#6fe8d6' : 'transparent',
                      }}>
                      {paymentMethod === opt.id && <div className="h-1.5 w-1.5 rounded-full bg-[#1a1a1a]" />}
                    </div>
                  </button>
                ))}
              </div>
              {/* Order summary */}
              <div className="rounded-2xl p-4"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                    {cartCount} item{cartCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-base font-black" style={{ color: 'var(--accent-text)' }}>
                    {formatNGN(cartTotal)}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl p-3"
                style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <Shield size={14} style={{ color: 'var(--success-text)', flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {paymentMethod === 'wallet' ? 'Paid from your wallet as soon as you enter your PIN.' : "You'll finish paying on the secure card page, then come back to your order."}
                </p>
              </div>
            </motion.div>
          )}

          {/* ── PIN step ── */}
          {step === 'pin' && (
            <motion.div key="pin" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }} className="pt-8 space-y-6">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(111,232,214,0.1)', border: '1px solid rgba(111,232,214,0.2)' }}>
                  <Shield size={28} style={{ color: 'var(--accent-text)' }} />
                </div>
                <h3 className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                  Enter your PIN
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Authorise payment of <span className="font-black" style={{ color: 'var(--accent-text)' }}>{formatNGN(cartTotal)}</span>
                </p>
              </div>
              {/* PIN dots */}
              <div className="flex justify-center gap-4 py-2">
                {[0,1,2,3].map(i => (
                  <div key={i}
                    className={`h-4 w-4 rounded-full transition-all duration-200 ${i < pin.length ? 'scale-110' : ''}`}
                    style={{
                      background: i < pin.length ? '#6fe8d6' : 'var(--border)',
                      boxShadow: i < pin.length ? '0 0 12px rgba(111,232,214,0.5)' : 'none',
                    }} />
                ))}
              </div>
              <PinPad value={pin} onChange={setPin} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom CTA ── */}
      <AnimatePresence>
        {(step === 'cart' && cart.length > 0) || step === 'details' || step === 'payment' || step === 'pin' ? (
          <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
            className="fixed bottom-0 left-0 right-0 p-4 z-40"
            style={{ background: 'var(--background)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
            <button
              onClick={() => {
                if (step === 'cart') goToDetails();
                else if (step === 'details') setStep('payment');
                else if (step === 'payment' && paymentMethod === 'card') handlePay();
                else if (step === 'payment') {
                  if (cartTotal > Number(user?.balance ?? 0)) { toast.error('Insufficient wallet balance. Pay by card or add money.'); return; }
                  setStep('pin');
                }
                else if (step === 'pin') handlePay();
              }}
              disabled={(step === 'details' && !!detailsProblem) || (step === 'pin' && pin.length < 4) || loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                : step === 'cart' ? <>{formatNGN(cartTotal)} · Checkout <ChevronRight size={15} /></>
                : step === 'details' ? (detailsProblem || <>Continue <ChevronRight size={15} /></>)
                : step === 'payment' ? <>{paymentMethod === 'card' ? `Pay ${formatNGN(cartTotal)} by card` : 'Continue to PIN'} <ChevronRight size={15} /></>
                : <><Shield size={15} /> Confirm & Pay {formatNGN(cartTotal)}</>
              }
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {viewing && <ProductSheet product={viewing} onClose={() => setViewing(null)} onAdd={(v, q) => { addToCart(viewing, v, q); setViewing(null); }} />}
    </div>
  );
}

/** Product detail (mobile app: ProductDetail): images, description, options and quantity. */
function ProductSheet({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (v: Variation | undefined, qty: number) => void }) {
  const [image, setImage] = useState(0);
  const [variation, setVariation] = useState<Variation | undefined>();
  const [qty, setQty] = useState(1);
  const groups = Object.entries(product.variations.reduce<Record<string, Variation[]>>((m, v) => ({ ...m, [v.name]: [...(m[v.name] ?? []), v] }), {}));
  const stock = variation ? variation.stock : product.stock;
  const needsOption = groups.length > 0 && !variation;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={product.name}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-3xl" style={{ background: 'var(--card)' }}>
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"><X size={16} /></button>
        <div className="aspect-square w-full" style={{ background: 'var(--surface-secondary)' }}>
          {product.images[image] ?? product.imageUrl
            ? <img src={product.images[image] ?? product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            : <div className="flex h-full items-center justify-center"><Package size={40} style={{ color: 'var(--text-tertiary)' }} /></div>}
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 pt-3">
            {product.images.map((src, i) => (
              <button key={src + i} onClick={() => setImage(i)} aria-label={`Image ${i + 1}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                style={{ outline: i === image ? '2px solid #6fe8d6' : '1px solid var(--border)' }}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="space-y-4 p-4">
          <div>
            <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
            <p className="mt-1 text-base font-black" style={{ color: 'var(--accent-text)' }}>
              {formatNGN(unitPrice(product, variation))}
              {product.discount > 0 && <span className="ml-2 text-xs font-medium line-through" style={{ color: 'var(--text-tertiary)' }}>{formatNGN(product.price + (variation?.priceAdjust ?? 0))}</span>}
            </p>
          </div>
          {product.description && <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>}
          {groups.map(([name, options]) => (
            <div key={name}>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{name}</p>
              <div className="flex flex-wrap gap-2">
                {options.map(o => (
                  <button key={o.id} disabled={o.stock <= 0} onClick={() => { setVariation(o); setQty(1); }}
                    className="rounded-full px-3.5 py-1.5 text-xs font-bold disabled:opacity-40"
                    style={variation?.id === o.id ? { background: '#6fe8d6', color: '#1a1a1a' } : { border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    {o.value}{o.priceAdjust ? ` (${o.priceAdjust > 0 ? '+' : '−'}${formatNGN(Math.abs(o.priceAdjust))})` : ''}{o.stock <= 0 ? ' · sold out' : ''}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {product.deliveryInfo && (
            <p className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}><Truck size={14} className="mt-0.5 shrink-0" />{product.deliveryInfo}</p>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Fewer" className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }}><Minus size={14} /></button>
              <span className="w-6 text-center text-sm font-black" style={{ color: 'var(--text-primary)' }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(Math.max(1, stock), q + 1))} aria-label="More" className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }}><Plus size={14} /></button>
            </div>
            <button disabled={needsOption || stock <= 0} onClick={() => onAdd(variation, qty)}
              className="flex-1 rounded-2xl py-3 text-sm font-black disabled:opacity-40" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
              {needsOption ? 'Choose an option' : stock <= 0 ? 'Sold out' : `Add to cart · ${formatNGN(unitPrice(product, variation) * qty)}`}
            </button>
          </div>
          {!needsOption && stock > 0 && stock <= 5 && <p className="text-xs" style={{ color: '#f87171' }}>Only {stock} left</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
