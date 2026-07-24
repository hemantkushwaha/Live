import React from 'react';
import { Coins, Wallet as WalletIcon, PlusCircle } from 'lucide-react';
import { UserWallet } from '../../../shared/types';

interface WalletBalanceWidgetProps {
  wallet: UserWallet | null;
  onOpenWallet?: () => void;
  className?: string;
}

export const WalletBalanceWidget: React.FC<WalletBalanceWidgetProps> = ({
  wallet,
  onOpenWallet,
  className = '',
}) => {
  return (
    <div
      onClick={onOpenWallet}
      className={`flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white cursor-pointer hover:border-amber-500/40 transition-all ${className}`}
      id="wallet-balance-widget"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <Coins className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Your Balance</p>
          <p className="text-sm font-bold font-mono text-amber-400">
            {(wallet?.balance ?? 1000).toLocaleString()} <span className="text-xs font-normal">Coins</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-all">
        <WalletIcon className="w-3.5 h-3.5" />
        <span>Manage</span>
        <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
      </div>
    </div>
  );
};
