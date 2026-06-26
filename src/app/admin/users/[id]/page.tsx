'use client';

import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft, CreditCard, Activity, User, FileText, CheckCircle2, AlertCircle,
  Clock, Shield, Lock, Unlock, Ban, Store, Eye, EyeOff, Phone, Mail, Hash,
  Calendar, Key, Smartphone, RefreshCw, TrendingUp, Wallet,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import adminApiClient from '@/lib/adminApiClient';
import { formatCurrency } from '@/utils/formatCurrency';
import { useLocation as useWouterLocation } from 'wouter';

type Transaction = {
  id: string; reference: string; amount: number; type: string;
  category: string; status: string; createdAt: string;
  senderId?: string; recipientId?: string; description?: string;
};
type Card = {
  id: string; cardNumber: string; expiryDate: string; cvv: string;
  balance: number; isFrozen: boolean; cardType?: string;
};

const tabs = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'transactions', label: 'Transactions', icon: Activity },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'kyc', label: 'KYC', icon: CheckCircle2 },
];

function StatusBadge({ status }: { status: string }) {
  const lower = status?.toLowerCase();
  let bg = 'rgba(156,163,175,0.15)', color = '#9ca3af', Icon = Clock;
  if (['success','completed','active','verified','approved','unban'].includes(lower)) {
    bg = 'rgba(52,211,153,0.12)'; color = '#34d399'; Icon = CheckCircle2;
  } else if (['pending','processing','in_review'].includes(lower)) {
    bg = 'rgba(251,191,36,0.12)'; color = '#fbbf24'; Icon = Clock;
  } else if (['failed','rejected','inactive','suspended','banned','locked'].includes(lower)) {
    bg = 'rgba(248,113,113,0.12)'; color = '#f87171'; Icon = AlertCircle;
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: bg, color }}>
      <Icon size={11} />
      {status || 'Unknown'}
    </span>
  );
}

