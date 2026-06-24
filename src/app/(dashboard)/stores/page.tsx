import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Search, Store, Star, MapPin, ChevronRight, Package, ArrowLeft } from 'lucide-react';
import { useMerchantStoreData } from '@/store/useMerchantStoreData';

export default function StoresListPage() {
  const { stores, publicStores, fetchPublicStores } = useMerchantStoreData();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPublicStores();
  }, [fetchPublicStores]);

  const filteredStores = useMemo(() => {
    return publicStores.filter(item => {
      const store = item.store;
      if (!store) return false;
      const nameMatch = store.name.toLowerCase().includes(search.toLowerCase());
      const catMatch = store.category?.toLowerCase().includes(search.toLowerCase()) || false;
      return nameMatch || catMatch;
    });
  }, [publicStores, search]);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: "easeOut" as const },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)]">Stores</h1>
          <p className="mt-1 text-sm font-bold text-[var(--text-secondary)]">Shop directly from BadePay merchants</p>
        </div>
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center accent-icon-wrap">
          <Store size={24} style={{ color: 'var(--accent-text)' }} />
        </div>
      </header>

      {/* Search bar */}
      <div className="relative flex items-center gap-2 rounded-2xl px-4 py-3"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
        <input 
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search stores or categories..." 
          className="flex-1 bg-transparent text-sm font-medium outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>

      {/* Stores list */}
      <div className="space-y-4">
        {filteredStores.length === 0 ? (
          <div className="text-center py-12 surface-card">
            <Package size={40} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
            <p className="font-black text-[var(--text-primary)]">No stores found</p>
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--text-secondary)' }}>Try searching for something else</p>
          </div>
        ) : (
          filteredStores.map((item, i) => {
            const store = item.store;
            const user = item.user;
            return (
              <motion.div key={store.id} {...fadeUp(i * 0.05)}>
                <Link href={`/store/${store.slug}`} 
                  className="surface-card block overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
                  <div className="relative h-32 overflow-hidden">
                    {store.bannerUrl ? (
                      <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="h-full w-full" style={{ background: 'linear-gradient(135deg, var(--accent-bg) 0%, var(--surface-secondary) 100%)' }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black border-2 border-white/20 backdrop-blur-md"
                        style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff' }}>
                        {store.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-white">
                        <h3 className="text-sm font-black leading-tight">{store.name}</h3>
                        <p className="text-[10px] font-bold opacity-80">{store.category}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                        {store.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star size={12} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                          <span className="text-[10px] font-black" style={{ color: 'var(--text-primary)' }}>5.0</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={12} style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-[10px] font-bold" style={{ color: 'var(--text-tertiary)' }}>Lagos, NG</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--accent-bg)]"
                      style={{ border: '1px solid var(--border)' }}>
                      <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} className="group-hover:text-[var(--accent-text)]" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
