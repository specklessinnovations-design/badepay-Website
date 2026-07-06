import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import {
  Plus, Send, ArrowLeftRight, QrCode, Landmark,
  Smartphone, Wifi, Zap, Tv, ChevronRight,
  TrendingUp, TrendingDown, Eye, EyeOff, ShieldCheck,
  Store, RefreshCw, Bell, Sparkles, Bot, X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useWalletStore } from '@/store/useWalletStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { formatNGN, formatTimeAgo } from '@/utils/formatting';
import {
  getGreeting, formatAccountDisplay, computeMonthlyChange,
  getKycTierInfo, formatDisplayName,
} from '@/lib/personalHelpers';
import { HomeWalletModals, type HomeModalType } from '@/components/dashboard/HomeWalletModals';
import walletService from '@/services/walletService';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';

type QuickActionId = 'add' | 'transfer' | 'scan' | 'bills' | 'stores';

const QUICK_ACTIONS: { id: QuickActionId; label: string; icon: React.ElementType; href?: string }[] = [
  { id: 'add',      label: 'Add',      icon: Plus },
  { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
  { id: 'scan',     label: 'Scan',     icon: QrCode, href: '/scan' },
  { id: 'bills',    label: 'Bills',    icon: Landmark, href: '/bills' },
  { id: 'stores',   label: 'Stores',   icon: Store,    href: '/stores' },
];

const PAY_TOP_UP = [
  { label: 'Airtime',     icon: Smartphone, href: '/bills?type=airtime' },
  { label: 'Data',        icon: Wifi,        href: '/bills?type=data' },
  { label: 'Electricity', icon: Zap,         href: '/bills?type=electricity' },
  { label: 'Cable TV',    icon: Tv,          href: '/bills?type=cable' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: "easeOut" as const },
});

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

