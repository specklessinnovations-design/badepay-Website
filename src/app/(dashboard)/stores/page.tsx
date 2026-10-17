import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Search, Store, ChevronRight, Package, ArrowLeft } from 'lucide-react';
import { MerchantMark } from '@/components/merchant/MerchantBrand';
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
                  className="group block overflow-hidden rounded-2xl transition-shadow hover:shadow-md"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="h-24 overflow-hidden" style={{ background: '#0b2724' }}>
                    {store.bannerUrl && <img src={store.bannerUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex items-start gap-3 px-4 pb-4">
                    <div className="-mt-6 shrink-0 rounded-[14px]" style={{ border: '3px solid var(--card)' }}>
                      <MerchantMark name={store.name} logoUrl={store.logoUrl} size={52} />
                    </div>
                    <div className="min-w-0 flex-1 pt-2">
                      <h3 className="truncate text-[15px] font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{store.name}</h3>
                      {store.category && <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{store.category}</p>}
                      {store.description && <p className="mt-1 line-clamp-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{store.description}</p>}
                    </div>
                    <div className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors group-hover:bg-[var(--accent-bg)]"
                      style={{ border: '1px solid var(--border)' }}>
                      <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
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
