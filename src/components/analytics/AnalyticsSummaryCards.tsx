import React from 'react';
import { AnalyticsSummary } from '../../../shared/types';
import { Gift, DollarSign, PhoneCall, Radio, Clock, Eye } from 'lucide-react';

interface AnalyticsSummaryCardsProps {
  summary: AnalyticsSummary;
}

export const AnalyticsSummaryCards: React.FC<AnalyticsSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" id="analytics-summary-cards">
      {/* Total Gifts */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <span>Total Gifts</span>
          <Gift className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <p className="text-base font-mono font-bold text-indigo-400">+{summary.totalGiftsCoins} Coins</p>
        <p className="text-[10px] text-slate-500 font-medium">{summary.totalGiftsCount} gifts received</p>
      </div>

      {/* Total Tips */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <span>Total Tips</span>
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <p className="text-base font-mono font-bold text-amber-400">+{summary.totalTipsCoins} Coins</p>
        <p className="text-[10px] text-slate-500 font-medium">{summary.totalTipsCount} tips received</p>
      </div>

      {/* Private Call Earnings */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <span>Call Earnings</span>
          <PhoneCall className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <p className="text-base font-mono font-bold text-purple-400">+{summary.privateCallCoins} Coins</p>
        <p className="text-[10px] text-slate-500 font-medium">{summary.privateCallMinutes} mins total</p>
      </div>

      {/* Total Sessions */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <span>Total Sessions</span>
          <Radio className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <p className="text-base font-mono font-bold text-white">{summary.totalSessions}</p>
        <p className="text-[10px] text-slate-500 font-medium">Streams & calls</p>
      </div>

      {/* Avg Session Time */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <span>Avg Session Time</span>
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <p className="text-base font-mono font-bold text-emerald-400">{summary.avgSessionTimeMinutes}m</p>
        <p className="text-[10px] text-slate-500 font-medium">Average duration</p>
      </div>

      {/* Peak Viewers */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <span>Peak Viewers</span>
          <Eye className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <p className="text-base font-mono font-bold text-sky-400">{summary.peakViewers}</p>
        <p className="text-[10px] text-slate-500 font-medium">Highest concurrent</p>
      </div>
    </div>
  );
};
