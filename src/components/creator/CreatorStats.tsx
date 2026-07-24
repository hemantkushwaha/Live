import React from 'react';
import { Users, TrendingUp, Radio, Monitor } from 'lucide-react';

interface CreatorStatsProps {
  currentViewers: number;
  peakViewers: number;
  isPausedForPrivate?: boolean;
  resolution?: { width: number; height: number } | null;
  className?: string;
}

export const CreatorStats: React.FC<CreatorStatsProps> = ({
  currentViewers,
  peakViewers,
  isPausedForPrivate = false,
  resolution,
  className = '',
}) => {
  const displayResolution = resolution ? `${resolution.width}x${resolution.height}` : '720p HD';

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3.5 ${className}`} id="creator-stats-row">
      {/* Current Viewers */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Viewers</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{currentViewers}</p>
        </div>
        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* Peak Viewers */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Peak Viewers</p>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">{peakViewers}</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      {/* Stream Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stream Status</p>
          <p className="text-sm font-bold text-emerald-400 mt-1">
            {isPausedForPrivate ? 'Private Call' : 'Public Live'}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Radio className="w-5 h-5" />
        </div>
      </div>

      {/* Resolution */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resolution</p>
          <p className="text-sm font-bold font-mono text-indigo-300 mt-1">{displayResolution}</p>
        </div>
        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Monitor className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
