import React, { useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Tv, X, ShieldCheck, CheckCircle2, AlertCircle, Info, Radio } from 'lucide-react';
import { useMedia } from '../../contexts/MediaContext';
import { MediaControlBar } from './MediaControlBar';
import { PermissionDialog } from './PermissionDialog';

export const LocalPreview: React.FC = () => {
  const {
    stream,
    isPreviewOpen,
    isAudioMuted,
    isVideoDisabled,
    hasPermissions,
    permissionError,
    resolution,
    activeVideoLabel,
    activeAudioLabel,
    stopPreview,
    isInitializing,
  } = useMedia();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Attach MediaStream to HTMLVideoElement when stream or videoRef updates
  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, isPreviewOpen, isVideoDisabled]);

  if (!isPreviewOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-y-auto">
      {/* Permission Error Dialog Modal */}
      {permissionError && <PermissionDialog />}

      {/* Top Header Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Tv className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Local Media Preview</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Radio className="w-3 h-3 text-indigo-400 animate-pulse" /> EWO-007
              </span>
            </div>
            <p className="text-xs text-slate-400">Initializing local WebRTC camera and microphone feed</p>
          </div>
        </div>

        {/* Local Stream Security Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Local Only &bull; Not Transmitted</span>
        </div>

        {/* Close Preview Button */}
        <button
          onClick={stopPreview}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
          title="Close Local Preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Camera Preview Container */}
      <div className="w-full max-w-5xl mx-auto my-4 flex-1 flex flex-col justify-center">
        <div className="relative aspect-video w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center group">
          
          {/* Active Video Feed */}
          {hasPermissions && stream && !isVideoDisabled ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100" // Mirror local camera view
            />
          ) : (
            /* Disabled Video / Placeholder View */
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 shadow-inner">
                {isInitializing ? (
                  <Video className="w-10 h-10 animate-pulse text-indigo-400" />
                ) : isVideoDisabled ? (
                  <VideoOff className="w-10 h-10 text-rose-400" />
                ) : (
                  <VideoOff className="w-10 h-10 text-slate-600" />
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-slate-200">
                  {isInitializing
                    ? 'Requesting Camera & Microphone Permissions...'
                    : isVideoDisabled
                    ? 'Camera Feed Disabled'
                    : 'Camera Stream Unavailable'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  {isVideoDisabled
                    ? 'Click "Start Video" in the controls below to enable camera feed.'
                    : 'Grant permission or select an available device to start video.'}
                </p>
              </div>
            </div>
          )}

          {/* Top Overlays: Status Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
            {/* Live Camera Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Camera Live</span>
              </span>

              {resolution && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-800 shadow-lg">
                  {resolution.width}x{resolution.height}
                </span>
              )}
            </div>

            {/* Mic Status Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-lg ${
                  isAudioMuted
                    ? 'bg-rose-950/80 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isAudioMuted ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" /> Muted
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" /> Mic Active
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Bottom Overlays: Active Device Labels */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-300 pointer-events-none bg-slate-950/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2 truncate">
              <Video className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{activeVideoLabel}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <Mic className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{activeAudioLabel}</span>
            </div>
          </div>
        </div>

        {/* Security & Instruction Note */}
        <div className="mt-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Local media preview initialized successfully. No remote streaming connections active.</span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-5xl mx-auto pt-2">
        <MediaControlBar />
      </div>
    </div>
  );
};
