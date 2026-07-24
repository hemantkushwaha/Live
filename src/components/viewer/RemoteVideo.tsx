import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, VideoOff } from 'lucide-react';

interface RemoteVideoProps {
  stream: MediaStream | null;
  isMuted?: boolean;
  onMuteToggle?: () => void;
  className?: string;
}

export const RemoteVideo: React.FC<RemoteVideoProps> = ({
  stream,
  isMuted = false,
  onMuteToggle,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playError, setPlayError] = useState<string | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream) {
      videoElement.srcObject = stream;
      setPlayError(null);

      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('[RemoteVideo] Autoplay blocked or interrupted:', err);
            setPlayError('Click play to view live stream');
            setIsPlaying(false);
          });
      }
    } else {
      videoElement.srcObject = null;
      setIsPlaying(false);
    }
  }, [stream]);

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setPlayError(null);
        })
        .catch((err) => {
          console.error('[RemoteVideo] Manual play failed:', err);
        });
    }
  };

  return (
    <div className={`relative bg-neutral-950 overflow-hidden rounded-xl flex items-center justify-center ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover"
        id="remote-video-element"
      />

      {/* Manual play overlay if autoplay was blocked */}
      {playError && (
        <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10 p-6 text-center">
          <p className="text-sm font-medium mb-3">{playError}</p>
          <button
            onClick={handleManualPlay}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm rounded-lg shadow-lg transition-colors"
          >
            Start Video Playback
          </button>
        </div>
      )}

      {/* Placeholder when no remote stream is available yet */}
      {!stream && !playError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 bg-neutral-900 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-3 animate-pulse">
            <VideoOff className="w-8 h-8 text-neutral-500" />
          </div>
          <p className="text-sm font-medium text-neutral-300">Waiting for remote host video track...</p>
          <p className="text-xs text-neutral-500 mt-1">Establishing peer-to-peer media pipeline</p>
        </div>
      )}

      {/* Quick audio toggle overlay */}
      {onMuteToggle && isPlaying && (
        <button
          onClick={onMuteToggle}
          className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          id="remote-video-mute-toggle"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      )}
    </div>
  );
};
