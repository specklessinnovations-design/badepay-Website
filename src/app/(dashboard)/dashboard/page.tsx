import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import {
  Plus, Send, QrCode, Landmark, Eye, EyeOff,
  Smartphone, Wifi, Zap, Tv, ChevronRight,
  TrendingUp, TrendingDown, Bell, Sparkles, Bot, X,
  Car, Plane, Building2, Coins, Train, CloudSun,
  UtensilsCrossed, ShoppingBag, Package, Globe, ShoppingCart,
  HeartPulse, Wallet, LayoutGrid, Search, MapPin, ChevronDown,
  Newspaper, ScanLine, Banknote,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useWalletStore } from '@/store/useWalletStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { formatNGN, formatTimeAgo } from '@/utils/formatting';
import {
  getGreeting, computeMonthlyChange,
  formatDisplayName,
} from '@/lib/personalHelpers';
import { HomeWalletModals, type HomeModalType } from '@/components/dashboard/HomeWalletModals';
import walletService from '@/services/walletService';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';

// ── Service categories ─────────────────────────────────────────────
type ServiceItem = { label: string; icon: React.ElementType; href: string; color: string };
const SERVICE_CATEGORIES: { key: string; label: string; items: ServiceItem[] }[] = [
  {
    key: 'regular',
    label: 'Regular',
    items: [
      { label: 'Airtime', icon: Smartphone, href: '/bills?type=airtime', color: '#3B82F6' },
      { label: 'Data', icon: Wifi, href: '/bills?type=data', color: '#14B8A6' },
      { label: 'Betting', icon: Wallet, href: '/bills', color: '#7C6CF0' },
      { label: 'Uber', icon: Car, href: '/bills', color: '#64748b' },
      { label: 'Electricity', icon: Zap, href: '/bills?type=electricity', color: '#EF4444' },
      { label: 'Exchange', icon: Coins, href: '/insights', color: '#F59E0B' },
      { label: 'Gov & Tax', icon: Landmark, href: '/bills', color: '#1E3A8A' },
      { label: 'More', icon: LayoutGrid, href: '/bills', color: '#9CA3AF' },
    ],
  },
  {
    key: 'travel',
    label: 'Travel',
    items: [
      { label: 'BadeTrip', icon: Plane, href: '/bills', color: '#7C6CF0' },
      { label: 'Uber', icon: Car, href: '/bills', color: '#64748b' },
      { label: 'Bolt', icon: Car, href: '/bills', color: '#22C55E' },
      { label: 'LagRide', icon: Car, href: '/bills', color: '#F4652A' },
      { label: 'Train', icon: Train, href: '/bills', color: '#14B8A6' },
      { label: 'Hotels', icon: Building2, href: '/bills', color: '#EC4899' },
      { label: 'Weather', icon: CloudSun, href: '/bills', color: '#38BDF8' },
      { label: 'eSIM', icon: Smartphone, href: '/bills', color: '#3B82F6' },
    ],
  },
  {
    key: 'food',
    label: 'Food',
    items: [
      { label: 'Glovo', icon: UtensilsCrossed, href: '/bills', color: '#F97316' },
      { label: 'KFC', icon: UtensilsCrossed, href: '/bills', color: '#DC2626' },
      { label: 'Mano', icon: ShoppingBag, href: '/bills', color: '#7C6CF0' },
      { label: 'Amart', icon: ShoppingBag, href: '/bills', color: '#EC4899' },
      { label: 'UberEats', icon: Car, href: '/bills', color: '#06C167' },
    ],
  },
  {
    key: 'shop',
    label: 'Shop',
    items: [
      { label: 'Amart', icon: ShoppingBag, href: '/marketplace', color: '#EC4899' },
      { label: 'Betting', icon: Wallet, href: '/bills', color: '#7C6CF0' },
      { label: 'Amazon', icon: Package, href: '/marketplace', color: '#F59E0B' },
      { label: 'Temu', icon: ShoppingCart, href: '/marketplace', color: '#EF4444' },
      { label: 'Alibaba', icon: Globe, href: '/marketplace', color: '#F97316' },
      { label: 'Jumia', icon: ShoppingCart, href: '/marketplace', color: '#F4652A' },
      { label: 'Konga', icon: ShoppingBag, href: '/marketplace', color: '#DC2626' },
    ],
  },
  {
    key: 'living',
    label: 'Living',
    items: [
      { label: 'Electricity', icon: Zap, href: '/bills?type=electricity', color: '#EF4444' },
      { label: 'Airtime', icon: Smartphone, href: '/bills?type=airtime', color: '#3B82F6' },
      { label: 'Data', icon: Wifi, href: '/bills?type=data', color: '#14B8A6' },
      { label: 'Healthcare', icon: HeartPulse, href: '/bills', color: '#EC4899' },
      { label: 'Tax Refund', icon: Landmark, href: '/bills', color: '#1E3A8A' },
      { label: 'Cable TV', icon: Tv, href: '/bills?type=cable', color: '#7C6CF0' },
      { label: 'Internet', icon: Wifi, href: '/bills', color: '#14B8A6' },
      { label: 'HMO', icon: Building2, href: '/bills', color: '#F4652A' },
    ],
  },
];

