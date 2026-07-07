import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Bookmark, TrendingUp, Clock, ChevronRight,
  Globe, Zap, Heart, ShoppingBag, Plane, Trophy, RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Link } from 'wouter';

type NewsCategory = 'all' | 'business' | 'tech' | 'nigeria' | 'sports' | 'travel';

type Article = {
  id: string;
  title: string;
  summary: string;
  category: NewsCategory;
  source: string;
  timeAgo: string;
  image: string;
  isFeatured?: boolean;
  isHot?: boolean;
};

const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'CBN Raises MPR to 27.25% — What it Means for Your Wallet',
    summary: 'The Central Bank of Nigeria has increased its Monetary Policy Rate, affecting loan rates and savings yields across all banks.',
    category: 'business', source: 'BusinessDay', timeAgo: '2h ago',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format',
    isFeatured: true, isHot: true,
  },
  {
    id: '2',
    title: "Nigeria's Fintech Sector Raises $2.4B in 2025",
    summary: 'Local and international investors continue to pour capital into Nigerian payment and savings startups.',
    category: 'tech', source: 'TechCabal', timeAgo: '4h ago',
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&auto=format',
    isHot: true,
  },
  {
    id: '3',
    title: 'Super Eagles Qualify for 2026 World Cup with 3-0 Win',
    summary: 'Victor Osimhen scored twice as Nigeria secures a spot in the global tournament for the first time since 2014.',
    category: 'sports', source: 'Vanguard', timeAgo: '6h ago',
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&auto=format',
    isHot: true,
  },
  {
    id: '4',
    title: 'Naira Strengthens to ₦1,520 Per Dollar After Oil Export Boost',
    summary: 'The naira recorded its strongest weekly gain in months following record crude oil production figures.',
    category: 'business', source: 'Punch', timeAgo: '8h ago',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format',
  },
  {
    id: '5',
    title: 'Lagos Blue Line Rail Expands to Victoria Island — Free Rides This Weekend',
    summary: 'The Lagos State government announced free rides on the new Blue Line extension from Marina to VI.',
    category: 'nigeria', source: 'The Nation', timeAgo: '10h ago',
    image: 'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600&auto=format',
  },
  {
    id: '6',
    title: 'Best Budget Travel Destinations in West Africa for 2026',
    summary: "From Accra's beaches to Dakar's culture, here's where to travel on a naira budget this year.",
    category: 'travel', source: 'TravelAfrica', timeAgo: '12h ago',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&auto=format',
  },
  {
    id: '7',
    title: 'Jumia Reports 40% Increase in Electronics Sales After Tax Relief',
    summary: "E-commerce giant attributes growth to government's import duty waiver on consumer electronics.",
    category: 'business', source: 'Nairametrics', timeAgo: '1d ago',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format',
  },
  {
    id: '8',
    title: 'Abuja to Get Africa\'s Largest Tech Hub — Construction Starts Q3 2026',
    summary: 'The federal government breaks ground on a ₦500B smart city and technology district.',
    category: 'tech', source: 'TechCabal', timeAgo: '1d ago',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format',
  },
  {
    id: '9',
    title: 'AFCON 2027: Nigeria Confirmed as Host Nation',
    summary: 'CAF officially names Nigeria as the sole host of the Africa Cup of Nations in 2027.',
    category: 'sports', source: 'Complete Sports', timeAgo: '2d ago',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format',
  },
  {
    id: '10',
    title: 'Eko Atlantic City Opens New Waterfront Shopping District',
    summary: 'Lagos\' landmark island development launches retail complex with 120 shops and 3 hotels.',
    category: 'nigeria', source: 'Guardian', timeAgo: '2d ago',
    image: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=600&auto=format',
  },
];

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

function FeaturedCard({ article }: { article: Article }) {
  return (
    <motion.div variants={riseIn}
      className="relative rounded-3xl overflow-hidden h-[240px] flex items-end cursor-pointer hover:scale-[1.01] transition-transform"
      style={{ boxShadow: '0 12px 40px -10px rgba(0,0,0,0.4)' }}>
      <img src={article.image} alt={article.title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      {article.isHot && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm">
          <Zap size={11} className="text-white" />
          <span className="text-[10px] text-white font-bold uppercase tracking-wider">Trending</span>
        </div>
      )}
      <div className="absolute top-3 right-3">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: `${CAT_COLORS[article.category]}33`, color: CAT_COLORS[article.category], border: `1px solid ${CAT_COLORS[article.category]}44` }}>
          {article.category}
        </span>
      </div>
      <div className="relative p-4 pb-5">
        <p className="text-white font-bold text-[16px] leading-tight line-clamp-2">{article.title}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-white/70 text-xs font-medium">{article.source}</span>
          <span className="text-white/40">·</span>
          <span className="text-white/60 text-xs flex items-center gap-1"><Clock size={11} />{article.timeAgo}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const [saved, setSaved] = useState(false);
  const color = CAT_COLORS[article.category];

  return (
    <motion.div variants={riseIn}
      className="flex gap-3 p-3 rounded-2xl group cursor-pointer transition-colors"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="relative h-[80px] w-[80px] shrink-0 rounded-xl overflow-hidden">
        <img src={article.image} alt={article.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {article.isHot && (
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
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{article.source}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <span className="text-[11px] flex items-center gap-0.5" style={{ color: 'var(--text-tertiary)' }}>
              <Clock size={10} />{article.timeAgo}
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

  const featured = MOCK_ARTICLES.find(a => a.isFeatured && (activeCategory === 'all' || a.category === activeCategory));
  const rest = MOCK_ARTICLES.filter(a => !a.isFeatured && (activeCategory === 'all' || a.category === activeCategory));

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1200));
    setRefreshing(false);
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
