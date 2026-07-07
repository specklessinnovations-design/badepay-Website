import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Bookmark, TrendingUp, Clock, ChevronRight,
  Globe, Zap, Heart, ShoppingBag, Plane, Trophy, RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Link } from 'wouter';
import apiClient from '@/lib/apiClient';

type NewsCategory = 'all' | 'business' | 'tech' | 'nigeria' | 'sports' | 'travel';

type Article = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: { name: string };
  coverImageUrl?: string;
  featured?: boolean;
  publishedAt: string;
  createdAt: string;
  isHot?: boolean;
};


const NEWS_CATS: { key: NewsCategory; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: Globe },
  { key: 'business', label: 'Business', icon: TrendingUp },
  { key: 'tech', label: 'Tech', icon: Zap },
  { key: 'nigeria', label: 'Nigeria', icon: Heart },
  { key: 'sports', label: 'Sports', icon: Trophy },
  { key: 'travel', label: 'Travel', icon: Plane },
];

const CAT_COLORS: Record<NewsCategory, string> = {
  all: '#0b7367',
  business: '#10B981',
  tech: '#3B82F6',
  nigeria: '#7C6CF0',
  sports: '#F59E0B',
  travel: '#EC4899',
};

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const riseIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as any } },
};

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function FeaturedCard({ article }: { article: Article }) {
  const categoryKey = (article.category?.toLowerCase() || 'all') as NewsCategory;
  const timeAgo = getTimeAgo(article.publishedAt || article.createdAt);

  return (
    <motion.div variants={riseIn}
      className="relative rounded-3xl overflow-hidden h-[240px] flex items-end cursor-pointer hover:scale-[1.01] transition-transform"
      style={{ boxShadow: '0 12px 40px -10px rgba(0,0,0,0.4)' }}>
      <img src={article.coverImageUrl || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format'} alt={article.title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      {article.featured && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm">
          <Zap size={11} className="text-white" />
          <span className="text-[10px] text-white font-bold uppercase tracking-wider">Featured</span>
        </div>
      )}
      <div className="absolute top-3 right-3">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: `${CAT_COLORS[categoryKey]}33`, color: CAT_COLORS[categoryKey], border: `1px solid ${CAT_COLORS[categoryKey]}44` }}>
          {article.category}
        </span>
      </div>
      <div className="relative p-4 pb-5">
        <p className="text-white font-bold text-[16px] leading-tight line-clamp-2">{article.title}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-white/70 text-xs font-medium">{article.author?.name || 'BadePay'}</span>
          <span className="text-white/40">·</span>
          <span className="text-white/60 text-xs flex items-center gap-1"><Clock size={11} />{timeAgo}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const [saved, setSaved] = useState(false);
  const categoryKey = (article.category?.toLowerCase() || 'all') as NewsCategory;
  const color = CAT_COLORS[categoryKey];
  const timeAgo = getTimeAgo(article.publishedAt || article.createdAt);

  return (
    <motion.div variants={riseIn}
      className="flex gap-3 p-3 rounded-2xl group cursor-pointer transition-colors"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="relative h-[80px] w-[80px] shrink-0 rounded-xl overflow-hidden">
        <img src={article.coverImageUrl || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format'} alt={article.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {article.featured && (
          <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
            <Zap size={9} className="text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 uppercase tracking-wider"
              style={{ background: `${color}15`, color }}>
              {article.category}
            </span>
          </div>
          <p className="text-[13.5px] font-bold leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {article.title}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{article.author?.name || 'BadePay'}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <span className="text-[11px] flex items-center gap-0.5" style={{ color: 'var(--text-tertiary)' }}>
              <Clock size={10} />{timeAgo}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setSaved(s => !s); }}
            className="h-7 w-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: saved ? `${color}15` : 'var(--surface-secondary)' }}>
            <Bookmark size={13} style={{ color: saved ? color : 'var(--text-tertiary)', fill: saved ? color : 'none' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadNews = async () => {
      try {
        const res = await apiClient.get('/news');
        if (!cancelled) setArticles(res?.data?.posts || []);
      } catch {
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadNews();
    return () => { cancelled = true; };
  }, []);

  const filteredArticles = activeCategory === 'all'
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const featured = filteredArticles.find(a => a.featured) || filteredArticles[0];
  const rest = filteredArticles.filter(a => a.id !== featured?.id);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await apiClient.get('/news');
      setArticles(res?.data?.posts || []);
    } catch {
      setArticles([]);
    } finally {
      setRefreshing(false);
    }
  };

  const catColor = CAT_COLORS[activeCategory];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>News & Explore</h1>
          <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Stay informed on Nigeria's latest stories
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="h-10 w-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {NEWS_CATS.map(({ key, label, icon: Icon }) => {
          const active = key === activeCategory;
          const color = CAT_COLORS[key];
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className="shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: active ? color : 'var(--surface-secondary)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: active ? 'none' : '1px solid var(--border)',
              }}>
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Featured article */}
      <AnimatePresence mode="wait">
        {featured && (
          <motion.div
            key={activeCategory + '-featured'}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}>
            <FeaturedCard article={featured} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-black" style={{ color: 'var(--text-primary)' }}>
          {activeCategory === 'all' ? 'Latest Stories' : `${NEWS_CATS.find(c => c.key === activeCategory)?.label} Stories`}
        </h2>
        <span className="text-xs font-semibold" style={{ color: catColor }}>
          {rest.length} article{rest.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Article list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + '-list'}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          variants={staggerParent}
          className="space-y-3">
          {rest.length === 0 ? (
            <div className="py-12 text-center rounded-2xl" style={{ background: 'var(--surface-secondary)', border: '1px dashed var(--border)' }}>
              <Globe size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>No stories in this category</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Try a different category or check back later.</p>
            </div>
          ) : (
            rest.map(article => <ArticleCard key={article.id} article={article} />)
          )}
        </motion.div>
      </AnimatePresence>

      {/* Finance ticker at bottom */}
      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #0b7367 0%, #085f55 100%)' }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} className="text-white/80" />
          <span className="text-xs font-bold uppercase tracking-wider text-white/80">Market Snapshot</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'USD/NGN', value: '₦1,520', change: '+0.4%', up: true },
            { label: 'GBP/NGN', value: '₦1,920', change: '-0.2%', up: false },
            { label: 'BTC/NGN', value: '₦152M', change: '+2.1%', up: true },
          ].map(({ label, value, change, up }) => (
            <div key={label} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{label}</p>
              <p className="text-sm font-black text-white mt-0.5">{value}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${up ? 'text-[#10B981]' : 'text-[#f87171]'}`}>{change}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
