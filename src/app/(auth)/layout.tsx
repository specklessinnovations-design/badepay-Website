import React from 'react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { getPostAuthPath } from '@/lib/authRouting';
import { AppShell } from '@/components/ui/app-shell';

const PhoneMockup = () => (
  <div className="relative mx-auto select-none" style={{ width: '170px' }}>
    <div className="pointer-events-none absolute inset-0 -z-10 blur-2xl opacity-35"
      style={{ background: 'radial-gradient(ellipse, rgba(111,232,214,0.7) 0%, transparent 70%)' }} />
    <div className="relative rounded-[2rem] border border-white/10 bg-[#0c0c0c] p-[8px] shadow-[0_24px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.07)]">
      <div className="absolute left-1/2 top-[8px] h-[14px] w-[48px] -translate-x-1/2 rounded-full bg-[#050505]" />
      <div className="overflow-hidden rounded-[1.6rem] bg-[#050505] pt-6 pb-3 px-2.5 flex flex-col gap-2" style={{ height: '300px' }}>
        {/* Balance */}
        <div className="rounded-xl p-3 relative overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%)', border: '1px solid rgba(111,232,214,0.15)' }}>
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle,rgba(111,232,214,0.8) 0%,transparent 70%)' }} />
          <p className="text-[8px] text-[#737373] uppercase tracking-widest">Balance</p>
          <p className="text-base font-black text-white mt-0.5">₦125,800<span className="text-[#737373]">.00</span></p>
          <span className="text-[7px] bg-[#6fe8d6]/10 text-[#6fe8d6] rounded-full px-1.5 py-0.5 font-bold inline-block mt-1">+12.4% this month</span>
        </div>
        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-1.5 flex-shrink-0">
          {[{l:'Add',e:'➕'},{l:'Transfer',e:'📤'},{l:'Pay',e:'⚡'},{l:'Scan',e:'📷'}].map(a => (
            <div key={a.l} className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                style={{ background: 'rgba(111,232,214,0.08)', border: '1px solid rgba(111,232,214,0.12)' }}>
                {a.e}
              </div>
              <span className="text-[6px] text-[#525252] font-bold">{a.l}</span>
            </div>
          ))}
        </div>
        {/* Transactions */}
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="px-2.5 py-1.5 border-b border-white/5">
            <p className="text-[7px] text-[#525252] font-bold uppercase tracking-widest">Recent</p>
          </div>
          {[
            { name: 'Tunde A.', amount: '-₦5,000', color: '#f5f5f5', time: '2m' },
            { name: 'Top-up', amount: '+₦50k', color: '#10B981', time: '1h' },
            { name: 'Airtime', amount: '-₦2,000', color: '#f5f5f5', time: '3h' },
          ].map(tx => (
            <div key={tx.name} className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6fe8d6]/60" />
                </div>
                <div>
                  <p className="text-[7px] text-[#f5f5f5] font-bold leading-none">{tx.name}</p>
                  <p className="text-[6px] text-[#525252] mt-0.5">{tx.time}</p>
                </div>
              </div>
              <p className="text-[7px] font-black" style={{ color: tx.color }}>{tx.amount}</p>
            </div>
          ))}
        </div>
        {/* Bottom nav */}
        <div className="flex justify-around px-1 flex-shrink-0">
          {['🏠','💳','📊','👤'].map((ic, i) => (
            <div key={i} className={`flex flex-col items-center gap-0.5 ${i===0?'opacity-100':'opacity-25'}`}>
              <span className="text-xs">{ic}</span>
              {i===0 && <div className="w-2.5 h-0.5 rounded-full bg-[#6fe8d6]" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const STATS = [
  { value: '5,000+', label: 'Active users' },
  { value: '₦2B+', label: 'Processed' },
  { value: '99.9%', label: 'Uptime' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const { isAuthenticated, user, checkSessionValidity, authSetupComplete } = useAuthStore();

  React.useEffect(() => {
    if (!isAuthenticated) return;
    if (!authSetupComplete && window.location.pathname.startsWith('/register')) return;
    if (!user || !checkSessionValidity()) {
      useAuthStore.setState({ user: null, isAuthenticated: false, sessionToken: undefined, refreshToken: undefined, lastLoginTime: undefined });
      return;
    }
    navigate(user.userType === 'merchant' ? getPostAuthPath(user) : '/dashboard');
  }, [isAuthenticated, user, navigate, checkSessionValidity, authSetupComplete]);

  return (
    <AppShell className="flex h-screen overflow-hidden">

      {/* ── Left panel ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col"
        style={{ background: 'linear-gradient(160deg,#050505 0%,#0c0c0c 40%,#050505 100%)' }}>

        {/* Ambient orbs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,rgba(111,232,214,0.3) 0%,transparent 65%)' }} />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,rgba(111,232,214,0.25) 0%,transparent 65%)' }} />
        {/* Grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Brand row */}
        <div className="relative z-10 flex-shrink-0 px-8 xl:px-12 pt-7">
          <Link href="/" className="group inline-flex items-center gap-3">
            <img src="/favicon.png" alt="BadePay" className="h-14 w-auto object-contain transition-all duration-300 group-hover:scale-105" style={{ filter: 'drop-shadow(0 0 16px rgba(111,232,214,0.55))' }} />
          </Link>
        </div>

        {/* Copy block */}
        <div className="relative z-10 flex-shrink-0 px-8 xl:px-12 pt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4"
              style={{ background: 'rgba(111,232,214,0.08)', border: '1px solid rgba(111,232,214,0.2)' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#6fe8d6] animate-pulse" />
              <span className="text-xs font-bold text-[#6fe8d6] tracking-wide">Nigeria's #1 QR payments</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black leading-[1.05] tracking-tight mb-3" style={{ color: '#ffffff' }}>
              Transfer money<br />at the speed<br />of <span style={{ color: '#6fe8d6' }}>light</span>
            </h1>
            <p style={{ color: '#737373' }} className="leading-relaxed max-w-xs text-sm">
              Premium digital banking built for Nigeria — instant payments, bank-grade security, complete financial freedom.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.5 }}
            className="mt-5 flex gap-6">
            {STATS.map((s, i) => (
              <div key={i}>
                <p className="text-lg font-black text-white">{s.value}</p>
                <p className="text-[11px] text-[#525252] font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Phone mockup — fills remaining space, centered */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7, ease: [0.16,1,0.3,1] }}
          className="relative z-10 flex flex-1 items-center justify-center px-8 xl:px-12 min-h-0">
          <PhoneMockup />
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="relative z-10 flex-shrink-0 px-8 xl:px-12 pb-5 flex items-center justify-between">
          <p className="text-[11px] text-[#404040]">© 2026 BadePay Inc.</p>
          <div className="flex gap-4">
            {['Privacy','Terms','Security'].map(l => (
              <a key={l} href="#" className="text-[11px] text-[#404040] hover:text-[#6fe8d6] transition-colors">{l}</a>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="relative z-10 flex w-full flex-col lg:w-[48%] xl:w-[45%] h-full overflow-y-auto"
        style={{ background: 'var(--background)' }}>
        <div className="flex flex-1 flex-col items-center justify-center p-5 md:p-8 min-h-full">
          {/* Mobile brand */}
          <div className="lg:hidden mb-7 flex items-center gap-3">
            <img src="/favicon.png" alt="BadePay" className="h-8 w-auto object-contain" />
          </div>
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>

    </AppShell>
  );
}
