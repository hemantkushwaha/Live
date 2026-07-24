import React from 'react';
import { RevenueCardsData } from '../../../shared/types';
import { DollarSign, Calendar, TrendingUp, Award, Wallet, Coins } from 'lucide-react';

interface RevenueCardsProps {
  revenue: RevenueCardsData;
}

export const RevenueCards: React.FC<RevenueCardsProps> = ({ revenue }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="revenue-cards-grid">
      {/* Today's Earnings */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today's Revenue</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-black font-mono text-emerald-400">+{revenue.today}</p>
          <span className="text-xs text-slate-400 font-semibold">Coins</span>
        </div>
        <p className="text-[10px] text-slate-500">Earnings recorded today</p>
      </div>

      {/* Weekly Earnings */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">7 Days Revenue</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-black font-mono text-indigo-400">+{revenue.weekly}</p>
          <span className="text-xs text-slate-400 font-semibold">Coins</span>
        </div>
        <p className="text-[10px] text-slate-500">Past 7 days revenue</p>
      </div>

      {/* Monthly Earnings */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-purple-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">30 Days Revenue</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-black font-mono text-purple-400">+{revenue.monthly}</p>
          <span className="text-xs text-slate-400 font-semibold">Coins</span>
        </div>
        <p className="text-[10px] text-slate-500">Past 30 days revenue</p>
      </div>

      {/* Lifetime Earnings */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lifetime Revenue</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-black font-mono text-amber-400">+{revenue.lifetime}</p>
          <span className="text-xs text-slate-400 font-semibold">Coins</span>
        </div>
        <p className="text-[10px] text-slate-500">All-time total generated</p>
      </div>

      {/* Current Wallet */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-sky-500/30 shadow-xl space-y-2 relative overflow-hidden group hover:border-sky-500/50 transition-all bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Current Wallet</span>
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-black font-mono text-sky-300">{revenue.walletBalance}</p>
          <span className="text-xs text-slate-400 font-semibold">Coins</span>
        </div>
        <p className="text-[10px] text-sky-400/80 font-medium">Available balance</p>
      </div>
    </div>
  );
};
