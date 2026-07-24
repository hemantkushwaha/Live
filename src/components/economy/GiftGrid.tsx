import React from 'react';
import { GiftItem } from '../../../shared/types';

const FALLBACK_GIFTS: GiftItem[] = [
  { id: 'heart', name: 'Heart', icon: '❤️', price: 10 },
  { id: 'rose', name: 'Rose', icon: '🌹', price: 20 },
  { id: 'star', name: 'Star', icon: '⭐', price: 50 },
  { id: 'gem', name: 'Gem', icon: '💎', price: 100 },
  { id: 'crown', name: 'Crown', icon: '👑', price: 250 },
  { id: 'rocket', name: 'Rocket', icon: '🚀', price: 500 },
];

interface GiftGridProps {
  gifts?: GiftItem[];
  selectedGift?: GiftItem | null;
  onSelectGift: (gift: GiftItem) => void;
  disabled?: boolean;
  className?: string;
}

export const GiftGrid: React.FC<GiftGridProps> = ({
  gifts = FALLBACK_GIFTS,
  selectedGift,
  onSelectGift,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-3 sm:grid-cols-6 gap-2.5 ${className}`} id="gift-grid">
      {gifts.map((gift) => {
        const isSelected = selectedGift?.id === gift.id;
        return (
          <button
            key={gift.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectGift(gift)}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer ${
              isSelected
                ? 'bg-rose-500/20 border-rose-500 text-white scale-105 shadow-lg shadow-rose-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
            id={`gift-item-${gift.id}`}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{gift.icon}</span>
            <span className="text-[11px] font-bold text-slate-200 truncate max-w-full">{gift.name}</span>
            <span className="text-[10px] font-mono font-extrabold text-amber-400">
              {gift.price} {gift.price === 1 ? 'Coin' : 'Coins'}
            </span>
          </button>
        );
      })}
    </div>
  );
};
