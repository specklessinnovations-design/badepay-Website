import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Store, Filter, ShoppingBag, Star, LayoutGrid, Tag } from 'lucide-react';
import { merchantService, type StoreInfo, type Product } from '@/services/merchantService';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Food', 'Services', 'Health', 'Home', 'Other'];

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'products' | 'stores'>('products');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'stores') {
          const resp = await merchantService.getPublicStores({
            search: search || undefined,
            category: selectedCategory === 'All' ? undefined : selectedCategory,
          });
          let storesList = [];
          if (resp?.stores) storesList = resp.stores;
          else if (resp?.data?.stores) storesList = resp.data.stores;
          if (!cancelled) setStores(storesList);
        } else {
          const resp = await merchantService.getAllProducts({
            search: search || undefined,
            category: selectedCategory === 'All' ? undefined : selectedCategory,
          });
          let productsList = [];
          if (resp?.products) productsList = resp.products;
          else if (resp?.data?.products) productsList = resp.data.products;
          if (!cancelled) setProducts(productsList);
        }
      } catch (err) {
        console.error('Failed to load marketplace data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadData();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeTab, search, selectedCategory]);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: 'easeOut' as const },
  });

  const staggerParent = {
    hidden: {},
    show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
  };

  const riseIn = {
    hidden: { opacity: 0, scale: 0.96 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.28, ease: 'easeOut' as any } },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Marketplace</h1>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Discover products and stores from BadePay merchants</p>
        </div>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[rgba(11,115,103,0.1)]">
          <ShoppingBag size={20} style={{ color: '#0b7367' }} />
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div {...fadeUp(0.04)} className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
        <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products or stores..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
      </motion.div>

      {/* Category Horizontal Pills */}
      <motion.div {...fadeUp(0.07)} className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all"
            style={{
              background: selectedCategory === cat ? '#0b7367' : 'var(--surface-secondary)',
              color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${selectedCategory === cat ? '#0b7367' : 'var(--border)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Tab Switcher */}
      <motion.div {...fadeUp(0.1)} className="rounded-2xl p-1 flex"
        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('products')}
          className="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
          style={{
            background: activeTab === 'products' ? 'var(--card)' : 'transparent',
            color: activeTab === 'products' ? '#0b7367' : 'var(--text-secondary)',
            boxShadow: activeTab === 'products' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
          style={{
            background: activeTab === 'stores' ? 'var(--card)' : 'transparent',
            color: activeTab === 'stores' ? '#0b7367' : 'var(--text-secondary)',
            boxShadow: activeTab === 'stores' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          Stores
        </button>
      </motion.div>

      {/* Content area */}
      <div className="min-h-[300px]">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl animate-pulse"
                style={{ background: 'var(--surface-secondary)' }} />
            ))}
          </div>
        ) : activeTab === 'products' ? (
          products.length === 0 ? (
            <div className="text-center py-12" style={{ background: 'var(--surface-secondary)', border: '1px dashed var(--border)', borderRadius: '20px' }}>
              <ShoppingBag size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>No products found</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={staggerParent}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            >
              {products.map(product => (
                <motion.div key={product.id} variants={riseIn}
                  className="rounded-2xl overflow-hidden flex flex-col group cursor-pointer"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <Link href={`/store/${product.storeId}`}>
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--surface-secondary)' }}>
                          <ShoppingBag size={28} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      )}
                    </div>
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-xs line-clamp-2" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>In Store</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                          ₦{Number(product.price).toLocaleString()}
                        </span>
                        {product.stock > 0 ? (
                          <span className="text-[10px] font-bold text-[#10B981]">In Stock</span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-500">Out of Stock</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )
        ) : (
          stores.length === 0 ? (
            <div className="text-center py-12" style={{ background: 'var(--surface-secondary)', border: '1px dashed var(--border)', borderRadius: '20px' }}>
              <Store size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>No stores found</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={staggerParent}
              className="space-y-3"
            >
              {stores.map(store => (
                <motion.div key={store.id} variants={riseIn}
                  className="rounded-2xl p-4 flex gap-4 transition-transform hover:scale-[1.01]"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <Link href={`/store/${store.slug}`} className="flex gap-4 w-full">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt={store.name} className="h-14 w-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(11,115,103,0.1)' }}>
                        <Store size={22} style={{ color: '#0b7367' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{store.name}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>{store.category}</span>
                      </div>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{store.description}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Star size={11} className="fill-[#F59E0B] text-[#F59E0B]" />
                        <span className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>4.5</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}
