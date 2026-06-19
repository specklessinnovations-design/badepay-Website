import React, { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, CreditCard, Snowflake, Eye, Shield, SlidersHorizontal,
  KeyRound, Wallet, Zap, ChevronRight, Lock, Unlock,
} from 'lucide-react';
import { useCardStore, type VirtualCard } from '@/store/useCardStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CardModals, type CardModalType } from '@/components/dashboard/CardModals';
import { formatNGN } from '@/utils/formatting';
import { ResponsivePageHeader } from '@/components/ui/responsive-page-header';
import { bpToast } from '@/lib/bpToast';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: "easeOut" as const } }),
};

export default function CardsPage() {
  const cards = useCardStore((s) => s.cards);
  const createCard = useCardStore((s) => s.createCard);
  const toggleFreeze = useCardStore((s) => s.toggleFreeze);
  const fundCard = useCardStore((s) => s.fundCard);
  const setSpendingLimit = useCardStore((s) => s.setSpendingLimit);
  const setCardPin = useCardStore((s) => s.setCardPin);
  const updateChannels = useCardStore((s) => s.updateChannels);
  const kycLevel = useAuthStore((s) => s.user?.kycLevel ?? 0);

  const [showCreate, setShowCreate] = useState(false);
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<CardModalType>(null);

  const activeCount = useMemo(() => cards.filter((c) => c.status === 'active').length, [cards]);
  const selectedCard = useMemo(() => cards.find((c) => c.id === selectedId) ?? cards[0] ?? null, [cards, selectedId]);
  const ngnBalance = useMemo(() => cards.filter((c) => c.currency === 'NGN').reduce((s, c) => s + c.balance, 0), [cards]);
  const usdBalance = useMemo(() => cards.filter((c) => c.currency === 'USD').reduce((s, c) => s + c.balance, 0), [cards]);
  const spendingUsed = selectedCard?.spendingUsed ?? 0;
  const spendingLimit = selectedCard?.spendingLimit ?? 0;

  const handleCreate = () => {
    if (kycLevel < 2) {
      bpToast.error('Complete Tier 2 verification to get a virtual card');
      setShowCreate(false);
      return;
    }
    const card = createCard(currency);
    setSelectedId(card.id);
    bpToast.success(`${currency} virtual card created`);
    setShowCreate(false);
  };

  const openModal = (type: CardModalType) => {
    if (!selectedCard) { bpToast.error('Create or select a card first'); return; }
    setModal(type);
  };

  return (
    <div className="space-y-6">
      <ResponsivePageHeader
        title="Your cards"
        description={`${activeCount} active`}
        action={
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            type="button" onClick={() => setShowCreate(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#6fe8d6] px-4 py-2 text-sm font-semibold text-[#1a1a1a] sm:w-auto shadow-[0_4px_20px_rgba(111,232,214,0.3)]">
            <Plus size={16} /> New card
          </motion.button>
        }
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-8">
        {/* Left — card list */}
        <div className="space-y-4">
          {cards.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(111,232,214,0.08)', border: '1px solid rgba(111,232,214,0.15)' }}>
                <CreditCard size={28} style={{ color: '#6fe8d6' }} />
              </motion.div>
              <p className="font-semibold text-[var(--text-primary)]">No virtual cards yet</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Get a dynamic NGN or USD virtual card to make payments anywhere.</p>
              {kycLevel < 2 ? (
                <Link href="/profile/kyc" className="mt-5 inline-block rounded-full bg-[#6fe8d6] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a]">
                  Complete Tier 2 verification
                </Link>
              ) : (
                <button type="button" onClick={() => setShowCreate(true)}
                  className="mt-5 rounded-full bg-[#6fe8d6] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a]">
                  Get a card
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3">
              {cards.map((card, i) => (
                <CardTile key={card.id} card={card} index={i}
                  selected={selectedCard?.id === card.id}
                  onSelect={() => setSelectedId(card.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Right — details + controls */}
        <div className="mt-6 space-y-5 lg:mt-0">

          {/* Balance summary */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg, rgba(111,232,214,0.08) 0%, var(--card) 60%)', border: '1px solid rgba(111,232,214,0.18)' }}>
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(111,232,214,0.6) 0%, transparent 70%)' }} />
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Card balances</p>
            <motion.p className="text-3xl font-black text-[var(--text-primary)]"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              {formatNGN(ngnBalance)}
            </motion.p>
            {usdBalance > 0 && (
              <p className="mt-1 text-base text-[var(--text-secondary)]">${usdBalance.toFixed(2)} <span className="text-xs text-[var(--text-tertiary)]">USD</span></p>
            )}
            {selectedCard && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-1.5">
                  <span>Monthly spend</span>
                  <span>{selectedCard.currency === 'NGN' ? `${formatNGN(spendingUsed)} / ${formatNGN(spendingLimit)}` : `$${spendingUsed} / $${spendingLimit}`}</span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
                  <motion.div className="h-full rounded-full bg-[#6fe8d6]"
                    initial={{ width: 0 }}
                    animate={{ width: spendingLimit > 0 ? `${Math.min((spendingUsed / spendingLimit) * 100, 100)}%` : '0%' }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }} />
                </div>
              </div>
            )}
            {selectedCard && (
              <motion.button whileHover={{ x: 3 }} type="button" onClick={() => openModal('fund')}
                className="mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: '#6fe8d6' }}>
                <Wallet size={15} /> Fund selected card
                <ChevronRight size={14} />
              </motion.button>
            )}
          </motion.div>

          {/* Controls */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
            <p className="mb-3 text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Card controls</p>
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              {[
                {
                  icon: selectedCard?.status === 'frozen' ? Unlock : Snowflake,
                  title: selectedCard?.status === 'frozen' ? 'Unfreeze card' : 'Freeze card',
                  desc: selectedCard?.status === 'frozen' ? 'Resume transactions on this card' : 'Pauses all transactions instantly',
                  color: selectedCard?.status === 'frozen' ? '#10B981' : '#6fe8d6',
                  action: () => {
                    if (!selectedCard) return;
                    toggleFreeze(selectedCard.id);
                    bpToast.success(selectedCard.status === 'active' ? 'Card frozen ❄️' : 'Card unfrozen ✅');
                  },
                },
                { icon: Eye, title: 'Show card details', desc: 'PAN, CVV and expiry', color: '#6fe8d6', action: () => openModal('details') },
                { icon: SlidersHorizontal, title: 'Spending controls', desc: 'Limits, channels and merchants', color: '#6fe8d6', action: () => openModal('spending') },
                { icon: KeyRound, title: 'Reset card PIN', desc: '4-digit ATM PIN', color: '#6fe8d6', action: () => openModal('pin') },
              ].map((row, i) => (
                <ControlRow key={row.title} icon={row.icon} title={row.title} description={row.desc}
                  accentColor={row.color} disabled={!selectedCard} index={i} onClick={row.action} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 sm:items-center"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: 'rgba(111,232,214,0.1)', border: '1px solid rgba(111,232,214,0.2)' }}>
                <CreditCard size={22} style={{ color: '#6fe8d6' }} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">New virtual card</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Choose a currency for your card</p>
              {kycLevel < 2 && (
                <div className="mt-3 rounded-xl p-3 text-xs text-[#F59E0B]" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  ⚠️ Tier 2 verification required for virtual cards.
                </div>
              )}
              <div className="mt-4 flex gap-3">
                {(['NGN', 'USD'] as const).map((c) => (
                  <motion.button key={c} whileTap={{ scale: 0.97 }} type="button" onClick={() => setCurrency(c)}
                    className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${currency === c
                      ? 'bg-[#6fe8d6] text-[#1a1a1a] shadow-[0_4px_16px_rgba(111,232,214,0.25)]'
                      : 'border border-[var(--border)] text-[var(--text-secondary)]'}`}>
                    {c}
                  </motion.button>
                ))}
              </div>
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-secondary)]">
                  Cancel
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={handleCreate}
                  className="flex-1 rounded-xl bg-[#6fe8d6] py-3 text-sm font-bold text-[#1a1a1a]">
                  Create card
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CardModals
        card={selectedCard} type={modal} onClose={() => setModal(null)}
        onFund={(amount) => {
          if (!selectedCard) return;
          const ok = fundCard(selectedCard.id, amount);
          if (ok) bpToast.success('Card funded successfully');
          else bpToast.error('Could not fund card — check balance or card status');
        }}
        onSetLimit={(limit) => selectedCard && setSpendingLimit(selectedCard.id, limit)}
        onSetPin={(pin) => selectedCard && setCardPin(selectedCard.id, pin)}
        onUpdateChannels={(channels) => selectedCard && updateChannels(selectedCard.id, channels)}
      />
    </div>
  );
}

function CardTile({ card, selected, onSelect, index }: { card: VirtualCard; selected: boolean; onSelect: () => void; index: number }) {
  const balanceLabel = card.currency === 'NGN' ? formatNGN(card.balance) : `$${card.balance.toFixed(2)}`;
  const isFrozen = card.status === 'frozen';

  return (
    <motion.button type="button" onClick={onSelect}
      custom={index} variants={fadeUp} initial="hidden" animate="show"
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left">
      {/* Physical card design */}
      <div className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300"
        style={{
          background: isFrozen
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
            : selected
              ? 'linear-gradient(135deg, #0d2b2b 0%, #0a1f1f 50%, #061616 100%)'
              : 'linear-gradient(135deg, #1a1a1a 0%, #111111 50%, #0d0d0d 100%)',
          border: selected ? '1.5px solid rgba(111,232,214,0.5)' : '1px solid rgba(255,255,255,0.07)',
          boxShadow: selected ? '0 8px 32px rgba(111,232,214,0.12)' : '0 4px 16px rgba(0,0,0,0.3)',
        }}>
        {/* Background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(111,232,214,0.4) 0%, transparent 50%)' }} />

        {/* Top row */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              {card.currency} Virtual Card
            </p>
            {isFrozen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-[10px] font-bold text-blue-400">
                <Snowflake size={10} /> Frozen
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {card.pin && <Shield size={12} className="text-white/30" />}
            <div className="h-6 w-9 rounded-sm opacity-90"
              style={{ background: 'linear-gradient(135deg, #f5a623 0%, #f5d623 100%)' }} />
          </div>
        </div>

        {/* Card number */}
        <p className="font-mono text-xl font-bold tracking-[0.2em] text-white/90 mb-4">
          •••• •••• •••• {card.last4}
        </p>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Expires</p>
            <p className="text-sm font-bold text-white/70">{card.expiryMonth}/{card.expiryYear}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Balance</p>
            <p className="text-sm font-black" style={{ color: '#6fe8d6' }}>{balanceLabel}</p>
          </div>
        </div>

        {/* Status glow */}
        {selected && !isFrozen && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(111,232,214,0.6), transparent)' }} />
        )}
      </div>
    </motion.button>
  );
}

function ControlRow({ icon: Icon, title, description, onClick, disabled, accentColor, index }: {
  icon: React.ElementType; title: string; description: string;
  onClick: () => void; disabled?: boolean; accentColor?: string; index: number;
}) {
  return (
    <motion.button type="button" onClick={onClick} disabled={disabled}
      whileHover={!disabled ? { x: 3, backgroundColor: 'rgba(111,232,214,0.03)' } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 + 0.2 }}
      className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors disabled:opacity-35 border-b border-[var(--border)] last:border-0">
      <motion.div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `rgba(111,232,214,0.07)`, border: `1px solid rgba(111,232,214,0.12)` }}
        whileHover={!disabled ? { scale: 1.08 } : {}}>
        <Icon size={18} style={{ color: accentColor ?? 'var(--accent-text)' }} />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />
    </motion.button>
  );
}
