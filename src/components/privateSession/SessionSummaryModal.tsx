import React from 'react';
import { CallSessionSummary } from '../../../shared/types';
import { Coins, Clock, CheckCircle2 } from 'lucide-react';

interface SessionSummaryModalProps {
  summary: CallSessionSummary;
  isCreator: boolean;
  onClose: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  summary,
  isCreator,
  onClose,
}) => {
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      id="private-session-summary-modal"
    >
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
        {/* Top Icon Banner */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-white">Private Call Summary</h3>
          <p className="text-xs text-slate-400">
            {isCreator
              ? `Session with ${summary.viewerName || 'Viewer'} completed`
              : `Session with ${summary.creatorName || 'Creator'} completed`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Duration</span>
            </div>
            <p className="text-lg font-mono font-bold text-white">{formatDuration(summary.durationSeconds)}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold uppercase tracking-wider">
              <Coins className="w-3.5 h-3.5" />
              <span>{isCreator ? 'Coins Earned' : 'Coins Paid'}</span>
            </div>
            <p className="text-lg font-mono font-bold text-amber-400">
              {isCreator ? `+${summary.creatorEarned}` : `-${summary.coinsPaid}`} Coins
            </p>
          </div>
        </div>

        {/* Details Breakdown */}
        <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Rate Per Minute</span>
            <span className="font-mono font-semibold text-amber-400">{summary.ratePerMinute} Coins / min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Start Time</span>
            <span className="font-mono font-medium text-slate-300">{formatDate(summary.startedAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">End Time</span>
            <span className="font-mono font-medium text-slate-300">{formatDate(summary.endedAt)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Completion Reason</span>
            <span className="font-bold capitalize text-emerald-400">
              {(summary.endReason || 'completed').replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 border border-emerald-500 transition-all cursor-pointer"
          id="close-summary-btn"
        >
          Done
        </button>
      </div>
    </div>
  );
};
