import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Smartphone, Wifi, Zap, Tv, Receipt, Wallet, Globe,
  ChevronRight, Car, Plane, Train, Building2, CloudSun,
  UtensilsCrossed, ShoppingBag, Package, ShoppingCart,
  HeartPulse, Landmark, Coins, LayoutGrid, TrendingUp,
  TrendingDown, Minus, CheckCircle2, AlertTriangle, Clock,
  Copy, Check, Droplets, Wind, Eye, RefreshCw, ExternalLink,
  Shield, CreditCard, ChevronDown
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { formatNGN } from '@/utils/formatting';
import { PremiumModal } from '@/components/ui/premium-modal';
import { TransactionPinModal } from '@/components/auth/TransactionPinModal';
import billsService from '@/services/billsService';
import toast from 'react-hot-toast';

// ─── static data matching app ──────────────────────────────────
const EXCHANGE_RATES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', buy: 1585.2, sell: 1592.8, change: +0.4 },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', buy: 2012.5, sell: 2025.0, change: -0.2 },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', buy: 1728.0, sell: 1738.5, change: +0.1 },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', buy: 218.4, sell: 221.0, change: 0 },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', buy: 1165.0, sell: 1172.0, change: +0.3 },
];

const WEATHER_DATA = [
  { city: 'Lagos', temp: 31, condition: 'Partly Cloudy', humidity: 78, wind: 14, icon: '⛅' },
  { city: 'Abuja', temp: 28, condition: 'Sunny', humidity: 55, wind: 8, icon: '☀️' },
  { city: 'Port Harcourt', temp: 30, condition: 'Light Rain', humidity: 82, wind: 18, icon: '🌧️' },
  { city: 'Kano', temp: 35, condition: 'Hot & Dry', humidity: 40, wind: 10, icon: '🌤️' },
  { city: 'Ibadan', temp: 29, condition: 'Partly Cloudy', humidity: 70, wind: 12, icon: '⛅' },
];

const TRAIN_ROUTES = [
  { route: 'Lagos → Ibadan', duration: '2h', price: 5000 },
  { route: 'Lagos → Abeokuta', duration: '1.5h', price: 3500 },
  { route: 'Abuja → Kaduna', duration: '2h 15m', price: 4500 },
  { route: 'Kano → Kaduna', duration: '3h', price: 5500 },
];

const BETTING_COMPANIES = [
  'Bet9ja', 'SportyBet', '1xBet', 'BetKing', 'Betway', 'MSport',
  '22Bet', 'Melbet', 'Betano', 'NairaBET', 'Merrybet', 'AccessBET',
  'Surebet247', 'NaijaBet', 'ZEbet', 'BangBet', 'Cloudbet', 'Helabet',
  'BoosterBET', 'Paripesa'
];

type ModalKey =
  | 'airtime' | 'data' | 'betting' | 'uber' | 'electricity' | 'exchange'
  | 'tax' | 'more'
  | 'badetrip' | 'bolt' | 'lagride' | 'train' | 'hotels' | 'weather' | 'esim'
  | 'glovo' | 'kfc' | 'mano' | 'ubereats'
  | 'marketplace'
  | 'healthcare' | 'tax-refund' | 'cable' | 'internet' | 'hmo'
  | 'success' | null;

type ServiceItem = {
  icon: React.ElementType;
  label: string;
  sub: string;
  color: string;
  modal: ModalKey;
  marketplaceLabel?: string;
};

