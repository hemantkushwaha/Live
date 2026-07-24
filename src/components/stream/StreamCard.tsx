import React from 'react';
import { Users, Play, Radio, CheckCircle, Wifi, AlertTriangle } from 'lucide-react';
import { StreamRoom } from '../../../shared/types';
import { StreamTimer } from './StreamTimer';
import { useSignaling } from '../../contexts/SignalingContext';

interface StreamCardProps {
  stream: StreamRoom;
  isHost?: boolean;
  onSelectStream?: (stream: StreamRoom) => void;
}

export const StreamCard: React.FC<StreamCardProps> = ({ stream, isHost = false, onSelectStream }) => {
  const { peerStates, joinStreamSignaling, leaveStreamSignaling } = useSignaling();

  const peerInfo = peerStates[stream.streamerId];
  const connectionState = peerInfo?.state || 'new';
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  const handleJoinSignaling = () => {
    if (isConnected) {
      leaveStreamSignaling();
    } else {
      joinStreamSignaling(stream.id);
      if (onSelectStream) {
        onSelectStream(stream);
      }
    }
  };

  const viewerCount = Array.isArray(stream.viewers) ? stream.viewers.length : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl hover:border-slate-700/80 transition-all duration-200 space-y-3.5">
      {/* Header: LIVE Badge & Viewer Count */}
      <div className="flex items-center justify-between gap-2">
        {/* LIVE Badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>LIVE</span>
        </span>

        {/* Viewer Count */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-950 text-slate-400 border border-slate-800">
          <Users className="w-3.5 h-3.5 text-rose-500" />
          <span>{viewerCount} {viewerCount === 1 ? 'Viewer' : 'Viewers'}</span>
        </span>
      </div>

      {/* Main Info: Title & Streamer Details */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white truncate leading-snug" title={stream.title}>
          {stream.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-5 h-5 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-[10px] font-bold">
            {(stream.streamerName || stream.streamerEmail)[0].toUpperCase()}
          </div>
          <span className="font-medium text-slate-300 truncate">
            {stream.streamerName || stream.streamerEmail}
          </span>
          {isHost && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              YOU
            </span>
          )}
        </div>
      </div>

      {/* Started Time / Elapsed Timer Bar */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80 text-slate-400">
        <span className="text-[11px] text-slate-500">Duration:</span>
        <StreamTimer startedAt={stream.createdAt} />
      </div>

      {/* WebRTC Signaling Control Button */}
      {isHost ? (
        <div className="w-full py-2 px-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 shadow-inner">
          <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Broadcasting Stream (Host)</span>
        </div>
      ) : (
        <button
          id={`join-stream-${stream.id}`}
          onClick={handleJoinSignaling}
          className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            isConnected
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
              : isConnecting
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-600 text-white border border-indigo-500/30 shadow-lg shadow-indigo-600/20'
          }`}
        >
          {isConnected ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Peer Connected (Disconnect)</span>
            </>
          ) : isConnecting ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Exchanging Signaling...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-white fill-white" />
              <span>Watch Live Stream</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
