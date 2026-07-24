import React from 'react';
import { TopSupporter } from '../../../shared/types';
import { Trophy, Gift, PhoneCall, Coins, User } from 'lucide-react';

interface SupporterTableProps {
  supporters: TopSupporter[];
}

export const SupporterTable: React.FC<SupporterTableProps> = ({ supporters }) => {
  if (!supporters || supporters.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
        <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-400">No supporters found for this timeframe</p>
        <p className="text-xs text-slate-500">As viewers send gifts, tips, or request calls, they will appear here.</p>
      </div>
    );
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    if (rank === 2) return 'bg-slate-300/20 text-slate-300 border-slate-400/40';
    if (rank === 3) return 'bg-amber-700/20 text-amber-600 border-amber-700/40';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4" id="supporter-table-container">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Top Supporters Leaderboard</span>
          </h3>
          <p className="text-xs text-slate-400">Top 10 viewers ranked by total coins contributed</p>
        </div>
        <span className="text-xs font-mono font-bold text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          Top 10 Supporters
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <th className="py-3 px-3">Rank</th>
              <th className="py-3 px-3">Supporter</th>
              <th className="py-3 px-3 text-right">Coins Spent</th>
              <th className="py-3 px-3 text-center">Gifts Sent</th>
              <th className="py-3 px-3 text-center">Private Calls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {supporters.map((sup, idx) => {
              const rank = idx + 1;
              return (
                <tr key={sup.viewerId || idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-3">
                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border ${getRankBadge(rank)}`}>
                      #{rank}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{sup.viewerName || 'Viewer'}</p>
                        <p className="text-[10px] font-mono text-slate-500">ID: {sup.viewerId?.substring(0, 10)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className="font-mono font-bold text-amber-400 text-sm flex items-center justify-end gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {sup.totalCoinsSpent}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="font-mono font-semibold text-indigo-300 flex items-center justify-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-indigo-400" />
                      {sup.giftsSentCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="font-mono font-semibold text-purple-300 flex items-center justify-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5 text-purple-400" />
                      {sup.privateCallsCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