const CATEGORIES: { key: string; label: string; emoji: string; items: ServiceItem[] }[] = [
  {
    key: 'regular',
    label: 'Regular',
    emoji: '🔄',
    items: [
      { icon: Smartphone, label: 'Airtime', sub: 'MTN · Glo · Airtel', color: '#3B82F6', modal: 'airtime' },
      { icon: Wifi, label: 'Data', sub: 'All networks', color: '#14B8A6', modal: 'data' },
      { icon: Wallet, label: 'Betting Wallets', sub: 'Bet9ja · Sporty', color: '#7C6CF0', modal: 'betting' },
      { icon: Car, label: 'Uber', sub: 'Ride payments', color: '#1C1C1E', modal: 'uber' },
      { icon: Zap, label: 'Electricity', sub: 'IKEDC · EKEDC', color: '#EF4444', modal: 'electricity' },
      { icon: Coins, label: 'Exchange Rate', sub: 'Live NGN rates', color: '#F59E0B', modal: 'exchange' },
      { icon: Landmark, label: 'Govt & Tax', sub: 'FIRS · LIRS', color: '#1E3A8A', modal: 'tax' },
      { icon: LayoutGrid, label: 'More', sub: 'All services', color: '#9CA3AF', modal: 'more' },
    ],
  },
  {
    key: 'travel',
    label: 'Travel',
    emoji: '✈️',
    items: [
      { icon: Plane, label: 'BadeTrip', sub: 'Flights & packages', color: '#7C6CF0', modal: 'badetrip' },
      { icon: Car, label: 'Uber', sub: 'Book a ride', color: '#1C1C1E', modal: 'uber' },
      { icon: Car, label: 'Bolt', sub: 'Affordable rides', color: '#22C55E', modal: 'bolt' },
      { icon: Car, label: 'LagRide', sub: 'Lagos transit', color: '#F4652A', modal: 'lagride' },
      { icon: Train, label: 'Train Services', sub: 'NRC tickets', color: '#14B8A6', modal: 'train' },
      { icon: Building2, label: 'Hotels', sub: 'Book stays', color: '#EC4899', modal: 'hotels' },
      { icon: CloudSun, label: 'Weather', sub: 'City forecasts', color: '#38BDF8', modal: 'weather' },
      { icon: Smartphone, label: 'eSIM', sub: 'Travel data', color: '#3B82F6', modal: 'esim' },
    ],
  },
  {
    key: 'food',
    label: 'Food',
    emoji: '🍔',
    items: [
      { icon: UtensilsCrossed, label: 'Glovo', sub: 'Food delivery', color: '#F97316', modal: 'glovo' },
      { icon: UtensilsCrossed, label: 'KFC', sub: 'Order & pay', color: '#DC2626', modal: 'kfc' },
      { icon: ShoppingBag, label: 'Mano', sub: 'Groceries fast', color: '#7C6CF0', modal: 'mano' },
      { icon: ShoppingBag, label: 'Amart', sub: 'Shop essentials', color: '#EC4899', modal: 'marketplace', marketplaceLabel: 'Amart' },
      { icon: Car, label: 'UberEats', sub: 'Meals delivered', color: '#06C167', modal: 'ubereats' },
    ],
  },
  {
    key: 'shop',
    label: 'Shop',
    emoji: '🛍️',
    items: [
      { icon: ShoppingBag, label: 'Amart', sub: 'Groceries & more', color: '#EC4899', modal: 'marketplace', marketplaceLabel: 'Amart' },
      { icon: Wallet, label: 'Betting Wallets', sub: 'Fund your wallet', color: '#7C6CF0', modal: 'betting' },
      { icon: Package, label: 'Amazon', sub: 'Global marketplace', color: '#F59E0B', modal: 'marketplace', marketplaceLabel: 'Amazon' },
      { icon: ShoppingCart, label: 'Temu', sub: 'Affordable finds', color: '#EF4444', modal: 'marketplace', marketplaceLabel: 'Temu' },
      { icon: Globe, label: 'Alibaba', sub: 'Wholesale imports', color: '#F97316', modal: 'marketplace', marketplaceLabel: 'Alibaba' },
      { icon: ShoppingCart, label: 'Jumia', sub: "Nigeria's store", color: '#F4652A', modal: 'marketplace', marketplaceLabel: 'Jumia' },
      { icon: ShoppingBag, label: 'Konga', sub: 'Shop deals', color: '#DC2626', modal: 'marketplace', marketplaceLabel: 'Konga' },
    ],
  },
  {
    key: 'living',
    label: 'Living',
    emoji: '🏠',
    items: [
      { icon: Zap, label: 'Electricity', sub: 'Pay utility bill', color: '#EF4444', modal: 'electricity' },
      { icon: Smartphone, label: 'Airtime', sub: 'MTN · Glo · Airtel', color: '#3B82F6', modal: 'airtime' },
      { icon: Wifi, label: 'Data', sub: 'All networks', color: '#14B8A6', modal: 'data' },
      { icon: HeartPulse, label: 'Healthcare', sub: 'Hospitals & clinics', color: '#EC4899', modal: 'healthcare' },
      { icon: Landmark, label: 'Tax Refund', sub: 'Claim your refund', color: '#1E3A8A', modal: 'tax-refund' },
      { icon: Tv, label: 'Cable TV', sub: 'DStv · GOtv', color: '#7C6CF0', modal: 'cable' },
      { icon: Wifi, label: 'Internet', sub: 'Spectranet · Smile', color: '#14B8A6', modal: 'internet' },
      { icon: Building2, label: 'HMO', sub: 'Health plans', color: '#F4652A', modal: 'hmo' },
    ],
  },
];

