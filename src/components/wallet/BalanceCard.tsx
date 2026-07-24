import React from 'react';
import { Coins, Wallet as WalletIcon, Clock, ShieldCheck } from 'lucide-react';
import { UserWallet } from '../../../shared/types';

interface BalanceCardProps {
  wallet: UserWallet | null;
  isLoading?: boolean;
  className?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  wallet,
  isLoading = false,
  className = '',
}) => {
  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-6 ${className}`}
      id="balance-card"
    >
      {/* Subtle Background Glow Accent */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Virtual Coin Balance</h3>
            <p className="text-xs text-slate-400">Demo Wallet ID: {wallet?.id || 'wallet_loading'}</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3" /> Active Demo
        </span>
      </div>

      {/* Main Balance Display */}
      <div className="z-10 my-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
          Available Balance
        </span>
        <div className="flex items-baseline gap-2">
          {isLoading ? (
            <div className="h-10 w-36 bg-slate-800 animate-pulse rounded-xl" />
          ) : (
            <>
              <span className="text-4xl sm:text-5xl font-extrabold font-mono text-amber-400 tracking-tight">
                {(wallet?.balance ?? 1000).toLocaleString()}
              </span>
              <span className="text-lg font-bold text-amber-300/80">Coins</span>
            </>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 z-10">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Updated: {wallet?.updatedAt ? new Date(wallet.updatedAt).toLocaleTimeString() : 'Just now'}</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-slate-400 text-[11px]">
          <WalletIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>User: {wallet?.userId || 'Current'}</span>
        </div>
      </div>
    </div>
  );
};