export default function DashboardHome() {
  const [, navigate] = useLocation();
  const user = useAuthStore(s => s.user);
  const syncUserFromStorage = useAuthStore(s => s.syncUserFromStorage);
  const transactions = useTransactionStore(s => s.transactions);
  const fetchTransactions = useTransactionStore(s => s.fetchTransactions);
  const refreshBalance = useWalletStore(s => s.refreshBalance);
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const recent = useMemo(() => transactions.slice(0, 4), [transactions]);
  const [showBalance, setShowBalance] = useState(true);
  const [activeModal, setActiveModal] = useState<HomeModalType | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(user?.balance || 0);
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

  const monthlyChange = computeMonthlyChange(transactions);
  const kyc = getKycTierInfo(user.kycLevel);
  const accountDisplay = formatAccountDisplay(user.accountNumber);

  const handleRecalculateBalance = async () => {
    if (!user) return;
    setIsRecalculating(true);
    try {
      const resp = await walletService.recalculateBalance();
      toast.success(`Balance recalculated! New: ₦${resp.balance.toLocaleString()}`);
      const freshBalance = await walletService.getBalance();
      setWalletBalance(freshBalance.balance);
      syncUserFromStorage();
    } catch (error: any) {
      toast.error(`Failed to recalculate balance: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleQuickAction = (id: QuickActionId, href?: string) => {
    if (href) { navigate(href); return; }
    if (id === 'add') navigate('/add-money');
    else if (id === 'transfer') navigate('/transfer');
  };

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

  return (
    <div className="space-y-5 lg:space-y-6">

      {/* ── Advert Banner ── */}
      <motion.div {...fadeUp(0)}>
        <div className="w-full h-32 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 border border-border flex items-center justify-center">
          <div className="text-center">
            <p className="text-[14px] font-bold text-primary">Ad Space</p>
            <p className="text-[12px] text-muted-foreground">Your ad here</p>
          </div>
        </div>
      </motion.div>

      {/* Switch to Merchant if applicable */}
      {user?.merchantProfile && (
        <motion.div {...fadeUp(0)}>
          <Link href="/merchant"
            className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
            style={{
              border: '1px solid var(--accent-border)',
              background: 'linear-gradient(to right, var(--accent-bg), transparent)',
            }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl accent-icon-wrap">
                <Store size={20} style={{ color: 'var(--accent-text)' }} />
              </div>
              <div>
                <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Switch to Merchant Dashboard</p>
                <p className="mt-0.5 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Manage your business</p>
              </div>
            </div>
            <ChevronRight size={20} className="shrink-0" style={{ color: 'var(--accent-text)' }} />
          </Link>
        </motion.div>
      )}

      {/* ── Greeting row with AI and Location ── */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between pt-1 lg:pt-0">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>{getGreeting()}</p>
          <h1 className="text-2xl lg:text-3xl font-black mt-0.5 tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {formatDisplayName(user.firstName)} 👋
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* AI Button */}
          <button
            type="button"
            onClick={() => setIsAiOpen(true)}
            className="h-9 w-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'var(--primary)', border: '1px solid var(--border)' }}
            aria-label="Open AI assistant"
          >
            <Sparkles size={16} style={{ color: 'var(--primary-foreground)' }} />
          </button>
          <Link href="/profile/notifications" className="relative h-9 w-9 rounded-full flex items-center justify-center transition-colors" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
            <Bell size={16} style={{ color: 'var(--text-secondary)' }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#EF4444' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' }}>
            <ShieldCheck size={13} style={{ color: 'var(--accent-text)' }} />
            Tier {user.kycLevel || 1}
          </div>
        </div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div {...fadeUp(0.07)} className="grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ id, label, icon: Icon, href }) => (
          <button
            key={id}
            onClick={() => handleQuickAction(id, href)}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
          >
            <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <Icon size={24} style={{ color: 'var(--primary-foreground)' }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</span>
          </button>
        ))}
      </motion.div>

      {/* ── Services Grid ── */}
      <motion.div {...fadeUp(0.14)}>
        <div className="grid grid-cols-4 gap-3">
          {PAY_TOP_UP.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)/10' }}>
                <Icon size={20} style={{ color: 'var(--primary)' }} />
              </div>
              <span className="text-xs font-medium text-center" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Notifications Strip ── */}
      <motion.div {...fadeUp(0.21)}>
        <Link href="/profile/notifications" className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.01]" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
          <Bell size={20} style={{ color: 'var(--primary)' }} />
          <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>View all notifications</span>
          {unreadCount > 0 && (
            <span className="h-2 w-2 rounded-full" style={{ background: '#EF4444' }} />
          )}
          <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
        </Link>
      </motion.div>

      {/* ── Recent activity ── */}
      <motion.section {...fadeUp(0.25)}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>Recent activity</h2>
          <Link href="/activity" className="text-xs font-bold transition-colors hover:opacity-80"
            style={{ color: 'var(--accent-text)' }}>View all →</Link>
        </div>

        {recent.length === 0 ? (
          <div className="surface-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'var(--surface-secondary)' }}>
              <ArrowLeftRight size={26} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>No activity yet</p>
            <p className="mt-1.5 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              Transfers, payments and card usage appear here.
            </p>
            <button type="button" onClick={() => navigate('/add-money')}
              className="mt-4 rounded-full px-6 py-2 text-xs font-black transition-all duration-300 hover:scale-105"
              style={{ background: '#6fe8d6', color: '#1a1a1a', boxShadow: 'var(--shadow-glow)' }}>
              Add money
            </button>
          </div>
        ) : (
          <div className="surface-card overflow-hidden divide-y" style={{ borderColor: 'var(--border)' }}>
            {recent.map((tx) => (
              <Link key={tx.id} href="/activity"
                className="flex items-center gap-3 px-4 py-3.5 transition-colors"
                style={{}}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: tx.type === 'credit' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}>
                  {tx.type === 'credit'
                    ? <TrendingDown size={18} style={{ color: '#10B981' }} />
                    : <TrendingUp size={18} style={{ color: '#EF4444' }} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-sm" style={{ color: 'var(--text-primary)' }}>{tx.name}</p>
                  <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{formatTimeAgo(tx.date)}</p>
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

      {isAiOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:p-4 lg:items-center"
          onClick={() => setIsAiOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[var(--surface)] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
                  <Bot size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--text-primary)]">BadePay AI</p>
                  <p className="text-xs text-[var(--text-secondary)]">Ask anything about your wallet</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsAiOpen(false)} className="rounded-full border border-white/10 p-2 text-[var(--text-secondary)]">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-2xl bg-black/10 p-3">
              {aiMessages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-[var(--primary)] text-[#07110f]' : 'bg-white/10 text-[var(--text-primary)]'}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-[var(--text-secondary)]">Thinking...</div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {aiSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void handleAiSend(suggestion)}
                  className="rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3 py-2 text-sm font-semibold text-[var(--primary)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleAiSend();
              }}
              className="mt-4 flex gap-2"
            >
              <input
                value={aiDraft}
                onChange={(event) => setAiDraft(event.target.value)}
                placeholder="Ask the assistant anything..."
                className="flex-1 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
              />
              <button type="submit" disabled={aiLoading} className="flex items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-3 text-[var(--primary-foreground)] disabled:opacity-60">
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
