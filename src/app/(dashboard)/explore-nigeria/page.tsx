import React, { useEffect, useState } from 'react';
import { ImageIcon, PlayCircle, MapPin, Sparkles } from 'lucide-react';
import apiClient from '@/lib/apiClient';

type ExploreItem = {
  id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  location: string;
  category: string;
  createdAt: string;
};

export default function ExploreNigeriaPage() {
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await apiClient.get('/explore-nigeria');
        setItems(response?.data?.items || []);
      } catch {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadItems();
  }, []);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="rounded-[28px] border border-white/10 bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--text-secondary)]">Explore Nigeria</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--text-primary)]">Discover Nigeria through stories, visuals, and culture</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
              Admins can publish imagery and videos here to keep the experience fresh and inspiring.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-3 py-2 text-sm font-semibold text-[var(--accent)]">
            <Sparkles size={15} />
            Curated highlights
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[24px] border border-white/10 bg-[var(--card)] p-8 text-center text-sm text-[var(--text-secondary)]">
          Loading content...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-[var(--card)] p-10 text-center text-sm text-[var(--text-secondary)]">
          No Explore Nigeria content has been published yet.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-[26px] border border-white/10 bg-[var(--card)] shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
              <div className="relative h-56 overflow-hidden bg-black/20">
                {item.mediaType === 'video' ? (
                  <video src={item.mediaUrl} controls className="h-full w-full object-cover" />
                ) : (
                  <img src={item.mediaUrl} alt={item.title} className="h-full w-full object-cover" />
                )}
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                  {item.mediaType === 'video' ? <PlayCircle size={14} /> : <ImageIcon size={14} />}
                  {item.category}
                </div>
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                  <MapPin size={14} />
                  {item.location}
                </div>
                <h3 className="text-lg font-black text-[var(--text-primary)]">{item.title}</h3>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
