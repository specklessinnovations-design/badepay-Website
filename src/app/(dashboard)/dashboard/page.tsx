import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import {
  Plus, Send, ArrowLeftRight, QrCode, Landmark,
  Smartphone, Wifi, Zap, Tv, ChevronRight,
  TrendingUp, TrendingDown, Eye, EyeOff, ShieldCheck,
  Store, RefreshCw, Bell,
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

  return (
    <div className="space-y-5 lg:space-y-6">

      {/* ── Greeting row ── */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between pt-1 lg:pt-0">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>{getGreeting()}</p>
          <h1 className="text-2xl lg:text-3xl font-black mt-0.5 tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {formatDisplayName(user.firstName)} 👋
          </h1>
        </div>
        <div className="flex items-center gap-3">
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
            Tier {user.kycLevel}
          </div>
        </div>
      </motion.div>

      {/* ── Balance card ── */}
      <motion.div {...fadeUp(0.07)}
        className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: 'linear-gradient(145deg,#0e0e16 0%,#141420 50%,#0a0a12 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full opacity-50"
          style={{ background: 'radial-gradient(circle,rgba(111,232,214,0.2) 0%,transparent 70%)' }} />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-40 w-40 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle,rgba(111,232,214,0.15) 0%,transparent 70%)' }} />
        {/* Grid texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] mb-2" style={{ color: 'rgba(111,232,214,0.6)' }}>
            Available balance
          </p>

          <div className="flex items-center gap-3">
            <p className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: '#ffffff' }}>
              {showBalance ? formatNGN(walletBalance) : '₦ ••••••'}
            </p>
            <div className="flex items-center gap-2">
              <motion.button type="button" whileTap={{ scale: 0.9 }}
                onClick={handleRecalculateBalance}
                disabled={isRecalculating}
                className="rounded-full p-2 transition-colors disabled:opacity-50"
                style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)' }}
                title="Recalculate balance">
                <RefreshCw size={17} className={isRecalculating ? 'animate-spin' : ''} />
              </motion.button>
              <motion.button type="button" whileTap={{ scale: 0.9 }}
                onClick={() => setShowBalance(v => !v)}
                className="rounded-full p-2 transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)' }}>
                {showBalance ? <EyeOff size={17} /> : <Eye size={17} />}
              </motion.button>
            </div>
          </div>

          <p className="mt-1.5 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {accountDisplay || '—'} · BadePay
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              {monthlyChange >= 0
                ? <TrendingUp size={13} style={{ color: '#10B981' }} />
                : <TrendingDown size={13} style={{ color: '#EF4444' }} />}
              <span className="text-xs font-bold" style={{ color: monthlyChange >= 0 ? '#10B981' : '#EF4444' }}>
                {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(1)}% this month
              </span>
            </div>

            <Link href="/add-money"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition-all active:scale-95"
              style={{ background: '#6fe8d6', color: '#1a1a1a', boxShadow: '0 2px 16px rgba(111,232,214,0.4)' }}>
              <Plus size={12} /> Add money
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Quick actions ── */}
      <motion.section {...fadeUp(0.13)}>
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3 lg:grid-cols-5">
          {QUICK_ACTIONS.map(({ id, label, icon: Icon, href }) => (
            <motion.button
              key={id}
              type="button"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleQuickAction(id, href)}
              className={`flex flex-col items-center gap-2.5 rounded-2xl p-3 transition-colors${id === 'scan' ? ' hidden lg:flex' : ''}`}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl accent-icon-wrap transition-all duration-300">
                <Icon size={20} style={{ color: 'var(--accent-text)' }} />
              </div>
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ── KYC banner ── */}
      {user.kycLevel < 2 && kyc.nextBenefit && (
        <motion.div {...fadeUp(0.17)}>
          <Link href="/profile/kyc"
            className="surface-card flex items-center justify-between p-4 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              border: '1px solid var(--accent-border)',
              background: 'linear-gradient(to right, var(--accent-bg), transparent)',
            }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl accent-icon-wrap">
                <ShieldCheck size={20} style={{ color: 'var(--accent-text)' }} />
              </div>
              <div>
                <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Complete Tier 2 verification</p>
                <p className="mt-0.5 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{kyc.nextBenefit}</p>
              </div>
            </div>
            <ChevronRight size={20} className="shrink-0" style={{ color: 'var(--accent-text)' }} />
          </Link>
        </motion.div>
      )}

      {/* ── Pay & top up ── */}
      <motion.section {...fadeUp(0.2)}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>Pay & top up</h2>
          <Link href="/bills" className="text-xs font-bold transition-colors hover:opacity-80"
            style={{ color: 'var(--accent-text)' }}>See all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PAY_TOP_UP.map(({ label, icon: Icon, href }, i) => (
            <motion.div key={label} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link href={href}
                className="surface-card flex flex-col items-center gap-2.5 p-4 transition-all duration-300 group">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl accent-icon-wrap transition-all duration-300 group-hover:scale-110">
                  <Icon size={22} style={{ color: 'var(--accent-text)' }} />
                </div>
                <span className="text-xs font-bold text-center" style={{ color: 'var(--text-primary)' }}>{label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

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

      <HomeWalletModals type={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
