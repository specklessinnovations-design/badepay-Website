import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, MapPin, PlayCircle, ImageIcon, Search, Zap } from 'lucide-react';
import apiClient from '@/lib/apiClient';

type VideoItem = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category: string;
  location?: string;
  duration?: number;
  featured?: boolean;
  publishedAt: string;
  createdAt: string;
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: 'easeOut' as const },
});

export default function VideoPage() {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeItem, setActiveItem] = useState<VideoItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiClient.get('/videos');
        if (!cancelled) setItems(res?.data?.videos || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const filtered = items.filter(item => {
    const matchQuery = !query || item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(query.toLowerCase()));
    const matchFeatured = query !== 'featured' || item.featured;
    return matchQuery && matchFeatured;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(11,115,103,0.1)', border: '1.5px solid rgba(11,115,103,0.2)' }}>
          <Video size={22} style={{ color: '#0b7367' }} strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Video &amp; Stories
          </h1>
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Explore Nigeria — media shared by admins
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div {...fadeUp(0.05)}>
        <div className="flex h-11 items-center gap-2.5 rounded-2xl px-3.5"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
          <Search size={15} style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title or location..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </motion.div>

      {/* Filter tabs */}
      <motion.div {...fadeUp(0.08)} className="flex items-center gap-2">
        {['All', 'Featured'].map(type => (
          <button
            key={type}
            onClick={() => setQuery(type === 'All' ? '' : 'featured')}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold capitalize transition-all"
            style={{
              background: (type === 'All' && !query) || (type === 'Featured' && query === 'featured') ? '#0b7367' : 'var(--surface-secondary)',
              color: (type === 'All' && !query) || (type === 'Featured' && query === 'featured') ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${(type === 'All' && !query) || (type === 'Featured' && query === 'featured') ? '#0b7367' : 'var(--border)'}`,
            }}>
            {type === 'Featured' && <Zap size={13} />}
            {type}
          </button>
        ))}
        {items.length > 0 && (
          <span className="ml-auto text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {filtered.length} video{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </motion.div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl animate-pulse"
              style={{ background: 'var(--surface-secondary)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div {...fadeUp(0.1)}
          className="rounded-2xl p-10 text-center"
          style={{ background: 'var(--surface-secondary)', border: '1px dashed var(--border)' }}>
          <Video size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            {items.length === 0 ? 'No content yet' : 'No results found'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {items.length === 0 ? 'Admins will upload Explore Nigeria content here.' : 'Try a different search or filter.'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {filtered.map(item => (
            <motion.div
              key={item.id}
              variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1, transition: { duration: 0.3 } } }}
              onClick={() => setActiveItem(item)}
              className="relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl group"
            >
              <video
                src={item.videoUrl}
                poster={item.thumbnailUrl}
                muted loop playsInline
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <PlayCircle size={14} className="text-white" />
              </div>
              {item.featured && (
                <div className="absolute top-3 left-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  Featured
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-bold text-white text-[14px] leading-tight line-clamp-2">{item.title}</p>
                {item.location && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={11} className="text-white/70 shrink-0" />
                    <span className="text-[11px] text-white/70 uppercase tracking-wide truncate">{item.location}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Lightbox */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setActiveItem(null)}
        >
          <div className="relative max-h-[85vh] max-w-2xl w-full rounded-3xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <video src={activeItem.videoUrl} poster={activeItem.thumbnailUrl} controls autoPlay className="w-full max-h-[70vh] object-contain bg-black" />
            <div className="p-4" style={{ background: 'var(--card)' }}>
              <h2 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>{activeItem.title}</h2>
              {activeItem.description && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{activeItem.description}</p>
              )}
              {activeItem.location && (
                <div className="flex items-center gap-1 mt-2">
                  <MapPin size={13} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{activeItem.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
