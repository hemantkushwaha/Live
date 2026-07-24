import React from 'react';
import { UserWallet } from '../../../shared/types';
import { Wallet, ArrowUpRight, ArrowDownLeft, Shield } from 'lucide-react';

interface WalletCardProps {
  wallet: UserWallet | null;
  className?: string;
}

export const WalletCard: React.FC<WalletCardProps> = ({ wallet, className = '' }) => {
  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-white ${className}`}
      id="wallet-card"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Wallet Overview</h3>
            <p className="text-xs text-slate-400">Virtual account details & statistics</p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-slate-400 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
          ID: {wallet?.id || 'wallet_demo'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Total Sent */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tips / Gifts Sent</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-400">
            {(wallet?.totalTipsSent ?? 0).toLocaleString()} <span className="text-xs font-normal">Coins</span>
          </p>
        </div>

        {/* Total Received */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tips / Gifts Earned</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            {(wallet?.totalTipsReceived ?? 0).toLocaleString()} <span className="text-xs font-normal">Coins</span>
          </p>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>In-Memory Safe Sandbox Engine</span>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Demo Mode</span>
      </div>
    </div>
  );
};
