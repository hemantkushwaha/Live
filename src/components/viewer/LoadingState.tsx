import React from 'react';
import { Loader2, Radio } from 'lucide-react';

interface LoadingStateProps {
  title?: string;
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Connecting to Live Broadcast...',
  message = 'Exchanging WebRTC SDP offers and establishing peer connection media pipeline.',
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center p-12 bg-neutral-900 border border-neutral-800 rounded-2xl text-center shadow-xl"
      id="viewer-loading-state"
    >
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
          <Radio className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-neutral-900 p-1 rounded-full">
          <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-xs text-neutral-400 max-w-sm leading-relaxed mb-4">{message}</p>

      <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono bg-neutral-950/60 px-3 py-1.5 rounded-md border border-neutral-800">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        <span>P2P Media Transport Negotiation</span>
      </div>
    </div>
  );
};
