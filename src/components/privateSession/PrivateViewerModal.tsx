import React, { useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, ShieldCheck, Radio, Coins, AlertTriangle, Clock } from 'lucide-react';
import { CallSession } from '../../../shared/types';
import { PeerConnectionState } from '../../webrtc/peer/PeerConnectionManager';
import { PrivateSessionTimerData } from '../../hooks/usePrivateSession';

interface PrivateViewerModalProps {
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
  onLeaveCall: () => void;
}

export const PrivateViewerModal: React.FC<PrivateViewerModalProps> = ({
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
  onLeaveCall,
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
  const currentCost = timerData?.currentCost ?? session.coinsPaid ?? 0;
  const coinsRemaining = timerData?.coinsRemaining ?? 1000;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      id="private-viewer-call-modal"
    >
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Warning Banner if Low Balance / Expiring */}
        {warningMessage && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/20 border-b border-amber-500/50 text-amber-300 text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{warningMessage}</span>
          </div>
        )}

        {/* Top Bar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-950/60">
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
              <h2 className="text-base font-bold text-white mt-0.5 truncate max-w-md">
                1-on-1 Call with {session.creatorName || 'Creator'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Elapsed: {formatTime(elapsedTime)}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              <span>Paid: {currentCost} Coins</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
              <span>Bal: {coinsRemaining} Coins</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
              <span>Rem: {formatTime(remainingTime)}</span>
            </div>

            <button
              onClick={onLeaveCall}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 border border-rose-500 transition-all flex items-center gap-2 cursor-pointer"
              id="leave-private-call-viewer-btn"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Call</span>
            </button>
          </div>
        </div>

        {/* Media Player Area */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col justify-center space-y-4 overflow-y-auto">
          <div className="relative aspect-video w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                <Radio className="w-12 h-12 text-emerald-400 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-200">Establishing Private Connection</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Connecting WebRTC audio and video stream directly with Creator...
                </p>
              </div>
            )}

            {/* Viewer Local Video PIP (Bottom-Right) */}
            <div className="absolute bottom-4 right-4 w-36 sm:w-48 aspect-video bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
              {localStream && !isVideoDisabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950">
                  <VideoOff className="w-5 h-5 text-slate-500" />
                  <span className="text-[10px] text-slate-400">Cam Off</span>
                </div>
              )}
              <div className="absolute bottom-1 left-1 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] text-slate-300 font-mono">
                You
              </div>
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onToggleAudio}
              className={`px-4 py-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                isAudioMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isAudioMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-slate-200" />}
              <span>{isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
            </button>

            <button
              onClick={onToggleVideo}
              className={`px-4 py-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                isVideoDisabled
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isVideoDisabled ? <VideoOff className="w-4 h-4 text-rose-400" /> : <Video className="w-4 h-4 text-slate-200" />}
              <span>{isVideoDisabled ? 'Turn Camera On' : 'Turn Camera Off'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
