import React from 'react';
import { Radio, LogOut, User as UserIcon, ShieldCheck, Wallet, TrendingUp } from 'lucide-react';
import { APP_NAME, APP_VERSION } from '../../../shared/constants/constants';
import { User } from '../../../shared/types';

interface LobbyHeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenWallet?: () => void;
  onOpenEarnings?: () => void;
}

export const LobbyHeader: React.FC<LobbyHeaderProps> = ({
  currentUser,
  onLogout,
  onOpenWallet,
  onOpenEarnings,
}) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg tracking-tight">{APP_NAME}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                Lobby v{APP_VERSION}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Real-Time Live Streaming Platform</p>
          </div>
        </div>

        {/* Current User Info & Action Buttons */}
        <div className="flex items-center gap-3">
          {onOpenEarnings && (
            <button
              onClick={onOpenEarnings}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Creator Earnings Dashboard"
              id="header-earnings-btn"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Earnings</span>
            </button>
          )}

          {onOpenWallet && (
            <button
              onClick={onOpenWallet}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Open Wallet"
              id="header-wallet-btn"
            >
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>Wallet</span>
            </button>
          )}


          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200">{currentUser?.email}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">ID: {currentUser?.id}</span>
            </div>
          </div>

          <button
            id="logout-button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition-all duration-150 shadow-sm"
            title="Log out of session"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
