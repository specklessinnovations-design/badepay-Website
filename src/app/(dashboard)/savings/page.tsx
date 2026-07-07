import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Target, Lock, TrendingUp, Plane, GraduationCap,
  Home as HomeIcon, ChevronRight, Sparkles, ShieldCheck, Loader2,
  Coins, Trash2, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { platformDataService } from '@/services/platformDataService';
import { formatNGN } from '@/utils/formatting';
import toast from 'react-hot-toast';

export default function SavingsPage() {
  const user = useAuthStore(s => s.user);
  const [pockets, setPockets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPocketName, setNewPocketName] = useState('');
  const [newPocketTarget, setNewPocketTarget] = useState('');
  const [creating, setCreating] = useState(false);

  // Manage pocket state (fund / withdraw)
  const [selectedPocket, setSelectedPocket] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'fund' | 'withdraw' | 'close' | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionPin, setActionPin] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPockets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await platformDataService.listSavings();
      setPockets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch savings pockets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pockets on mount
  useEffect(() => {
    fetchPockets();
  }, [user?.id]);

  const total = pockets.reduce((a, v) => a + Number(v.balance || 0), 0);
  const interest = pockets.reduce((a, v) => {
    const balance = Number(v.balance || 0);
    return a + (balance * 0.01); // 1% monthly interest estimate
  }, 0);

  const handleCreatePocket = async () => {
    if (!newPocketName.trim()) return;
    try {
      setCreating(true);
      await platformDataService.createSavings ( {
        name: newPocketName.trim(),
        target: newPocketTarget ? Number(newPocketTarget) : undefined,
      });
      toast.success('Savings vault created successfully!');
      setNewPocketName('');
      setNewPocketTarget('');
      setShowCreateModal(false);
      fetchPockets();
    } catch (error) {
      toast.error('Failed to create vault');
    } finally {
      setCreating(false);
    }
  };

  const handlePocketAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPocket || !actionType) return;
    if (actionType !== 'close' && (!actionAmount || Number(actionAmount) <= 0)) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!actionPin || actionPin.length < 4) {
      toast.error('Please enter your 4-digit PIN');
      return;
    }

    try {
      setActionLoading(true);
      if (actionType === 'fund') {
        await platformDataService.fundSavings(selectedPocket.id, Number(actionAmount), actionPin);
        toast.success(`Funded ₦${Number(actionAmount).toLocaleString()} to ${selectedPocket.name}`);
      } else if (actionType === 'withdraw') {
        await platformDataService.withdrawSavings(selectedPocket.id, Number(actionAmount), actionPin);
        toast.success(`Withdrew ₦${Number(actionAmount).toLocaleString()} from ${selectedPocket.name}`);
      } else if (actionType === 'close') {
        await platformDataService.closeSavings(selectedPocket.id);
        toast.success(`Vault ${selectedPocket.name} closed`);
      }
      setSelectedPocket(null);
      setActionType(null);
      setActionAmount('');
      setActionPin('');
      fetchPockets();
    } catch (error: any) {
      toast.error(error?.message || 'Transaction failed. Check your balance/PIN.');
    } finally {
      setActionLoading(false);
    }
  };

  const getIconForPocket = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('travel') || lower.includes('japa') || lower.includes('trip')) return Plane;
    if (lower.includes('home') || lower.includes('rent') || lower.includes('house')) return HomeIcon;
    if (lower.includes('school') || lower.includes('tuition') || lower.includes('education')) return GraduationCap;
    return Target;
  };

  const getColorForPocket = (index: number) => {
    const colors = [
      'from-[#EC4899]/20 to-[#EC4899]/5',
      'from-[#3B82F6]/20 to-[#3B82F6]/5',
      'from-[#F59E0B]/20 to-[#F59E0B]/5',
      'from-[#10B981]/20 to-[#10B981]/5',
      'from-[#8B5CF6]/20 to-[#8B5CF6]/5',
    ];
    return colors[index % colors.length];
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: 'easeOut' as const },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Savings</h1>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Grow your funds with secure digital vaults</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="h-10 w-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
        >
          <Plus size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Main card */}
      <motion.div {...fadeUp(0.02)} className="rounded-3xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0b7367 0%, #085f55 100%)',
          boxShadow: '0 12px 40px -10px rgba(11,115,103,0.3)',
        }}>
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="text-[11px] uppercase tracking-[0.2em] text-white/70">Total Saved Balance</div>
        <div className="mt-1 flex items-baseline gap-2 text-white">
          <span className="text-lg font-bold text-white/80">₦</span>
          <span className="font-black text-3xl tracking-tight leading-none">
            {total.toLocaleString('en-NG')}
            <span className="text-white/60 text-lg">.00</span>
          </span>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#10B981] font-semibold">
          <TrendingUp size={14} /> +{formatNGN(interest)} interest accrued this month
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {[
            { l: 'Vaults', v: String(pockets.length) },
            { l: 'Avg APR', v: '12.6%' },
            { l: 'Insured', v: '₦5M' },
          ].map(k => (
            <div key={k.l} className="rounded-2xl p-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
              <div className="text-[9.5px] uppercase tracking-[0.16em] text-white/60 font-semibold">{k.l}</div>
              <div className="mt-1 font-black text-sm text-white">{k.v}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Auto save widget */}
      <motion.div {...fadeUp(0.06)} className="rounded-2xl p-4 flex items-center justify-between gap-3"
        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(11,115,103,0.1)' }}>
            <Sparkles size={16} style={{ color: '#0b7367' }} />
          </div>
          <div>
            <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Auto-save ₦5,000 daily</div>
            <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Set & forget · cancel anytime</div>
          </div>
        </div>
        <button className="h-8 px-4 rounded-full text-xs font-bold text-white transition-all hover:scale-105"
          style={{ background: '#0b7367' }}>
          Enable
        </button>
      </motion.div>

      {/* Vault List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Your Vaults</span>
          <button onClick={() => setShowCreateModal(true)} className="text-xs font-bold" style={{ color: '#0b7367' }}>
            New Vault +
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        ) : pockets.length === 0 ? (
          <div className="text-center py-12" style={{ background: 'var(--surface-secondary)', border: '1px dashed var(--border)', borderRadius: '20px' }}>
            <Target size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>No savings vaults yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Create your first vault to start saving towards goals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pockets.map((pocket, index) => {
              const Icon = getIconForPocket(pocket.name);
              const saved = Number(pocket.balance || 0);
              const goal = pocket.target ? Number(pocket.target) : null;
              const pct = goal ? Math.round((saved / goal) * 100) : 0;
              const colorGradient = getColorForPocket(index);

              return (
                <div key={pocket.id}
                  onClick={() => { setSelectedPocket(pocket); setActionType('fund'); }}
                  className="rounded-2xl p-4 relative overflow-hidden cursor-pointer group transition-all hover:scale-[1.01]"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${colorGradient} opacity-30 pointer-events-none`} />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                          <Icon size={16} style={{ color: 'var(--text-primary)' }} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{pocket.name}</h3>
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {pocket.frequency ? `Auto-save: ${pocket.frequency}` : 'Manual savings'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-[var(--text-tertiary)] group-hover:translate-x-0.5 transition-transform" />
                    </div>

                    <div className="mt-5 flex items-baseline justify-between">
                      <span className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>
                        {formatNGN(saved)}
                      </span>
                      {goal && (
                        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                          of {formatNGN(goal)}
                        </span>
                      )}
                    </div>

                    {goal && (
                      <div className="mt-3">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: '#0b7367' }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                          <span>{pct}% funded</span>
                          <span>{Math.max(0, 100 - pct)}% to go</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Insurance info */}
      <div className="rounded-2xl p-4 flex gap-3"
        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
        <ShieldCheck size={18} style={{ color: '#0b7367' }} className="shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Vault funds are held in trust by partner banks and insured up to ₦5,000,000 under NDIC.
          Locked vaults forfeit accrued interest on early withdrawal.
        </p>
      </div>

      {/* Create Vault Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-4 lg:items-center"
            onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-5"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onClick={e => e.stopPropagation()}>
              <div>
                <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Create Savings Vault</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Set aside money towards your goals</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                    style={{ color: 'var(--text-tertiary)' }}>Vault Name</label>
                  <input
                    value={newPocketName}
                    onChange={e => setNewPocketName(e.target.value)}
                    placeholder="e.g. Vacation, Rent, Emergency"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                    style={{ color: 'var(--text-tertiary)' }}>Target Amount (Optional)</label>
                  <input
                    type="number"
                    value={newPocketTarget}
                    onChange={e => setNewPocketTarget(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-xs font-bold rounded-xl"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button onClick={handleCreatePocket} disabled={!newPocketName.trim() || creating}
                  className="flex-1 py-3 text-xs font-bold rounded-xl text-white disabled:opacity-50"
                  style={{ background: '#0b7367' }}>
                  {creating ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Create Vault'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pocket Detail/Action Modal (Fund / Withdraw / Close) */}
      <AnimatePresence>
        {selectedPocket && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-4 lg:items-center"
            onClick={() => { setSelectedPocket(null); setActionType(null); }}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-5"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              onClick={e => e.stopPropagation()}>
              
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{selectedPocket.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Current Balance: <span className="font-bold">{formatNGN(selectedPocket.balance)}</span>
                  </p>
                </div>
                <button onClick={() => { setActionType('close'); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/10">
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Action tabs */}
              {actionType !== 'close' && (
                <div className="rounded-xl p-1 flex" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                  <button onClick={() => { setActionType('fund'); setActionAmount(''); }}
                    className="flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                    style={{
                      background: actionType === 'fund' ? 'var(--card)' : 'transparent',
                      color: actionType === 'fund' ? '#0b7367' : 'var(--text-secondary)',
                      boxShadow: actionType === 'fund' ? 'var(--shadow-sm)' : 'none',
                    }}>
                    <ArrowUpRight size={13} /> Fund
                  </button>
                  <button onClick={() => { setActionType('withdraw'); setActionAmount(''); }}
                    className="flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                    style={{
                      background: actionType === 'withdraw' ? 'var(--card)' : 'transparent',
                      color: actionType === 'withdraw' ? '#0b7367' : 'var(--text-secondary)',
                      boxShadow: actionType === 'withdraw' ? 'var(--shadow-sm)' : 'none',
                    }}>
                    <ArrowDownLeft size={13} /> Withdraw
                  </button>
                </div>
              )}

              <form onSubmit={handlePocketAction} className="space-y-4">
                {actionType === 'close' ? (
                  <div className="rounded-xl p-3 border border-red-500/20 bg-red-500/5 text-xs text-red-500 leading-relaxed">
                    <strong>Warning:</strong> You are about to close this savings vault. All remaining funds of{' '}
                    <strong>{formatNGN(selectedPocket.balance)}</strong> will be returned to your main wallet balance.
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: 'var(--text-tertiary)' }}>Amount</label>
                    <input
                      type="number"
                      value={actionAmount}
                      onChange={e => setActionAmount(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                    style={{ color: 'var(--text-tertiary)' }}>Transaction PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={actionPin}
                    onChange={e => setActionPin(e.target.value)}
                    placeholder="••••"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none tracking-widest text-center text-lg"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setSelectedPocket(null); setActionType(null); }}
                    className="flex-1 py-3 text-xs font-bold rounded-xl"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={actionLoading}
                    className="flex-1 py-3 text-xs font-bold rounded-xl text-white disabled:opacity-50"
                    style={{ background: actionType === 'close' ? '#EF4444' : '#0b7367' }}>
                    {actionLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (actionType === 'close' ? 'Close Vault' : 'Confirm')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
