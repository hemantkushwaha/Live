import React, { useEffect, useRef } from 'react';
import { Video, VideoOff, MicOff } from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  muted?: boolean;
  title?: string;
  subtitle?: string;
  aspectRatio?: 'video' | 'square';
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  isLocal = false,
  muted = false,
  title,
  subtitle,
  aspectRatio = 'video',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().some((t) => t.enabled);

  return (
    <div className={`relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg ${
      aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'
    } flex items-center justify-center`}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || muted}
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
          <div className="p-4 bg-slate-800/80 rounded-full mb-3 text-slate-400">
            <VideoOff className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-slate-300">{title || 'No Video Feed Available'}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
      )}

      {/* Video Overlay Badges */}
      {(title || isLocal) && (
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800/80">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-200">{isLocal ? 'Your Video (Local)' : title}</span>
        </div>
      )}
    </div>
  );
};
