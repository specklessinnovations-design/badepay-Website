import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Search, Plus, Minus, X, CheckCircle2, ArrowLeft,
  Store, Package, Star, Wallet, Shield, ChevronRight, Loader2
} from 'lucide-react';
import { useMerchantStoreData, type Product, type CartItem } from '@/store/useMerchantStoreData';
import { useMerchantStore } from '@/store/useMerchantStore';
import * as authService from '@/services/authService';
import { formatNGN } from '@/utils/formatting';
import toast from 'react-hot-toast';

const PRODUCT_CATEGORIES = ['All', 'Clothing', 'Food & Drinks', 'Electronics', 'Beauty', 'Home & Living', 'Books', 'Health', 'Services', 'Digital', 'Other'];

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
  const { stores, products, placeOrder } = useMerchantStoreData();
  const recordPayment = useMerchantStore(s => s.recordPayment);

  // Find merchant by slug
  const allUsers = authService.listUsers();
  const merchant = allUsers.find(u =>
    u.merchantProfile?.qrSlug === slug ||
    u.merchantProfile?.tradingName?.toLowerCase().replace(/[^a-z0-9]/g, '') === slug
  );
  const merchantId = merchant?.id || slug;

  const storeInfo = stores[merchantId];
  const storeProducts = useMemo(() =>
    (products[merchantId] || []).filter(p => p.isActive && p.stock > 0),
    [products, merchantId]
  );

  const isLive = storeInfo?.isPublished !== false;

  const [step, setStep] = useState<CheckoutStep>('browse');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filterCat, setFilterCat] = useState('All');
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet'>('wallet');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<string | null>(null);

  const filtered = storeProducts.filter(p => {
    const matchCat = filterCat === 'All' || p.category === filterCat;
    const matchQ = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const cartTotal = cart.reduce((s, i) => {
    const eff = i.product.discount > 0 ? i.product.price * (1 - i.product.discount / 100) : i.product.price;
    return s + eff * i.quantity;
  }, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === p.id);
      if (ex) return prev.map(i => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product: p, quantity: 1 }];
    });
    toast.success(`${p.name} added to cart`);
  };

  const removeFromCart = (productId: string) =>
    setCart(prev => prev.filter(i => i.product.id !== productId));

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const handlePay = async () => {
    if (pin !== '1234' && pin.length < 4) { toast.error('Enter your 4-digit PIN'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));

    const order = placeOrder({
      merchantSlug: slug,
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      deliveryAddress: deliveryAddress.trim(),
      items: cart,
      totalAmount: cartTotal,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod,
    });

    if (merchant?.id) {
      recordPayment(merchant.id, customerName || 'Walk-in Customer', cartTotal);
    }

    setCompletedOrder(order.reference);
    setLoading(false);
    setStep('success');
  };

  const storeName = storeInfo?.name || merchant?.merchantProfile?.tradingName || 'Store';
  const storeDesc = storeInfo?.description || merchant?.merchantProfile?.category || '';
  const bannerUrl = storeInfo?.bannerUrl || '';

  if (!isLive && !storeInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--background)' }}>
        <div className="text-center px-6 py-12">
          <div className="mx-auto h-20 w-20 rounded-3xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(111,232,214,0.1)', border: '1px solid rgba(111,232,214,0.2)' }}>
            <Store size={32} style={{ color: '#6fe8d6' }} />
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
          <CheckCircle2 size={44} style={{ color: '#34d399' }} />
        </div>
        <div>
          <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Payment Successful!</h2>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Your order has been confirmed. Funds have landed in the merchant's wallet.
          </p>
        </div>
        <div className="rounded-2xl p-4 text-left space-y-2"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex justify-between">
            <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>Reference</span>
            <span className="text-xs font-black font-mono" style={{ color: 'var(--text-primary)' }}>{completedOrder}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>Amount Paid</span>
            <span className="text-xs font-black" style={{ color: '#34d399' }}>{formatNGN(cartTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>Store</span>
            <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{storeName}</span>
          </div>
        </div>
        <button onClick={() => { setCart([]); setStep('browse'); setPin(''); setCustomerName(''); setCustomerPhone(''); }}
          className="w-full rounded-2xl py-3.5 text-sm font-black transition-all active:scale-95"
          style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
          Shop Again
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* ── Store header ── */}
      <div className="relative">
        {/* Banner */}
        <div className="relative h-44 overflow-hidden">
          {bannerUrl
            ? <img src={bannerUrl} alt="store banner" className="w-full h-full object-cover" />
            : <div className="h-full w-full"
                style={{ background: 'linear-gradient(135deg,#051a14 0%,#0d3028 40%,#081e18 60%,#030f0d 100%)' }}>
                <div className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(111,232,214,0.2) 0%, transparent 60%), radial-gradient(circle at 70% 30%, rgba(111,232,214,0.1) 0%, transparent 50%)' }} />
              </div>
          }
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)' }} />
          {/* Store stats on banner */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <div className="rounded-xl px-2.5 py-1.5 text-[10px] font-black backdrop-blur-sm"
              style={{ background: 'rgba(0,0,0,0.55)', color: '#e5e5e5' }}>
              {storeProducts.length} products
            </div>
            <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 backdrop-blur-sm"
              style={{ background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.3)' }}>
              <div className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse" />
              <span className="text-[10px] font-black" style={{ color: '#34d399' }}>OPEN</span>
            </div>
          </div>
        </div>
        {/* Store identity */}
        <div className="relative px-4 -mt-8 pb-2">
          <div className="flex items-end gap-3">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg,#6fe8d6 0%,#4dd9c8 100%)',
                color: '#050f0d',
                border: '3px solid var(--background)',
                boxShadow: '0 8px 24px rgba(111,232,214,0.3)',
              }}>
              {storeName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-lg font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{storeName}</h1>
              {storeDesc && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{storeDesc}</p>}
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={10} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                ))}
                <span className="text-[10px] font-bold ml-1" style={{ color: 'var(--text-tertiary)' }}>5.0 · Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                {PRODUCT_CATEGORIES.map(c => (
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
                    const discPrice = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
                    const inCart = cart.find(c => c.product.id === p.id);
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
                        <div className="relative h-44 overflow-hidden"
                          style={{ background: 'var(--surface-secondary)' }}>
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            : <div className="h-full w-full flex items-center justify-center">
                                <Package size={28} style={{ color: 'var(--text-tertiary)' }} />
                              </div>
                          }
                          {/* Gradient overlay */}
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />
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
                          <p className="text-xs font-black leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                          <div className="flex items-center justify-between mt-2.5">
                            <div>
                              <p className="text-sm font-black" style={{ color: '#6fe8d6' }}>{formatNGN(discPrice)}</p>
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
                              <button onClick={() => addToCart(p)}
                                className="h-8 w-8 flex items-center justify-center rounded-xl transition-all active:scale-95 hover:scale-105"
                                style={{ background: '#6fe8d6', color: '#1a1a1a', boxShadow: '0 2px 8px rgba(111,232,214,0.3)' }}>
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
                    const eff = item.product.discount > 0
                      ? item.product.price * (1 - item.product.discount / 100)
                      : item.product.price;
                    return (
                      <div key={item.product.id}
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
                          <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--accent-text)' }}>
                            {formatNGN(eff)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => updateQty(item.product.id, item.quantity - 1)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg"
                            style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                            <Minus size={11} />
                          </button>
                          <span className="text-sm font-black w-5 text-center"
                            style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.product.id, item.quantity + 1)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg"
                            style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
                            <Plus size={11} />
                          </button>
                          <button onClick={() => removeFromCart(item.product.id)}
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
                      const eff = item.product.discount > 0 ? item.product.price * (1 - item.product.discount / 100) : item.product.price;
                      return (
                        <div key={item.product.id} className="flex justify-between text-xs">
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
                      style={{ color: 'var(--text-tertiary)' }}>Name</label>
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                      placeholder="e.g. Amara Okafor"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: 'var(--text-tertiary)' }}>Phone (Optional)</label>
                    <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+234 800 000 0000" type="tel"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: 'var(--text-tertiary)' }}>Delivery address</label>
                    <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Enter delivery address for this order"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none min-h-[96px] resize-none"
                      style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                  </div>
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
                  { id: 'wallet' as const, icon: Wallet, label: 'BadePay Wallet', desc: 'Pay from your BadePay balance', color: 'var(--accent-text)' },
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
                <Shield size={14} style={{ color: '#34d399', flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Your payment is secured by BadePay. Transaction is confirmed instantly after PIN entry.
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
                  <Shield size={28} style={{ color: '#6fe8d6' }} />
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
              <p className="text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Demo: use PIN <strong>1234</strong>
              </p>
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
                if (step === 'cart') setStep('details');
                else if (step === 'details') setStep('payment');
                else if (step === 'payment') setStep('pin');
                else if (step === 'pin') handlePay();
              }}
              disabled={(step === 'details' && (!customerName.trim() || !deliveryAddress.trim())) || (step === 'pin' && pin.length < 4) || loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#6fe8d6', color: '#1a1a1a' }}>
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                : step === 'cart' ? <>{formatNGN(cartTotal)} · Checkout <ChevronRight size={15} /></>
                : step === 'details' ? <>Continue <ChevronRight size={15} /></>
                : step === 'payment' ? <>Continue to PIN <ChevronRight size={15} /></>
                : <><Shield size={15} /> Confirm & Pay {formatNGN(cartTotal)}</>
              }
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
