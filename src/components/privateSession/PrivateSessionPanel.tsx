import React, { useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, ShieldCheck, User, Coins, AlertTriangle, Clock } from 'lucide-react';
import { CallSession } from '../../../shared/types';
import { PeerConnectionState } from '../../webrtc/peer/PeerConnectionManager';
import { PrivateSessionTimerData } from '../../hooks/usePrivateSession';

interface PrivateSessionPanelProps {
  session: CallSession;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  connectionState: PeerConnectionState;
  durationSeconds: number;
  timerData?: PrivateSessionTimerData;
  warningMessage?: string | null;
  isAudioMuted: boolean;
  isVideoDisabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export const PrivateSessionPanel: React.FC<PrivateSessionPanelProps> = ({
  session,
  remoteStream,
  localStream,
  connectionState,
  durationSeconds,
  timerData,
  warningMessage,
  isAudioMuted,
  isVideoDisabled,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
}) => {
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (remoteVideoRef.current) {
      if (remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      } else {
        remoteVideoRef.current.srcObject = null;
      }
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current) {
      if (localStream && !isVideoDisabled) {
        localVideoRef.current.srcObject = localStream;
      } else {
        localVideoRef.current.srcObject = null;
      }
    }
  }, [localStream, isVideoDisabled]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const elapsedTime = timerData?.elapsedTime ?? durationSeconds;
  const remainingTime = timerData?.remainingTime ?? 300;
  const currentEarnings = timerData?.currentCost ?? session.creatorEarned ?? 0;

  return (
    <div
      className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
      id="private-session-creator-panel"
    >
      {/* Warning Banner if Low Balance / Expiring */}
      {warningMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-semibold animate-pulse">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
                Private Call Active
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {connectionState.toUpperCase()}
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-0.5">
              1-on-1 Call with <span className="text-emerald-400">{session.viewerName || 'Accepted Viewer'}</span>
            </p>
          </div>
        </div>

        {/* Timer & Billing Status Metrics */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Elapsed: {formatTime(elapsedTime)}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" />
            <span>Earned: +{currentEarnings} Coins</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
            <span>Rem: {formatTime(remainingTime)}</span>
          </div>

          <button
            onClick={onEndCall}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 border border-rose-500 transition-all flex items-center gap-2 cursor-pointer ml-auto sm:ml-0"
            id="end-private-call-creator-btn"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* Main Video Grid: Viewer Remote Stream & Creator Local Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Remote Viewer Stream (2 cols) */}
        <div className="md:col-span-2 relative aspect-video bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
              <User className="w-10 h-10 text-emerald-400 animate-pulse" />
              <p className="text-xs font-semibold text-slate-300">Connecting Viewer Feed...</p>
              <p className="text-[11px] text-slate-500">Establishing isolated 1-on-1 WebRTC pipeline</p>
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-[11px] font-semibold text-emerald-300">
            Viewer: {session.viewerName || 'Accepted Viewer'}
          </div>
        </div>

        {/* Creator Local Feed & Controls (1 col) */}
        <div className="flex flex-col justify-between space-y-3">
          <div className="relative aspect-video bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
            {localStream && !isVideoDisabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <VideoOff className="w-8 h-8 text-slate-500 mb-1" />
                <span className="text-xs text-slate-400">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium text-slate-300">
              You (Creator)
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={onToggleAudio}
              className={`p-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                isAudioMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
              title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={onToggleVideo}
              className={`p-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                isVideoDisabled
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
              title={isVideoDisabled ? 'Enable Video' : 'Disable Video'}
            >
              {isVideoDisabled ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
