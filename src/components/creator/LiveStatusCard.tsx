import React from 'react';
import { Radio, Signal, Clock } from 'lucide-react';
import { StreamTimer } from '../stream/StreamTimer';

interface LiveStatusCardProps {
  streamTitle: string;
  creatorName: string;
  isPausedForPrivate?: boolean;
  startedAt: number;
  connectionQuality?: string;
  className?: string;
}

export const LiveStatusCard: React.FC<LiveStatusCardProps> = ({
  streamTitle,
  creatorName,
  isPausedForPrivate = false,
  startedAt,
  connectionQuality = 'Excellent (1080p WebRTC)',
  className = '',
}) => {
  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white ${className}`}
      id="live-status-card"
    >
      <div className="flex items-center gap-3">
        {/* LIVE Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            isPausedForPrivate
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-lg animate-pulse'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isPausedForPrivate ? 'bg-amber-500 animate-ping' : 'bg-rose-500 animate-ping'
            }`}
          />
          <span>{isPausedForPrivate ? 'IN PRIVATE CALL' : 'LIVE'}</span>
        </span>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        <div>
          <h2 className="text-base font-bold text-white truncate max-w-xs sm:max-w-md" title={streamTitle}>
            {streamTitle}
          </h2>
          <p className="text-xs text-slate-400">
            Broadcaster: <span className="text-slate-200 font-medium">{creatorName}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Connection Quality */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-medium">
          <Signal className="w-3.5 h-3.5 text-emerald-400" />
          <span>{connectionQuality}</span>
        </div>

        {/* Stream Timer */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <StreamTimer startedAt={startedAt} />
        </div>
      </div>
    </div>
  );
};
