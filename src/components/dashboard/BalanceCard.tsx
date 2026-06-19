

import React, { useState } from 'react';
import { Link } from 'wouter';
import { Eye, EyeOff, Plus, SendHorizonal, Landmark, ArrowDownToLine, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useWalletStore } from '@/store/useWalletStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { Card } from '@/components/ui/card';

export function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true);
  const getBalance = useWalletStore((s) => s.getBalance);
  const { user } = useAuthStore();
  const balance = user?.balance ?? getBalance();

  return (
    <Card className="bg-[#013e37] text-[#ffefb3] p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffefb3] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-[#ffefb3]/80">
            <span className="text-sm font-bold">Available Balance</span>
            <button onClick={() => setShowBalance(!showBalance)} className="hover:text-[#ffefb3] transition-colors icon-hover-effect">
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tighter mb-2">
            {showBalance ? formatCurrency(balance) : '****'}
          </div>
          <div className="text-sm font-semibold text-[#ffefb3]/70">
            Account: {user?.accountNumber || '1029384756'}
          </div>
        </div>

        <div className="flex gap-3 sm:gap-6">
          <div className="bg-[#ffefb3]/10 rounded-xl p-4 min-w-[120px] border border-[#ffefb3]/5">
            <div className="flex items-center gap-1.5 text-xs text-[#10B981] font-bold uppercase tracking-wider mb-1">
              <ArrowDownRight size={14} /> Total In
            </div>
            <div className="text-xl font-bold">₦245,500</div>
          </div>
          <div className="bg-[#ffefb3]/10 rounded-xl p-4 min-w-[120px] border border-[#ffefb3]/5">
            <div className="flex items-center gap-1.5 text-xs text-[#EF4444] font-bold uppercase tracking-wider mb-1">
              <ArrowUpRight size={14} /> Total Out
            </div>
            <div className="text-xl font-bold">₦120,500</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/wallet" className="flex items-center justify-center gap-2 bg-[#ffefb3] hover:bg-[#f5e0a0] text-[#013e37] py-3 px-4 rounded-xl font-bold transition-colors shadow-sm icon-hover-effect">
          <Plus size={18} /> Top Up
        </Link>
        <Link href="/send" className="flex items-center justify-center gap-2 bg-[#ffefb3]/10 hover:bg-[#ffefb3]/20 text-[#ffefb3] py-3 px-4 rounded-xl font-bold transition-colors border border-[#ffefb3]/10 icon-hover-effect">
          <SendHorizonal size={18} /> Send
        </Link>
        <Link href="/bills" className="flex items-center justify-center gap-2 bg-[#ffefb3]/10 hover:bg-[#ffefb3]/20 text-[#ffefb3] py-3 px-4 rounded-xl font-bold transition-colors border border-[#ffefb3]/10 icon-hover-effect">
          <Landmark size={18} /> Pay Bills
        </Link>
        <Link href="/wallet" className="flex items-center justify-center gap-2 bg-[#ffefb3]/10 hover:bg-[#ffefb3]/20 text-[#ffefb3] py-3 px-4 rounded-xl font-bold transition-colors border border-[#ffefb3]/10 icon-hover-effect">
          <ArrowDownToLine size={18} /> Withdraw
        </Link>
      </div>
    </Card>
  );
}