export default function BillsPage() {
  const [, navigate] = useLocation();
  const user = useAuthStore(s => s.user);
  const syncUserFromStorage = useAuthStore(s => s.syncUserFromStorage);
  const transactions = useTransactionStore(s => s.transactions);
  const fetchTransactions = useTransactionStore(s => s.fetchTransactions);
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);

  const [activeCategory, setActiveCategory] = useState('regular');
  const [modal, setModal] = useState<ModalKey>(null);
  const [prevModal, setPrevModal] = useState<ModalKey>(null);
  const [marketplaceLabel, setMarketplaceLabel] = useState('');

  // Form states
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('MTN');

  // Electricity
  const [meterNum, setMeterNum] = useState('');
  const [meterType, setMeterType] = useState('Prepaid');
  const [electricityProvider, setElectricityProvider] = useState('IKEDC');

  // Cable
  const [smartcard, setSmartcard] = useState('');
  const [cableProvider, setCableProvider] = useState('DStv');

  // Internet
  const [internetProvider, setInternetProvider] = useState('Spectranet');
  const [internetUserId, setInternetUserId] = useState('');

  // Betting
  const [bettingCompany, setBettingCompany] = useState(BETTING_COMPANIES[0]);
  const [bettingUserId, setBettingUserId] = useState('');

  // Tax
  const [taxType, setTaxType] = useState('FIRS');
  const [taxPayerId, setTaxPayerId] = useState('');
  const [taxRef, setTaxRef] = useState('');

  // Travel / eSIM / Food / HMO
  const [bookingRef, setBookingRef] = useState('');
  const [trainRoute, setTrainRoute] = useState(TRAIN_ROUTES[0].route);
  const [hotelNights, setHotelNights] = useState('2');
  const [esimProvider, setEsimProvider] = useState('BadePay eSIM');
  const [esimEmail, setEsimEmail] = useState('');
  const [healthcareProvider, setHealthcareProvider] = useState('Hygeia');
  const [patientId, setPatientId] = useState('');
  const [hmoProvider, setHmoProvider] = useState('Hygeia HMO');
  const [memberId, setMemberId] = useState('');
  const [refundTin, setRefundTin] = useState('');
  const [refundYear, setRefundYear] = useState('2024');
  const [weatherCity, setWeatherCity] = useState('Lagos');

  // Pin & Auth
  const [showPinModal, setShowPinModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [tokenText, setTokenText] = useState('');
  const [loading, setLoading] = useState(false);

  const userBalance = user?.balance ?? 0;

  useEffect(() => {
    syncUserFromStorage();
  }, []);

  const openModal = (m: ModalKey, mktLabel?: string) => {
    setModal(m);
    if (mktLabel) setMarketplaceLabel(mktLabel);
  };

  const openPin = () => {
    setPrevModal(modal);
    setShowPinModal(true);
  };

  const closeModal = () => {
    setModal(null);
    setPrevModal(null);
    setPhone(''); setAmount(''); setMeterNum(''); setSmartcard('');
    setInternetUserId(''); setBettingUserId(''); setTaxPayerId(''); setTaxRef('');
    setBookingRef(''); setEsimEmail(''); setPatientId(''); setMemberId(''); setRefundTin('');
    setSuccessMsg(''); setTokenText('');
  };

  const handlePayBill = async (pin: string) => {
    if (!user) return;
    const payAmt = parseFloat(amount) || 0;
    let desc = '';
    let billPayload: Record<string, any> = { pin };
    const category = prevModal || 'airtime';

    if (prevModal === 'airtime' || prevModal === 'data') {
      desc = `${provider} ${prevModal === 'airtime' ? 'Airtime' : 'Data Bundle'}`;
      billPayload = { ...billPayload, billType: prevModal, provider, accountRef: phone, amount: payAmt };
    } else if (prevModal === 'electricity') {
      desc = `${electricityProvider} Electricity`;
      billPayload = { ...billPayload, billType: 'electricity', provider: electricityProvider, accountRef: meterNum, packageRef: meterType, amount: payAmt };
    } else if (prevModal === 'cable') {
      desc = `${cableProvider} Cable TV`;
      billPayload = { ...billPayload, billType: 'cable', provider: cableProvider, accountRef: smartcard, amount: payAmt };
    } else if (prevModal === 'internet') {
      desc = `${internetProvider} Internet`;
      billPayload = { ...billPayload, billType: 'data', provider: internetProvider, accountRef: internetUserId, amount: payAmt };
    } else if (prevModal === 'betting') {
      desc = `${bettingCompany} Wallet`;
      billPayload = { ...billPayload, billType: 'toll', provider: bettingCompany, accountRef: bettingUserId, amount: payAmt };
    } else if (prevModal === 'tax') {
      desc = `${taxType} Tax Payment`;
      billPayload = { ...billPayload, billType: 'toll', provider: taxType, accountRef: taxPayerId, amount: payAmt };
    } else if (prevModal === 'uber' || prevModal === 'bolt' || prevModal === 'lagride') {
      desc = `${prevModal.toUpperCase()} Ride Wallet`;
      billPayload = { ...billPayload, billType: 'toll', provider: prevModal, accountRef: phone, amount: payAmt };
    } else if (prevModal === 'badetrip') {
      desc = 'BadeTrip Flight Booking';
      billPayload = { ...billPayload, billType: 'toll', provider: 'BadeTrip', accountRef: bookingRef, amount: payAmt };
    } else if (prevModal === 'train') {
      desc = `Train — ${trainRoute}`;
      billPayload = { ...billPayload, billType: 'toll', provider: 'NRC', accountRef: phone, amount: payAmt };
    } else if (prevModal === 'hotels') {
      desc = `Hotel Stays — ${hotelNights} Night(s)`;
      billPayload = { ...billPayload, billType: 'toll', provider: 'Hotels', accountRef: bookingRef, amount: payAmt };
    } else if (prevModal === 'esim') {
      desc = `${esimProvider} eSIM`;
      billPayload = { ...billPayload, billType: 'data', provider: esimProvider, accountRef: esimEmail, amount: payAmt };
    } else if (prevModal === 'glovo' || prevModal === 'kfc' || prevModal === 'mano' || prevModal === 'ubereats') {
      desc = `${prevModal.toUpperCase()} Payment`;
      billPayload = { ...billPayload, billType: 'toll', provider: prevModal, accountRef: prevModal === 'kfc' ? bookingRef : phone, amount: payAmt };
    } else if (prevModal === 'healthcare') {
      desc = `${healthcareProvider} Healthcare`;
      billPayload = { ...billPayload, billType: 'toll', provider: healthcareProvider, accountRef: patientId, amount: payAmt };
    } else if (prevModal === 'hmo') {
      desc = `${hmoProvider} Premium`;
      billPayload = { ...billPayload, billType: 'toll', provider: hmoProvider, accountRef: memberId, amount: payAmt };
    }

    setLoading(true);
    try {
      let result;
      if (category === 'airtime') {
        result = await billsService.purchaseAirtime(billPayload);
      } else if (category === 'data') {
        result = await billsService.purchaseData(billPayload);
      } else if (category === 'electricity') {
        result = await billsService.payElectricity(billPayload);
      } else if (category === 'cable') {
        result = await billsService.payCable(billPayload);
      } else {
        result = await billsService.payGenericBill(category, billPayload);
      }

      // Update local storage balance
      useAuthStore.setState({ user: { ...user, balance: userBalance - payAmt } });

      if (category === 'electricity') {
        const tk = result?.token || result?.transaction?.token ||
          `${Math.floor(1000 + Math.random()*9000)}-${Math.floor(1000 + Math.random()*9000)}-${Math.floor(1000 + Math.random()*9000)}-${Math.floor(1000 + Math.random()*9000)}`;
        setTokenText(tk);
      }

      setSuccessMsg(`₦${payAmt.toLocaleString()} payment to ${desc} was successful.`);
      setModal('success');
      
      // Refresh transactions list
      void fetchTransactions();
      void fetchNotifications();
    } catch (err: any) {
      toast.error(err?.message || 'Payment failed. Check details & balance.');
    } finally {
      setLoading(false);
    }
  };

  // Filter outgoing transactions that look like bill payments
  const recentBills = transactions
    .filter(tx => tx.type === 'debit' && (tx.category === 'bill' || tx.description?.toLowerCase().includes('airtime') || tx.description?.toLowerCase().includes('disco') || tx.description?.toLowerCase().includes('betting') || tx.description?.toLowerCase().includes('cable')))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Bills & Payments</h1>
        <p className="text-sm font-semibold text-[var(--text-secondary)] mt-1">Instant settlement to 200+ billers — receipts included.</p>
      </div>

      {/* Available Balance Info Card */}
      <div className="rounded-2xl border bg-gradient-to-br from-[#0b7367]/10 to-[#0b7367]/5 border-[#0b7367]/20 p-6 flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-[#0b7367] uppercase tracking-wider">Available balance</p>
          <p className="mt-2 text-3xl font-black text-[var(--text-primary)]">{formatNGN(userBalance)}</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-[#0b7367]/10 flex items-center justify-center border border-[#0b7367]/20">
          <Receipt size={24} className="text-[#0b7367]" />
        </div>
      </div>

      {/* Recent Payments Section */}
      {recentBills.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-tertiary)] px-1">Recent Payments</h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] divide-y divide-[var(--border)] overflow-hidden">
            {recentBills.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3.5 px-4 py-3.5">
                <div className="h-10 w-10 rounded-xl bg-[#0b7367]/10 flex items-center justify-center font-bold text-[#0b7367]">
                  {tx.name?.[0]?.toUpperCase() || 'B'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{tx.name || tx.description}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{tx.category} · {new Date(tx.date).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-black text-[var(--text-primary)] shrink-0">- {formatNGN(tx.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div>
        <div className="flex border-b border-[var(--border)] gap-5 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(c => {
            const active = c.key === activeCategory;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className="relative py-2 px-1 text-sm font-bold shrink-0 transition-colors"
                style={{ color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
              >
                <span className="flex items-center gap-1.5">
                  <span>{c.emoji}</span>
                  {c.label}
                </span>
                {active && (
                  <span
                    className="absolute -bottom-0.5 left-0 right-0 h-[3px] rounded-full"
                    style={{ background: '#0b7367' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Grid matching mobile app structure */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.find(c => c.key === activeCategory)?.items.map(({ icon: Icon, label, sub, color, modal: m, marketplaceLabel: mktLabel }) => (
            <button
              key={label}
              onClick={() => {
                if (m === 'marketplace') {
                  navigate('/marketplace');
                } else if (m === 'more') {
                  setActiveCategory('regular');
                } else {
                  openModal(m, mktLabel);
                }
              }}
              className="flex flex-col items-center p-5 rounded-2xl border text-center transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: `${color}15`, border: `1.5px solid ${color}25` }}
              >
                <Icon size={26} style={{ color }} strokeWidth={1.8} />
              </div>
              <span className="text-sm font-black text-[var(--text-primary)] leading-tight">{label}</span>
              <span className="text-xs text-[var(--text-tertiary)] mt-1">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ───────────────── ALL BILL MODALS ───────────────── */}

      {/* Airtime Modal */}
      <PremiumModal isOpen={modal === 'airtime'} onClose={closeModal} title="Buy Airtime" size="md">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Network Provider</label>
            <div className="grid grid-cols-4 gap-2">
              {['MTN', 'Airtel', 'Glo', '9mobile'].map(p => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`py-3 text-xs font-black rounded-xl border transition-all ${provider === p ? 'bg-[#0b7367] text-white border-transparent' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="0803 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Select Amount</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[100, 200, 500, 1000, 2000, 5000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`py-2 text-xs font-bold rounded-xl border ${amount === String(amt) ? 'bg-[#0b7367]/10 text-[#0b7367] border-[#0b7367]/30' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  ₦{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Enter Custom Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <button
            onClick={openPin}
            disabled={phone.length < 10 || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Continue
          </button>
        </div>
      </PremiumModal>

      {/* Data Modal */}
      <PremiumModal isOpen={modal === 'data'} onClose={closeModal} title="Buy Mobile Data" size="md">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Network Provider</label>
            <div className="grid grid-cols-4 gap-2">
              {['MTN', 'Airtel', 'Glo', '9mobile'].map(p => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`py-3 text-xs font-black rounded-xl border transition-all ${provider === p ? 'bg-[#0b7367] text-white border-transparent' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="0803 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Select Bundle Plan</label>
            <div className="space-y-2">
              {[
                { label: '1 GB — 30 days', price: 500 },
                { label: '3 GB — 30 days', price: 1500 },
                { label: '6 GB — 30 days', price: 3000 },
                { label: '10 GB — 30 days', price: 5000 },
                { label: '25 GB — 30 days', price: 10000 },
              ].map(plan => (
                <button
                  key={plan.label}
                  onClick={() => setAmount(String(plan.price))}
                  className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all ${amount === String(plan.price) ? 'bg-[#0b7367]/10 border-[#0b7367]/30 text-[#0b7367]' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  <span className="text-sm font-bold">{plan.label}</span>
                  <span className="text-sm font-black">₦{plan.price}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openPin}
            disabled={phone.length < 10 || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Continue
          </button>
        </div>
      </PremiumModal>

      {/* Electricity Modal */}
      <PremiumModal isOpen={modal === 'electricity'} onClose={closeModal} title="Electricity Payment" size="md">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Select DisCo</label>
            <div className="relative">
              <select
                value={electricityProvider}
                onChange={e => setElectricityProvider(e.target.value)}
                className="w-full appearance-none rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367] cursor-pointer"
              >
                {['IKEDC', 'EKEDC', 'AEDC', 'PHED', 'IBEDC', 'KEDCO', 'JED'].map(disco => <option key={disco}>{disco}</option>)}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Meter Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['Prepaid', 'Postpaid'].map(t => (
                <button
                  key={t}
                  onClick={() => setMeterType(t)}
                  className={`py-3 text-xs font-black rounded-xl border transition-all ${meterType === t ? 'bg-[#0b7367] text-white border-transparent' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Meter Number</label>
            <input
              type="text"
              placeholder="Enter 11-digit meter number"
              value={meterNum}
              onChange={e => setMeterNum(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Amount</label>
            <input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367] mb-3"
            />
            <div className="grid grid-cols-3 gap-2">
              {[2000, 5000, 10000, 20000, 50000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`py-2 text-xs font-bold rounded-xl border ${amount === String(amt) ? 'bg-[#0b7367]/10 text-[#0b7367] border-[#0b7367]/30' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openPin}
            disabled={meterNum.length < 10 || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Continue
          </button>
        </div>
      </PremiumModal>

      {/* Cable TV Modal */}
      <PremiumModal isOpen={modal === 'cable'} onClose={closeModal} title="Cable TV Subscription" size="md">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {['DStv', 'GOtv', 'StarTimes'].map(p => (
                <button
                  key={p}
                  onClick={() => { setCableProvider(p); setAmount(''); }}
                  className={`py-3 text-xs font-black rounded-xl border transition-all ${cableProvider === p ? 'bg-[#0b7367] text-white border-transparent' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Smartcard / IUC Number</label>
            <input
              type="text"
              placeholder="Enter smartcard number"
              value={smartcard}
              onChange={e => setSmartcard(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Package</label>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {cableProvider === 'DStv' && [
                { pkg: 'DStv Access', price: 3500 },
                { pkg: 'DStv Compact', price: 12500 },
                { pkg: 'DStv Compact Plus', price: 22500 },
                { pkg: 'DStv Premium', price: 44500 },
              ].map(({ pkg, price }) => (
                <button
                  key={pkg}
                  onClick={() => setAmount(String(price))}
                  className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all ${amount === String(price) ? 'bg-[#0b7367]/10 border-[#0b7367]/30 text-[#0b7367]' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  <span className="text-sm font-bold">{pkg}</span>
                  <span className="text-sm font-black">₦{price.toLocaleString()}</span>
                </button>
              ))}
              {cableProvider === 'GOtv' && [
                { pkg: 'GOtv Smallie', price: 1575 },
                { pkg: 'GOtv Jinja', price: 2460 },
                { pkg: 'GOtv Jolli', price: 4150 },
                { pkg: 'GOtv Max', price: 5700 },
              ].map(({ pkg, price }) => (
                <button
                  key={pkg}
                  onClick={() => setAmount(String(price))}
                  className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all ${amount === String(price) ? 'bg-[#0b7367]/10 border-[#0b7367]/30 text-[#0b7367]' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  <span className="text-sm font-bold">{pkg}</span>
                  <span className="text-sm font-black">₦{price.toLocaleString()}</span>
                </button>
              ))}
              {cableProvider === 'StarTimes' && [
                { pkg: 'Nova', price: 1200 },
                { pkg: 'Basic', price: 2000 },
                { pkg: 'Smart', price: 2800 },
                { pkg: 'Classic', price: 3500 },
              ].map(({ pkg, price }) => (
                <button
                  key={pkg}
                  onClick={() => setAmount(String(price))}
                  className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all ${amount === String(price) ? 'bg-[#0b7367]/10 border-[#0b7367]/30 text-[#0b7367]' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  <span className="text-sm font-bold">{pkg}</span>
                  <span className="text-sm font-black">₦{price.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openPin}
            disabled={smartcard.length < 8 || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Continue
          </button>
        </div>
      </PremiumModal>

      {/* Internet Modal */}
      <PremiumModal isOpen={modal === 'internet'} onClose={closeModal} title="Internet Subscription" size="md">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Provider</label>
            <div className="relative">
              <select
                value={internetProvider}
                onChange={e => setInternetProvider(e.target.value)}
                className="w-full appearance-none rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367] cursor-pointer"
              >
                {['Spectranet', 'Smile', 'Tizeti', 'Swift Networks', 'Ipnx Nigeria'].map(p => <option key={p}>{p}</option>)}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Account / User ID</label>
            <input
              type="text"
              placeholder="Enter your account ID"
              value={internetUserId}
              onChange={e => setInternetUserId(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Select Plan</label>
            <div className="space-y-2">
              {[
                { label: '10 GB — 30 days', price: 5000 },
                { label: '20 GB — 30 days', price: 9500 },
                { label: '30 GB — 30 days', price: 15000 },
                { label: '50 GB — 30 days', price: 22000 },
                { label: 'Unlimited — 30 days', price: 35000 },
              ].map(({ label, price }) => (
                <button
                  key={label}
                  onClick={() => setAmount(String(price))}
                  className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all ${amount === String(price) ? 'bg-[#0b7367]/10 border-[#0b7367]/30 text-[#0b7367]' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  <span className="text-sm font-bold">{label}</span>
                  <span className="text-sm font-black">₦{price.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openPin}
            disabled={!internetUserId.trim() || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Continue
          </button>
        </div>
      </PremiumModal>

      {/* Betting Modal */}
      <PremiumModal isOpen={modal === 'betting'} onClose={closeModal} title="Betting Wallet Top-up" size="md">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Select Platform</label>
            <div className="relative">
              <select
                value={bettingCompany}
                onChange={e => setBettingCompany(e.target.value)}
                className="w-full appearance-none rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367] cursor-pointer"
              >
                {BETTING_COMPANIES.map(b => <option key={b}>{b}</option>)}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Betting User ID</label>
            <input
              type="text"
              placeholder="Enter your betting account ID"
              value={bettingUserId}
              onChange={e => setBettingUserId(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Amount to Fund</label>
            <input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367] mb-3"
            />
            <div className="grid grid-cols-3 gap-2">
              {[1000, 2000, 5000, 10000, 20000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`py-2 text-xs font-bold rounded-xl border ${amount === String(amt) ? 'bg-[#0b7367]/10 text-[#0b7367] border-[#0b7367]/30' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openPin}
            disabled={!bettingUserId.trim() || parseFloat(amount || '0') < 100}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Top Up Wallet
          </button>
        </div>
      </PremiumModal>

      {/* Govt & Tax Modal */}
      <PremiumModal isOpen={modal === 'tax'} onClose={closeModal} title="Government & Tax Payment" size="md">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Payment Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['FIRS', 'LIRS', 'Vehicle Papers'].map(t => (
                <button
                  key={t}
                  onClick={() => setTaxType(t)}
                  className={`py-3 text-xs font-black rounded-xl border transition-all ${taxType === t ? 'bg-[#0b7367] text-white border-transparent' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              {taxType === 'Vehicle Papers' ? 'Vehicle Registration No.' : 'TaxPayer ID (TIN)'}
            </label>
            <input
              type="text"
              placeholder={taxType === 'Vehicle Papers' ? 'e.g. ABC-123-DEF' : 'Enter your TIN'}
              value={taxPayerId}
              onChange={e => setTaxPayerId(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          {taxType !== 'Vehicle Papers' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Assessment Reference</label>
              <input
                type="text"
                placeholder="Enter assessment reference"
                value={taxRef}
                onChange={e => setTaxRef(e.target.value)}
                className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Amount</label>
            <input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-600 leading-relaxed font-semibold">Tax payments are final and cannot be reversed. Verify all details before proceeding.</p>
          </div>
          <button
            onClick={openPin}
            disabled={!taxPayerId.trim() || !amount || (taxType !== 'Vehicle Papers' && !taxRef.trim())}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Proceed to Pay
          </button>
        </div>
      </PremiumModal>

      {/* Uber / Bolt / Lagride Modal */}
      <PremiumModal isOpen={modal === 'uber' || modal === 'bolt' || modal === 'lagride'} onClose={closeModal} title="Fund Ride Wallet" size="md">
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#0b7367]/10 border border-[#0b7367]/20">
              <Car size={20} className="text-[#0b7367]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)] capitalize">{modal === 'uber' ? 'Uber' : modal === 'bolt' ? 'Bolt' : 'LagRide'}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Fund your ride wallet instantly.</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Account Phone Number</label>
            <input
              type="tel"
              placeholder="0803 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Amount to Fund</label>
            <input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367] mb-3"
            />
            <div className="grid grid-cols-3 gap-2">
              {[1000, 2000, 5000, 10000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`py-2 text-xs font-bold rounded-xl border ${amount === String(amt) ? 'bg-[#0b7367]/10 text-[#0b7367] border-[#0b7367]/30' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openPin}
            disabled={phone.length < 10 || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Fund Wallet
          </button>
        </div>
      </PremiumModal>

      {/* BadeTrip Flight Modal */}
      <PremiumModal isOpen={modal === 'badetrip'} onClose={closeModal} title="BadeTrip Flight Booking" size="md">
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-[#7C6CF0]/10 border border-[#7C6CF0]/20 flex items-center gap-3">
            <Plane className="h-8 w-8 text-[#7C6CF0]" />
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Book flights across Nigeria</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Lagos · Abuja · Port Harcourt · Kano and more</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Booking / Reference Number</label>
            <input
              type="text"
              placeholder="BT-XXXXXX (from BadeTrip app)"
              value={bookingRef}
              onChange={e => setBookingRef(e.target.value.toUpperCase())}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Passenger Phone</label>
            <input
              type="tel"
              placeholder="0803 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Total Amount</label>
            <input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <button
            onClick={openPin}
            disabled={!bookingRef.trim() || phone.length < 10 || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Pay for Flight
          </button>
        </div>
      </PremiumModal>

      {/* Train Services Modal */}
      <PremiumModal isOpen={modal === 'train'} onClose={closeModal} title="Train Ticket Booking" size="md">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Select Route</label>
            <div className="space-y-2">
              {TRAIN_ROUTES.map(r => (
                <button
                  key={r.route}
                  onClick={() => { setTrainRoute(r.route); setAmount(String(r.price)); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${trainRoute === r.route ? 'bg-[#0b7367]/10 border-[#0b7367]/30 text-[#0b7367]' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  <div className="text-left">
                    <p className="text-sm font-bold">{r.route}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{r.duration}</p>
                  </div>
                  <span className="text-sm font-black">₦{r.price.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Passenger Phone</label>
            <input
              type="tel"
              placeholder="0803 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <button
            onClick={openPin}
            disabled={!trainRoute || phone.length < 10 || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Book Ticket
          </button>
        </div>
      </PremiumModal>

      {/* Hotels Modal */}
      <PremiumModal isOpen={modal === 'hotels'} onClose={closeModal} title="Hotel Booking" size="md">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Booking Reference</label>
            <input
              type="text"
              placeholder="Hotel confirmation code"
              value={bookingRef}
              onChange={e => setBookingRef(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Number of Nights</label>
            <div className="grid grid-cols-4 gap-2">
              {['1', '2', '3', '5', '7', '10', '14', '30'].map(n => (
                <button
                  key={n}
                  onClick={() => setHotelNights(n)}
                  className={`py-2.5 text-xs font-bold rounded-xl border ${hotelNights === n ? 'bg-[#0b7367] text-white border-transparent' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Total Amount</label>
            <input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <button
            onClick={openPin}
            disabled={!bookingRef.trim() || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Pay for Hotel
          </button>
        </div>
      </PremiumModal>

      {/* Weather Forecast Modal */}
      <PremiumModal isOpen={modal === 'weather'} onClose={closeModal} title="Weather Forecast" size="md">
        <div className="space-y-4 pt-2">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {WEATHER_DATA.map(w => (
              <button
                key={w.city}
                onClick={() => setWeatherCity(w.city)}
                className={`h-8 px-4 shrink-0 rounded-full text-xs font-bold transition-all ${weatherCity === w.city ? 'bg-[#0b7367] text-white' : 'bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)]'}`}
              >
                {w.city}
              </button>
            ))}
          </div>
          {WEATHER_DATA.filter(w => w.city === weatherCity).map(w => (
            <div key={w.city} className="space-y-4 text-center">
              <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]">
                <div className="text-6xl mb-2">{w.icon}</div>
                <div className="text-4xl font-black text-[var(--text-primary)] tracking-tight">{w.temp}°C</div>
                <div className="text-sm font-bold text-[var(--text-secondary)] mt-1">{w.condition}</div>
                <p className="text-xs text-[var(--text-tertiary)] font-bold mt-1">{w.city}, Nigeria</p>

                <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-[var(--border)]">
                  <div className="flex flex-col items-center">
                    <Droplets size={18} className="text-[#3B82F6] mb-1" />
                    <span className="text-sm font-black text-[var(--text-primary)]">{w.humidity}%</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold mt-0.5">Humidity</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Wind size={18} className="text-[#0b7367] mb-1" />
                    <span className="text-sm font-black text-[var(--text-primary)]">{w.wind} km/h</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold mt-0.5">Wind</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={closeModal} className="w-full py-3 bg-[var(--surface-secondary)] text-[var(--text-primary)] font-bold rounded-xl border border-[var(--border)]">
            Close
          </button>
        </div>
      </PremiumModal>

      {/* Exchange Rate Modal */}
      <PremiumModal isOpen={modal === 'exchange'} onClose={closeModal} title="Live Exchange Rates" size="md">
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0b7367]/10 border border-[#0b7367]/20 text-[#0b7367] text-xs font-bold">
            <RefreshCw size={14} className="animate-spin" />
            <span>Rates updated every hour.</span>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {EXCHANGE_RATES.map(r => (
              <div key={r.code} className="flex items-center gap-3.5 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <div className="text-2xl">{r.flag}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">{r.code}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">{r.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-[var(--text-primary)]">Buy: ₦{r.buy.toLocaleString()}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Sell: ₦{r.sell.toLocaleString()}</p>
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-bold shrink-0 ${r.change > 0 ? 'text-[#10B981]' : r.change < 0 ? 'text-[#EF4444]' : 'text-[var(--text-tertiary)]'}`}>
                  {r.change > 0 ? <TrendingUp size={14} /> : r.change < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                  {Math.abs(r.change)}%
                </div>
              </div>
            ))}
          </div>
          <button onClick={closeModal} className="w-full py-3 bg-[var(--surface-secondary)] text-[var(--text-primary)] font-bold rounded-xl border border-[var(--border)]">
            Close
          </button>
        </div>
      </PremiumModal>

      {/* eSIM Modal */}
      <PremiumModal isOpen={modal === 'esim'} onClose={closeModal} title="Travel eSIM" size="md">
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-[#3B82F6]" />
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">International eSIM</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Instant activation · No physical SIM needed</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">eSIM Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {['BadePay eSIM', 'Airalo', 'Holafly'].map(p => (
                <button
                  key={p}
                  onClick={() => setEsimProvider(p)}
                  className={`py-3 text-xs font-bold rounded-xl border transition-all ${esimProvider === p ? 'bg-[#0b7367] text-white border-transparent' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Device Email / eSIM ID</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={esimEmail}
              onChange={e => setEsimEmail(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Data Plan</label>
            <div className="space-y-2">
              {[
                { label: '1 GB — 7 days', price: 2500 },
                { label: '3 GB — 30 days', price: 6000 },
                { label: '5 GB — 30 days', price: 9500 },
                { label: '10 GB — 30 days', price: 16000 },
              ].map(({ label, price }) => (
                <button
                  key={label}
                  onClick={() => setAmount(String(price))}
                  className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all ${amount === String(price) ? 'bg-[#0b7367]/10 border-[#0b7367]/30 text-[#0b7367]' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  <span className="text-sm font-bold">{label}</span>
                  <span className="text-sm font-black">₦{price.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openPin}
            disabled={!esimEmail.includes('@') || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Buy eSIM
          </button>
        </div>
      </PremiumModal>

      {/* Food / Glovo / KFC / Mano / UberEats Modal */}
      <PremiumModal isOpen={modal === 'glovo' || modal === 'kfc' || modal === 'mano' || modal === 'ubereats'} onClose={closeModal} title="Food Delivery Payment" size="md">
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#0b7367]/10 border border-[#0b7367]/20">
              <UtensilsCrossed size={20} className="text-[#0b7367]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)] capitalize">{modal === 'ubereats' ? 'UberEats' : modal}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{modal === 'kfc' ? 'Pay for your KFC order.' : 'Fund your wallet to order food.'}</p>
            </div>
          </div>
          {modal === 'kfc' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Order Reference</label>
              <input
                type="text"
                placeholder="KFC-ORDER-XXXXX"
                value={bookingRef}
                onChange={e => setBookingRef(e.target.value)}
                className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Account Phone Number</label>
              <input
                type="tel"
                placeholder="0803 000 0000"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Amount</label>
            <input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367] mb-3"
            />
            <div className="grid grid-cols-3 gap-2">
              {[1000, 2000, 5000, 10000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`py-2 text-xs font-bold rounded-xl border ${amount === String(amt) ? 'bg-[#0b7367]/10 text-[#0b7367] border-[#0b7367]/30' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openPin}
            disabled={(modal === 'kfc' ? !bookingRef.trim() : phone.length < 10) || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            {modal === 'kfc' ? 'Pay Order' : 'Fund Wallet'}
          </button>
        </div>
      </PremiumModal>

      {/* Healthcare Modal */}
      <PremiumModal isOpen={modal === 'healthcare'} onClose={closeModal} title="Healthcare Payment" size="md">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Select Provider</label>
            <div className="relative">
              <select
                value={healthcareProvider}
                onChange={e => setHealthcareProvider(e.target.value)}
                className="w-full appearance-none rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367] cursor-pointer"
              >
                {['Hygeia', 'Lagoon Hospital', 'Reddington Hospital', 'Medicare Hospital', 'LUTH'].map(h => <option key={h}>{h}</option>)}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Patient ID / Reference</label>
            <input
              type="text"
              placeholder="Enter patient reference or phone"
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Payment Amount</label>
            <input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367] mb-3"
            />
            <div className="grid grid-cols-4 gap-2">
              {[5000, 10000, 25000, 50000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`py-2 text-xs font-bold rounded-xl border ${amount === String(amt) ? 'bg-[#0b7367]/10 text-[#0b7367] border-[#0b7367]/30' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openPin}
            disabled={!healthcareProvider || !patientId.trim() || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Pay Healthcare
          </button>
        </div>
      </PremiumModal>

      {/* HMO Modal */}
      <PremiumModal isOpen={modal === 'hmo'} onClose={closeModal} title="HMO Premium Payment" size="md">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Select HMO Plan</label>
            <div className="relative">
              <select
                value={hmoProvider}
                onChange={e => setHmoProvider(e.target.value)}
                className="w-full appearance-none rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367] cursor-pointer"
              >
                {['Hygeia HMO', 'Reliance HMO', 'AXA Mansard', 'Leadway Health', 'Clearline HMO'].map(h => <option key={h}>{h}</option>)}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Member ID</label>
            <input
              type="text"
              placeholder="Enter your HMO member ID"
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Premium Amount</label>
            <input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367] mb-3"
            />
            <div className="grid grid-cols-4 gap-2">
              {[5000, 10000, 25000, 50000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className={`py-2 text-xs font-bold rounded-xl border ${amount === String(amt) ? 'bg-[#0b7367]/10 text-[#0b7367] border-[#0b7367]/30' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <Shield size={16} className="text-[#10B981] shrink-0" />
            <p className="text-[11px] text-emerald-600 font-semibold">Coverage activates within 24 hours of payment confirmation.</p>
          </div>
          <button
            onClick={openPin}
            disabled={!memberId.trim() || !amount}
            className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl disabled:opacity-50 mt-2"
          >
            Pay HMO Premium
          </button>
        </div>
      </PremiumModal>

      {/* Tax Refund Modal */}
      <PremiumModal isOpen={modal === 'tax-refund'} onClose={closeModal} title="Tax Refund Claim" size="md">
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-[#1E3A8A]/10 border border-[#1E3A8A]/20 flex items-center gap-3">
            <Landmark className="h-8 w-8 text-[#1E3A8A]" />
            <div>
              <p className="text-sm font-bold text-[#1E3A8A]">Track Your Tax Refund</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Check status · Claim eligible refunds</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">TaxPayer ID (TIN)</label>
            <input
              type="text"
              placeholder="Enter your TIN number"
              value={refundTin}
              onChange={e => setRefundTin(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-bold outline-none focus:border-[#0b7367]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Tax Year</label>
            <div className="grid grid-cols-4 gap-2">
              {['2021', '2022', '2023', '2024'].map(y => (
                <button
                  key={y}
                  onClick={() => setRefundYear(y)}
                  className={`py-2 text-xs font-bold rounded-xl border ${refundYear === y ? 'bg-[#0b7367] text-white border-transparent' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          {refundTin.length >= 10 && (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] space-y-3">
              <div className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Refund Status</div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Checking record…</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">TIN: {refundTin}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Clock size={16} className="text-amber-500" />
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2 pt-2 border-t border-[var(--border)]">
                Visit the FIRS portal or contact LIRS for detailed refund status on your {refundYear} filing.
              </p>
            </div>
          )}
          <button
            onClick={() => { toast.success('Opening FIRS portal…'); closeModal(); }}
            className="w-full py-3 bg-[var(--surface-secondary)] border border-[var(--border)] font-bold text-[var(--text-primary)] rounded-xl flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} />
            Open FIRS Portal
          </button>
        </div>
      </PremiumModal>

      {/* Success Modal */}
      <PremiumModal isOpen={modal === 'success'} onClose={closeModal} title="Payment Successful" size="md">
        <div className="flex flex-col items-center text-center py-6 space-y-5">
          <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 size={44} className="text-[#10B981]" />
          </div>
          <div>
            <p className="text-lg font-black text-[#10B981]">Payment completed!</p>
            <p className="text-xs font-semibold text-[var(--text-secondary)] mt-1.5 px-4 leading-relaxed">{successMsg}</p>
          </div>
          {tokenText && (
            <div className="w-full p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-col gap-2 items-center">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">Prepaid Meter Token</span>
              <span className="font-mono text-xl font-black text-[#0b7367] tracking-widest">{tokenText}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(tokenText); toast.success('Meter token copied!'); }}
                className="flex items-center gap-1.5 text-xs text-[#0b7367] mt-1 font-bold hover:underline"
              >
                <Copy size={13} /> Copy Token
              </button>
            </div>
          )}
          <button onClick={closeModal} className="w-full py-4 bg-[#0b7367] text-white font-bold rounded-xl mt-2">
            Done
          </button>
        </div>
      </PremiumModal>

      {/* Pin Input Modal */}
      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePayBill}
      />
    </div>
  );
}