function InfoRow({ label, value, mono = false, highlight = false }: { label: string; value: any; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ad-muted-soft)' }}>{label}</p>
      <p
        className={`text-sm font-semibold text-right max-w-[60%] break-all ${mono ? 'font-mono' : ''}`}
        style={{ color: highlight ? '#6fe8d6' : 'var(--ad-fg-strong)' }}
      >
        {value ?? '—'}
      </p>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCvv, setShowCvv] = useState<Record<string, boolean>>({});
  const { showError, showSuccess } = useToast();
  const [, navigate] = useWouterLocation();

  const [location] = useLocation();
  const segments = location.split('/');
  const userId = segments[segments.length - 1];

  useEffect(() => {
    if (userId) loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const data = await adminApiClient.getUser(userId);
      const userData = data?.data?.user || data?.data;
      setUser(userData);
      setTransactions(data?.data?.transactions || []);
      setCards(userData?.cards || []);
    } catch (error: any) {
      showError(error.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      await adminApiClient.toggleUserActive(userId, !user.isActive);
      showSuccess(`User ${user.isActive ? 'suspended' : 'activated'} successfully`);
      await loadUserDetails();
    } catch (e: any) {
      showError(e.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleWallet = async () => {
    setActionLoading(true);
    try {
      await adminApiClient.lockWallet(userId, !user.wallet?.isLocked);
      showSuccess(`Wallet ${user.wallet?.isLocked ? 'unlocked' : 'locked'} successfully`);
      await loadUserDetails();
    } catch (e: any) {
      showError(e.message || 'Failed to update wallet');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveKyc = async () => {
    setActionLoading(true);
    try {
      await adminApiClient.updateKyc(userId, 'approved', (user.kycLevel || 0) + 1);
      showSuccess('KYC approved successfully');
      await loadUserDetails();
    } catch (e: any) {
      showError(e.message || 'Failed to update KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectKyc = async () => {
    setActionLoading(true);
    try {
      await adminApiClient.updateKyc(userId, 'rejected');
      showSuccess('KYC rejected');
      await loadUserDetails();
    } catch (e: any) {
      showError(e.message || 'Failed to update KYC');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-sm font-medium" style={{ color: 'var(--ad-muted)' }}>Loading user details…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <User className="h-16 w-16 mb-4" style={{ color: 'var(--ad-muted)' }} />
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--ad-fg-strong)' }}>User Not Found</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--ad-muted)' }}>This user doesn't exist or has been removed.</p>
        <button onClick={() => window.history.back()} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: '#6fe8d6', color: '#1a1a1a' }}>Go Back</button>
      </div>
    );
  }

  const totalSent = transactions.filter(tx => tx.senderId === user.id && tx.status === 'success').reduce((s, tx) => s + Number(tx.amount), 0);
  const totalReceived = transactions.filter(tx => tx.recipientId === user.id && tx.status === 'success').reduce((s, tx) => s + Number(tx.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center h-10 w-10 rounded-xl flex-shrink-0 transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)' }}
        >
          <ArrowLeft size={18} style={{ color: 'var(--ad-fg-strong)' }} />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black" style={{ color: 'var(--ad-fg-strong)' }}>
              {user.firstName} {user.lastName}
            </h1>
            <StatusBadge status={user.isActive ? 'Active' : 'Suspended'} />
            {user.userType === 'merchant' && (
              <span
                className="text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5"
                style={{ background: 'rgba(111,232,214,0.12)', color: '#6fe8d6', border: '1px solid rgba(111,232,214,0.25)' }}
              >
                <Store size={12} /> Has Merchant Account
              </span>
            )}
          </div>
          <p className="text-sm mt-1 flex items-center gap-3" style={{ color: 'var(--ad-muted)' }}>
            <span className="flex items-center gap-1"><Mail size={12} />{user.email}</span>
            {user.phone && <span className="flex items-center gap-1"><Phone size={12} />{user.phone}</span>}
            {user.accountNumber && (
              <span className="flex items-center gap-1 font-mono font-bold" style={{ color: '#6fe8d6' }}>
                <Hash size={12} />{user.accountNumber}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{
              background: user.isActive ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
              color: user.isActive ? '#f87171' : '#34d399',
              border: `1px solid ${user.isActive ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
            }}
          >
            {user.isActive ? <Ban size={14} /> : <CheckCircle2 size={14} />}
            {user.isActive ? 'Suspend User' : 'Activate User'}
          </button>
          <button
            onClick={handleToggleWallet}
            disabled={actionLoading || !user.wallet}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{
              background: user.wallet?.isLocked ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
              color: user.wallet?.isLocked ? '#34d399' : '#fbbf24',
              border: `1px solid ${user.wallet?.isLocked ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
            }}
          >
            {user.wallet?.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
            {user.wallet?.isLocked ? 'Unlock Wallet' : 'Lock Wallet'}
          </button>
          <button
            onClick={loadUserDetails}
            className="flex items-center justify-center h-9 w-9 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--ad-card)', border: '1px solid var(--ad-border)', color: 'var(--ad-muted)' }}
          >
            <RefreshCw size={14} />
          </button>
          {user.userType === 'merchant' && (
            <button
              onClick={() => navigate('/admin/merchants/' + userId)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(111,232,214,0.1)', color: '#6fe8d6', border: '1px solid rgba(111,232,214,0.2)' }}
            >
              <Store size={14} /> Merchant View
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Wallet Balance', value: formatCurrency(user.wallet?.balance || 0), icon: Wallet, color: '#6fe8d6' },
          { label: 'Total Transactions', value: transactions.length, icon: Activity, color: '#60a5fa' },
          { label: 'Total Sent', value: formatCurrency(totalSent), icon: TrendingUp, color: '#f87171' },
          { label: 'Total Received', value: formatCurrency(totalReceived), icon: TrendingUp, color: '#34d399' },
          { label: 'Virtual Cards', value: cards.length, icon: CreditCard, color: '#a78bfa' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl p-4 border"
              style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold" style={{ color: 'var(--ad-muted)' }}>{kpi.label}</p>
                <Icon size={16} style={{ color: kpi.color }} />
              </div>
              <p className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--ad-border)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all relative"
              style={{
                color: activeTab === tab.id ? '#6fe8d6' : 'var(--ad-muted)',
                borderBottom: activeTab === tab.id ? '2px solid #6fe8d6' : '2px solid transparent',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="rounded-xl p-6 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ad-fg-strong)' }}>
              <User size={18} style={{ color: '#6fe8d6' }} /> Personal Information
            </h3>
            <InfoRow label="First Name" value={user.firstName} />
            <InfoRow label="Last Name" value={user.lastName} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Phone" value={user.phone} />
            <InfoRow label="Account Number" value={user.accountNumber} mono highlight />
            <InfoRow label="Account Type" value={user.userType === 'merchant' ? 'Consumer + Merchant' : 'Personal/Consumer'} />
            <InfoRow label="Joined" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
            <InfoRow label="Last Login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'} />
          </div>

          {/* Wallet Info */}
          <div className="rounded-xl p-6 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ad-fg-strong)' }}>
              <Wallet size={18} style={{ color: '#6fe8d6' }} /> Wallet Details
            </h3>
            {user.wallet ? (
              <>
                <div className="rounded-xl p-5 mb-4 text-center" style={{ background: 'rgba(111,232,214,0.06)', border: '1px solid rgba(111,232,214,0.15)' }}>
                  <p className="text-4xl font-black" style={{ color: '#6fe8d6' }}>{formatCurrency(user.wallet.balance || 0)}</p>
                  <p className="text-xs font-bold mt-1" style={{ color: 'var(--ad-muted)' }}>Available Balance</p>
                </div>
                <InfoRow label="Currency" value={user.wallet.currency || 'NGN'} />
                <InfoRow label="Wallet Status" value={user.wallet.isLocked ? 'Locked 🔒' : 'Active ✅'} />
              </>
            ) : (
              <div className="text-center py-12" style={{ color: 'var(--ad-muted)' }}>
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No wallet linked yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Transactions */}
      {activeTab === 'transactions' && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
          <div className="p-5 border-b" style={{ borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black" style={{ color: 'var(--ad-fg-strong)' }}>All Transactions</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--ad-muted)' }}>{transactions.length} total transactions for this user</p>
          </div>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <tr>
                    {['Reference', 'Type', 'Amount', 'Status', 'Date'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--ad-muted-soft)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-t hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-bold" style={{ color: '#6fe8d6' }}>{tx.reference || tx.id.substring(0, 12)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold capitalize px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ad-muted)' }}>
                          {tx.type?.replace('_', ' ') || tx.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm font-black`} style={{ color: tx.senderId === user.id ? '#f87171' : '#34d399' }}>
                          {tx.senderId === user.id ? '-' : '+'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={tx.status} /></td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--ad-muted)' }}>
                        {new Date(tx.createdAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16" style={{ color: 'var(--ad-muted)' }}>
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No transactions yet</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Cards */}
      {activeTab === 'cards' && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
          <div className="p-5 border-b" style={{ borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black" style={{ color: 'var(--ad-fg-strong)' }}>Virtual Cards</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--ad-muted)' }}>{cards.length} card{cards.length !== 1 ? 's' : ''} linked to this user</p>
          </div>
          {cards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="relative rounded-2xl p-6 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #1a2e1a 0%, #0d1f17 100%)',
                    border: '1px solid rgba(111,232,214,0.2)',
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: '#6fe8d6', filter: 'blur(40px)' }} />
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-xs font-bold mb-1" style={{ color: 'rgba(111,232,214,0.7)' }}>BADEPAY VIRTUAL</p>
                      <StatusBadge status={card.isFrozen ? 'Frozen' : 'Active'} />
                    </div>
                    <CreditCard size={28} style={{ color: '#6fe8d6', opacity: 0.7 }} />
                  </div>
                  <p className="font-mono text-xl font-bold tracking-widest mb-4" style={{ color: '#fff' }}>
                    {card.cardNumber || '•••• •••• •••• ••••'}
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Expires</p>
                      <p className="text-sm font-bold" style={{ color: '#fff' }}>{card.expiryDate || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        CVV
                        <button onClick={() => setShowCvv(p => ({ ...p, [card.id]: !p[card.id] }))}>
                          {showCvv[card.id] ? <EyeOff size={10} /> : <Eye size={10} />}
                        </button>
                      </p>
                      <p className="text-sm font-bold font-mono" style={{ color: '#fff' }}>
                        {showCvv[card.id] ? (card.cvv || '—') : '•••'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Balance</p>
                      <p className="text-sm font-bold" style={{ color: '#6fe8d6' }}>{formatCurrency(card.balance || 0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16" style={{ color: 'var(--ad-muted)' }}>
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No virtual cards</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl p-6 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ad-fg-strong)' }}>
              <Shield size={18} style={{ color: '#6fe8d6' }} /> Security Settings
            </h3>
            <InfoRow
              label="Transaction PIN"
              value={user.hasTransactionPin ? '✅ Set (encrypted)' : '❌ Not Set'}
            />
            <InfoRow
              label="Two-Factor Auth"
              value={user.twoFactorActive ? '✅ Enabled' : '❌ Disabled'}
            />
            <InfoRow
              label="Password"
              value={user.hasPassword ? '✅ Set (encrypted)' : '❌ Not Set'}
            />
            <InfoRow
              label="PIN Requirement"
              value={user.pinRequirement ? user.pinRequirement.replace('_', ' ') : '—'}
            />
            <InfoRow
              label="Linked Devices"
              value={user.deviceIds?.length || 0}
            />
            <InfoRow
              label="Account Status"
              value={user.isActive ? 'Active' : 'Suspended'}
            />
            <InfoRow
              label="Wallet Status"
              value={user.wallet?.isLocked ? 'Locked' : 'Unlocked'}
            />
            <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-bold" style={{ color: 'var(--ad-muted-soft)' }}>Note</p>
              <p className="text-xs mt-1" style={{ color: 'var(--ad-muted)' }}>
                Passwords and transaction PINs are stored encrypted and cannot be viewed. Status shows whether each credential has been configured.
              </p>
            </div>
          </div>
          <div className="rounded-xl p-6 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ad-fg-strong)' }}>
              <Key size={18} style={{ color: '#6fe8d6' }} /> Admin Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{
                  background: user.isActive ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
                  color: user.isActive ? '#f87171' : '#34d399',
                  border: `1px solid ${user.isActive ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
                }}
              >
                {user.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                {user.isActive ? 'Suspend Account' : 'Activate Account'}
              </button>
              <button
                onClick={handleToggleWallet}
                disabled={actionLoading || !user.wallet}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{
                  background: user.wallet?.isLocked ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.08)',
                  color: user.wallet?.isLocked ? '#34d399' : '#fbbf24',
                  border: `1px solid ${user.wallet?.isLocked ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
                }}
              >
                {user.wallet?.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                {user.wallet?.isLocked ? 'Unlock Wallet' : 'Lock Wallet'}
              </button>
            </div>
            <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-bold" style={{ color: 'var(--ad-muted-soft)' }}>Note</p>
              <p className="text-xs mt-1" style={{ color: 'var(--ad-muted)' }}>
                Suspending blocks login. Locking wallet blocks all transactions but keeps account accessible.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: KYC */}
      {activeTab === 'kyc' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl p-6 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ad-fg-strong)' }}>
              <CheckCircle2 size={18} style={{ color: '#6fe8d6' }} /> KYC Status
            </h3>
            <InfoRow label="KYC Level" value={`Level ${user.kycLevel || 0}`} highlight />
            <InfoRow label="KYC Status" value={user.kycStatus || 'unverified'} />
            <InfoRow label="BVN Verified" value={user.bvnVerified ? '✅ Yes' : '❌ No'} />
            <InfoRow label="NIN Verified" value={user.ninVerified ? '✅ Yes' : '❌ No'} />
          </div>
          <div className="rounded-xl p-6 border" style={{ background: 'var(--ad-card)', borderColor: 'var(--ad-border)' }}>
            <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ad-fg-strong)' }}>
              <Key size={18} style={{ color: '#6fe8d6' }} /> KYC Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleApproveKyc}
                disabled={actionLoading || user.kycStatus === 'approved'}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
              >
                <CheckCircle2 size={16} /> Approve KYC (Advance Level)
              </button>
              <button
                onClick={handleRejectKyc}
                disabled={actionLoading || user.kycStatus === 'rejected'}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
              >
                <AlertCircle size={16} /> Reject KYC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
