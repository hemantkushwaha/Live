import React from 'react';
import { Volume2, VolumeX, Maximize2, LogOut } from 'lucide-react';

interface ViewerControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onLeaveStream: () => void;
  className?: string;
}

export const ViewerControls: React.FC<ViewerControlsProps> = ({
  isMuted,
  onToggleMute,
  onToggleFullscreen,
  onLeaveStream,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-3 p-3 bg-neutral-900/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-xl border border-neutral-800 ${className}`}
      id="viewer-controls-bar"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMute}
          className={`p-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
              : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
          }`}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          id="viewer-mute-btn"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span className="hidden sm:inline text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-2.5 rounded-lg text-sm font-medium bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition-colors flex items-center gap-2"
          title="Toggle Fullscreen"
          id="viewer-fullscreen-btn"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Fullscreen</span>
        </button>
      </div>

      <button
        onClick={onLeaveStream}
        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        id="viewer-leave-btn"
      >
        <LogOut className="w-4 h-4" />
        <span>Leave Stream</span>
      </button>
    </div>
  );
};