const SPECIAL_OFFERS = [
  { pct: '7% off', title: 'Weekend Hotel Deals', sub: 'Save up to ₦10,000', cta: 'Claim', color: '#7C6CF0' },
  { pct: '15% off', title: 'Airtime Top-up', sub: 'Save up to ₦2,000', cta: 'Claim', color: '#14B8A6' },
  { pct: '5% off', title: 'Data Bundles', sub: 'Save up to ₦1,500', cta: 'Claim', color: '#3B82F6' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: 'easeOut' as const },
});

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};
const riseIn = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as any } },
};

type NewsItem = { id: string; slug: string; title: string; category: string; coverImageUrl?: string | null };
type ChatMessage = { role: 'assistant' | 'user'; content: string };

export default function DashboardHome() {
  const [, navigate] = useLocation();
  const user = useAuthStore(s => s.user);
  const syncUserFromStorage = useAuthStore(s => s.syncUserFromStorage);
  const transactions = useTransactionStore(s => s.transactions);
  const fetchTransactions = useTransactionStore(s => s.fetchTransactions);
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);

  const [showBalance, setShowBalance] = useState(true);
  const [activeModal, setActiveModal] = useState<HomeModalType | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(user?.balance || 0);
  const [activeCategory, setActiveCategory] = useState('regular');
  const [exploreItems, setExploreItems] = useState<NewsItem[]>([]);
  const [isExploreLoading, setIsExploreLoading] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I can help with transfers, bills, QR payments, savings, and account support.' },
  ]);
  const [aiDraft, setAiDraft] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          syncUserFromStorage(),
          fetchTransactions({ limit: 20 }),
          fetchNotifications(),
        ]);
        const balanceData = await walletService.getBalance();
        setWalletBalance(balanceData.balance);
      } catch {}
    };
    loadData();
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [syncUserFromStorage, fetchTransactions, fetchNotifications]);

  useEffect(() => {
    let cancelled = false;
    const loadExplore = async () => {
      try {
        const res = await apiClient.get('/news?limit=6');
        if (!cancelled) setExploreItems(res?.data?.posts || []);
      } catch {
        if (!cancelled) setExploreItems([]);
      } finally {
        if (!cancelled) setIsExploreLoading(false);
      }
    };
    void loadExplore();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isAiOpen) return;
    const loadSuggestions = async () => {
      try {
        const response = await apiClient.get('/ai/suggestions');
        setAiSuggestions(response?.data?.suggestions || []);
      } catch {
        setAiSuggestions(['Check your recent transactions', 'Scan a QR code to pay', 'Set up automatic savings']);
      }
    };
    void loadSuggestions();
  }, [isAiOpen]);

  if (!user) return null;

  const activeItems = SERVICE_CATEGORIES.find(c => c.key === activeCategory)?.items || [];

  const handleAiSend = async (message?: string) => {
    const text = (message || aiDraft).trim();
    if (!text) return;
    setAiMessages(prev => [...prev, { role: 'user', content: text }]);
    setAiDraft('');
    setAiLoading(true);
    try {
      const response = await apiClient.post('/ai/chat', { message: text });
      const answer = response?.data?.response || 'I can help you with transfers, bills, QR payments, savings, and more.';
      setAiMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'The assistant is temporarily unavailable. Please try again shortly.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  const displayBalance = walletBalance || user?.balance || 0;

  return (
    <div className="space-y-0">

      {/* ── Balance hero: solid deep brand card, white text (readable in light and dark) ── */}
      <motion.section {...fadeUp(0)} aria-label="Your balance"
        className="rounded-3xl p-5 lg:p-6" style={{ background: '#0b2724', border: '1px solid rgba(111,232,214,0.18)' }}>
        {/* Greeting + actions */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: '#6fe8d6' }}>{getGreeting()}</p>
            <h1 className="mt-0.5 text-xl font-black text-white">{formatDisplayName(user.firstName)} 👋</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => setIsAiOpen(true)} aria-label="Open AI assistant"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/20"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Sparkles size={17} className="text-white" />
            </button>
            <Link href="/profile/notifications" aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/20"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Bell size={17} className="text-white" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ background: '#EF4444', border: '2px solid #0b2724' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Balance */}
        <div className="mb-5 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Available balance</span>
            <button type="button" onClick={() => setShowBalance(!showBalance)} aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              className="rounded-lg p-1 transition-colors hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="mb-1 text-3xl font-black tracking-tight text-white lg:text-4xl">
            {showBalance ? `₦${displayBalance.toLocaleString()}` : '₦ ••••••'}
          </div>
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Account {user.accountNumber || '••••••••••'}</p>
        </div>

        {/* Primary actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { Icon: ScanLine, label: 'Scan', href: '/scan' },
            { Icon: Banknote, label: 'Pay/Receive', href: '/profile/my-qr' },
            { Icon: Send, label: 'Bills', href: '/bills' },
            { Icon: Newspaper, label: 'News', href: '/news' },
          ].map(({ Icon, label, href }) => (
            <Link key={label} href={href} className="group flex flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-active:scale-95"
                style={{ background: '#6fe8d6' }}>
                <Icon size={23} strokeWidth={2.2} style={{ color: '#0b2724' }} />
              </div>
              <span className="text-center text-[12px] font-bold leading-tight text-white">{label}</span>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ── White content area ──────────────────────────────────────── */}
      <div className="space-y-5 pt-4">

        {/* Category Tabs + Icon Grid */}
        <motion.div {...fadeUp(0.06)}>
          {/* Tab bar */}
          <div className="px-4 mb-3">
            <div className="flex items-center justify-center gap-5">
              {SERVICE_CATEGORIES.map(cat => {
                const active = cat.key === activeCategory;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className="relative py-1.5 shrink-0 transition-colors"
                    style={{ color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                  >
                    <span className={`text-[14px] ${active ? 'font-bold' : 'font-medium'}`}>{cat.label}</span>
                    {active && (
                      <motion.span
                        layoutId="cat-underline-web"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] w-4 rounded-full"
                        style={{ background: '#0b7367' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon grid */}
          <div className="px-4 min-h-[160px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                variants={staggerParent}
                className="grid grid-cols-4 gap-y-5 gap-x-2 lg:grid-cols-8"
              >
                {activeItems.map(({ label, icon: Icon, href, color }) => (
                  <motion.div key={label} variants={riseIn}>
                    <Link href={href} className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105 active:scale-95">
                      <div className="h-11 w-11 rounded-xl flex items-center justify-center"
                        style={{ background: `${color}15`, border: `1.5px solid ${color}25` }}>
                        <Icon size={22} style={{ color }} strokeWidth={1.7} />
                      </div>
                      <span className="text-[11.5px] text-center leading-tight font-medium"
                        style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Notification Banner */}
        <motion.div {...fadeUp(0.10)} className="px-4">
          <Link href="/profile/notifications"
            className="flex items-center gap-3 h-12 rounded-2xl px-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
          >
            <Bell size={17} style={{ color: '#0b7367' }} className="shrink-0" />
            <span className="text-[13.5px] flex-1 font-medium" style={{ color: 'var(--text-primary)' }}>
              {unreadCount > 0 ? `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : 'No new notifications'}
            </span>
            {unreadCount > 0 && <span className="h-2 w-2 rounded-full shrink-0" style={{ background: '#EF4444' }} />}
            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} className="shrink-0" />
          </Link>
        </motion.div>

        {/* Special Offers */}
        <motion.div {...fadeUp(0.13)}>
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-black" style={{ color: 'var(--text-primary)' }}>Special Offers</h2>
            <Link href="/activity" className="flex items-center text-[13px] font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-secondary)' }}>
              More <ChevronRight size={14} />
            </Link>
          </div>
          <div className="pl-4 flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {SPECIAL_OFFERS.map((offer, idx) => (
              <div key={idx}
                className="shrink-0 w-[280px] h-[92px] rounded-2xl flex items-center px-4 gap-3 cursor-pointer transition-transform hover:scale-[1.01]"
                style={{ background: `${offer.color}10`, border: `1.5px solid ${offer.color}25` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold" style={{ color: offer.color }}>{offer.pct}</p>
                  <p className="text-[14px] font-bold leading-tight mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>{offer.title}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{offer.sub}</p>
                </div>
                <button className="shrink-0 h-8 px-4 rounded-full text-[12px] font-bold text-white transition-all hover:scale-105"
                  style={{ background: offer.color }}>
                  {offer.cta}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Latest news (the app's home shows the same) */}
        {(isExploreLoading || exploreItems.length > 0) && (
        <motion.div {...fadeUp(0.16)}>
          <Link href="/news" className="px-4 flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-black" style={{ color: 'var(--text-primary)' }}>Latest news</h2>
            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
          </Link>
          <div className="pl-4 flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {isExploreLoading ? (
              [0, 1, 2].map(i => <div key={i} className="shrink-0 w-[150px] h-[190px] rounded-2xl animate-pulse" style={{ background: 'var(--surface-secondary)' }} />)
            ) : (
              exploreItems.map(item => (
                <Link key={item.id} href={`/news/${item.slug}`}
                  className="relative shrink-0 w-[150px] h-[190px] rounded-2xl overflow-hidden flex items-end p-3 transition-transform hover:scale-[1.02]"
                  style={{ background: 'var(--surface-secondary)' }}>
                  {item.coverImageUrl && <img src={item.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  <div className="relative flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/80">{item.category}</span>
                    <span className="text-white font-bold text-[14px] leading-tight line-clamp-3">{item.title}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>
        )}

        {/* Recent Activity */}
        <motion.section {...fadeUp(0.19)} className="px-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[17px] font-black" style={{ color: 'var(--text-primary)' }}>Recent activity</h2>
            <Link href="/activity" className="text-xs font-bold transition-opacity hover:opacity-70"
              style={{ color: '#0b7367' }}>View all →</Link>
          </div>

          {recent.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: 'var(--surface-tertiary)' }}>
                <Send size={26} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>No activity yet</p>
              <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Transfers, payments and card usage appear here.
              </p>
              <button type="button" onClick={() => navigate('/add-money')}
                className="mt-4 rounded-full px-6 py-2 text-xs font-black transition-all hover:scale-105"
                style={{ background: '#0b7367', color: '#fff' }}>
                Add money
              </button>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {recent.map((tx, i) => (
                <Link key={tx.id} href="/activity"
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: tx.type === 'credit' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}>
                    {tx.type === 'credit'
                      ? <TrendingDown size={18} style={{ color: '#10B981' }} />
                      : <TrendingUp size={18} style={{ color: '#EF4444' }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{tx.name}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{formatTimeAgo(tx.date)}</p>
                  </div>
                  <p className="ml-3 font-black text-sm flex-shrink-0"
                    style={{ color: tx.type === 'credit' ? '#10B981' : 'var(--text-primary)' }}>
                    {tx.type === 'credit' ? '+' : '−'}{formatNGN(tx.amount)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        <div className="h-6" />
      </div>

      {/* ── AI Assistant Modal ─────────────────────────────────────── */}
      {isAiOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:p-4 lg:items-center"
          onClick={() => setIsAiOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-[28px] p-4 shadow-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(11,115,103,0.12)', color: '#0b7367' }}>
                  <Bot size={20} />
                </div>
                <div>
                  <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>RCCGPay AI</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ask anything about your wallet</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsAiOpen(false)}
                className="rounded-full p-2 transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-2xl p-3" style={{ background: 'var(--surface-secondary)' }}>
              {aiMessages.map((msg, idx) => (
                <div key={`${msg.role}-${idx}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6`}
                    style={msg.role === 'user'
                      ? { background: '#0b7367', color: '#fff' }
                      : { background: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'var(--card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {aiSuggestions.map(s => (
                <button key={s} type="button" onClick={() => void handleAiSend(s)}
                  className="rounded-full px-3 py-2 text-sm font-semibold transition-colors"
                  style={{ border: '1px solid rgba(11,115,103,0.2)', background: 'rgba(11,115,103,0.08)', color: '#0b7367' }}>
                  {s}
                </button>
              ))}
            </div>

            <form onSubmit={e => { e.preventDefault(); void handleAiSend(); }} className="mt-4 flex gap-2">
              <input
                value={aiDraft}
                onChange={e => setAiDraft(e.target.value)}
                placeholder="Ask the assistant anything..."
                className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ border: '1px solid var(--border)', background: 'var(--surface-secondary)', color: 'var(--text-primary)' }}
              />
              <button type="submit" disabled={aiLoading}
                className="flex items-center justify-center rounded-2xl px-4 py-3 transition-all hover:scale-105 disabled:opacity-60"
                style={{ background: '#0b7367', color: '#fff' }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      <HomeWalletModals type={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
