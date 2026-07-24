import React from 'react';
import { Mic, MicOff, Video, VideoOff, Square, Settings, Wallet, Layers, BarChart2 } from 'lucide-react';

interface QuickActionsProps {
  isAudioMuted: boolean;
  isVideoDisabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndStream: () => void;
  isEndingStream?: boolean;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  isAudioMuted,
  isVideoDisabled,
  onToggleAudio,
  onToggleVideo,
  onEndStream,
  isEndingStream = false,
  className = '',
}) => {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 text-white ${className}`} id="quick-actions-panel">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white">Quick Controls & Actions</h3>
          <p className="text-xs text-slate-400">Stream audio, camera, and broadcast controls</p>
        </div>
      </div>

      {/* Primary Enabled Action Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Toggle Audio */}
        <button
          onClick={onToggleAudio}
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            isAudioMuted
              ? 'bg-rose-600/20 text-rose-300 border-rose-500/30 hover:bg-rose-600/30'
              : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
          }`}
          id="action-toggle-mic-btn"
        >
          {isAudioMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          <span>{isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
        </button>

        {/* Toggle Video */}
        <button
          onClick={onToggleVideo}
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            isVideoDisabled
              ? 'bg-rose-600/20 text-rose-300 border-rose-500/30 hover:bg-rose-600/30'
              : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
          }`}
          id="action-toggle-cam-btn"
        >
          {isVideoDisabled ? <VideoOff className="w-4 h-4 text-rose-400" /> : <Video className="w-4 h-4 text-indigo-400" />}
          <span>{isVideoDisabled ? 'Enable Camera' : 'Disable Camera'}</span>
        </button>

        {/* End Stream */}
        <button
          onClick={onEndStream}
          disabled={isEndingStream}
          className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 border border-rose-500/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
          id="action-end-stream-btn"
        >
          <Square className="w-4 h-4 fill-white" />
          <span>{isEndingStream ? 'Ending Broadcast...' : 'End Stream'}</span>
        </button>
      </div>

      {/* Disabled Actions & Upcoming Features */}
      <div className="pt-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Upcoming Features</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 opacity-60 flex flex-col items-center justify-center text-center gap-1">
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="text-[11px] font-semibold text-slate-400">Settings</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400">Disabled</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 opacity-60 flex flex-col items-center justify-center text-center gap-1">
            <Wallet className="w-4 h-4 text-amber-500/60" />
            <span className="text-[11px] font-semibold text-slate-400">Wallet</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400/80">Coming Soon</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 opacity-60 flex flex-col items-center justify-center text-center gap-1">
            <Layers className="w-4 h-4 text-indigo-500/60" />
            <span className="text-[11px] font-semibold text-slate-400">Private Queue</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400/80">Coming Soon</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 opacity-60 flex flex-col items-center justify-center text-center gap-1">
            <BarChart2 className="w-4 h-4 text-emerald-500/60" />
            <span className="text-[11px] font-semibold text-slate-400">Analytics</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400/80">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};
