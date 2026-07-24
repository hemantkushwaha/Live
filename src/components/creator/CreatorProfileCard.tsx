import React from 'react';
import { User as UserIcon, Mail, Radio, ShieldCheck } from 'lucide-react';

interface CreatorProfileCardProps {
  creatorName: string;
  creatorEmail: string;
  streamTitle: string;
  className?: string;
}

export const CreatorProfileCard: React.FC<CreatorProfileCardProps> = ({
  creatorName,
  creatorEmail,
  streamTitle,
  className = '',
}) => {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 text-white ${className}`} id="creator-profile-card">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-600/20 shrink-0">
          {creatorName.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white truncate">{creatorName}</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE
            </span>
          </div>

          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{creatorEmail}</span>
          </p>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Broadcast Title</span>
        <p className="text-xs font-bold text-slate-200 truncate">{streamTitle}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified Broadcaster</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">Host Dashboard</span>
      </div>
    </div>
  );
};
