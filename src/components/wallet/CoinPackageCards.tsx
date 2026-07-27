import React from 'react';
import { Coins, Sparkles, Check, Gift } from 'lucide-react';
import { CoinPackage } from '../../../shared/types';

interface CoinPackageCardsProps {
  packages: CoinPackage[];
  selectedPackageId: string | null;
  onSelectPackage: (pkg: CoinPackage) => void;
  isLoading?: boolean;
}

export const CoinPackageCards: React.FC<CoinPackageCardsProps> = ({
  packages,
  selectedPackageId,
  onSelectPackage,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-36 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse p-4 flex flex-col justify-between"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="coin-package-cards-grid">
      {packages.map((pkg) => {
        const isSelected = selectedPackageId === pkg.id;
        const totalCoins = pkg.coins + (pkg.bonusCoins || 0);

        return (
          <div
            key={pkg.id}
            onClick={() => onSelectPackage(pkg)}
            className={`relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between group ${
              isSelected
                ? 'bg-amber-500/10 border-amber-500 text-white ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-200'
            }`}
            id={`coin-pkg-card-${pkg.id}`}
          >
            {/* Top Badge */}
            {pkg.badge && (
              <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500 text-slate-950 shadow-md">
                {pkg.badge}
              </span>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {pkg.name}
                </span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-amber-500 border-amber-400 text-slate-950'
                      : 'border-slate-700 bg-slate-950 group-hover:border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Coins Display */}
              <div className="flex items-baseline gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="font-mono font-black text-2xl text-amber-400 tracking-tight">
                  {pkg.coins.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-400">Coins</span>
              </div>

              {/* Bonus Coins Tag */}
              {pkg.bonusCoins && pkg.bonusCoins > 0 ? (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>+{pkg.bonusCoins} Extra Bonus!</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">Standard refill pack</div>
              )}
            </div>

            {/* Price Tag */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Total: {totalCoins.toLocaleString()} Coins</span>
              <span className="font-extrabold text-base text-white font-mono">
                {pkg.currency === 'INR' ? '₹' : '$'}
                {pkg.price.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
