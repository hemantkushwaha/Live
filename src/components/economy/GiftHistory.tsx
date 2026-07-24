import React from 'react';
import { TipGiftRecord } from '../../../shared/types';
import { Gift, Coins, Clock, Sparkles } from 'lucide-react';

interface GiftHistoryProps {
  history: TipGiftRecord[];
  title?: string;
  className?: string;
}

export const GiftHistory: React.FC<GiftHistoryProps> = ({
  history,
  title = 'Gift & Tip Activity',
  className = '',
}) => {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-4 shadow-xl ${className}`} id="gift-history">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Gift className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">{title}</h4>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          {history.length} {history.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {history.length === 0 ? (
        <div className="py-8 text-center space-y-1 text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/60">
          <Sparkles className="w-6 h-6 mx-auto text-slate-600" />
          <p className="text-xs font-medium text-slate-400">No gifts or tips yet</p>
          <p className="text-[11px] text-slate-600">Be the first to show support!</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between transition-all hover:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shrink-0">
                  {item.type === 'gift' ? item.giftIcon || '🎁' : '🪙'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200">{item.senderName}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {item.type}
                    </span>
                  </div>
                  {item.message && (
                    <p className="text-[11px] text-slate-400 italic truncate max-w-xs">&ldquo;{item.message}&rdquo;</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-xs text-amber-400 block">
                  +{item.amount} Coins
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
