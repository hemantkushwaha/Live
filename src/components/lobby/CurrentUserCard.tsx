import React, { useEffect, useState } from 'react';
import { User as UserIcon, ShieldCheck, Clock, Circle, Radio, Key, Coins, Wallet as WalletIcon } from 'lucide-react';
import { User, UserWallet, ApiResponse } from '../../../shared/types';
import { apiClient } from '../../config/api';

interface CurrentUserCardProps {
  user: User | null;
  onOpenWallet?: () => void;
}

export const CurrentUserCard: React.FC<CurrentUserCardProps> = ({ user, onOpenWallet }) => {
  const [wallet, setWallet] = useState<UserWallet | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchWallet = async () => {
      try {
        const res = await apiClient.get<ApiResponse<UserWallet>>('/wallet');
        if (res.data && res.data.success && res.data.data) {
          setWallet(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch wallet in CurrentUserCard:', err);
      }
    };
    fetchWallet();
  }, [user]);

  const formatConnectedTime = (timestamp?: number) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getInitial = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Current User</h2>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Circle className="w-1.5 h-1.5 fill-emerald-400 animate-pulse" /> Online
        </span>
      </div>

      {/* Main Profile Info */}
      <div className="flex items-center gap-3.5 pt-1">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-lg font-bold shadow-inner">
            {getInitial(user?.email)}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
        </div>

        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-white truncate">{user?.email || 'Authenticated User'}</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          </div>
          <p className="text-xs text-slate-400 font-mono truncate mt-0.5">@{user?.username || 'user'}</p>
        </div>
      </div>

      {/* Wallet Summary Widget */}
      <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Wallet Balance</p>
            <p className="text-base font-bold font-mono text-amber-400">
              {(wallet?.balance ?? 1000).toLocaleString()} <span className="text-xs font-normal">Coins</span>
            </p>
          </div>
        </div>

        {onOpenWallet && (
          <button
            onClick={onOpenWallet}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            id="user-card-wallet-btn"
          >
            <WalletIcon className="w-3.5 h-3.5" />
            <span>Wallet</span>
          </button>
        )}
      </div>

      {/* Details Grid */}
      <div className="space-y-2 pt-1 border-t border-slate-800/60 text-xs font-mono">
        <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-slate-500" /> User ID
          </span>
          <span className="text-slate-200 font-semibold truncate max-w-[160px]">{user?.id}</span>
        </div>

        <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Connected Since
          </span>
          <span className="text-slate-200">{formatConnectedTime(user?.connectedAt)}</span>
        </div>

        <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-slate-500" /> Status
          </span>
          <span className="text-indigo-400 font-semibold uppercase">{user?.status || 'idle'}</span>
        </div>
      </div>
    </div>
  );
};
