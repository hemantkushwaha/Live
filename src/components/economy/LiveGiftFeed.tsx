import React from 'react';
import { Gift, Coins, Sparkles } from 'lucide-react';
import { TipGiftRecord } from '../../../shared/types';

interface LiveGiftFeedProps {
  latestTipGift: TipGiftRecord | null;
  className?: string;
}

export const LiveGiftFeed: React.FC<LiveGiftFeedProps> = ({ latestTipGift, className = '' }) => {
  if (!latestTipGift) return null;

  const isGift = latestTipGift.type === 'gift';

  return (
    <div
      className={`absolute top-4 left-4 z-30 transition-all duration-300 animate-bounce ${className}`}
      id="live-gift-feed-banner"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-amber-500/40 shadow-2xl shadow-amber-500/20 text-white max-w-sm">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shrink-0 shadow-lg text-lg">
          {isGift ? latestTipGift.giftIcon || '🎁' : <Coins className="w-5 h-5 text-white" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-amber-300 truncate">{latestTipGift.senderName}</span>
            <span className="text-[10px] text-slate-400 font-medium">
              {isGift ? `sent a ${latestTipGift.giftName}` : 'sent a tip!'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="px-2 py-0.5 rounded-md text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
              +{latestTipGift.amount} {latestTipGift.amount === 1 ? 'Coin' : 'Coins'}
            </span>
            {latestTipGift.message && (
              <span className="text-[11px] text-slate-300 truncate max-w-[160px] italic">
                "{latestTipGift.message}"
              </span>
            )}
          </div>
        </div>

        <Sparkles className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
      </div>
    </div>
  );
};
