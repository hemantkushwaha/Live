import React, { useState } from 'react';
import { Video, Tv, Radio, Loader2, AlertCircle, PlusCircle } from 'lucide-react';
import { StreamRoom } from '../../../shared/types';
import { useStream } from '../../contexts/StreamContext';
import { useAuth } from '../../contexts/AuthContext';
import { StreamCard } from '../stream/StreamCard';

interface ActiveStreamsPanelProps {
  activeStreams: StreamRoom[];
  onSelectStream?: (stream: StreamRoom) => void;
}

export const ActiveStreamsPanel: React.FC<ActiveStreamsPanelProps> = ({ activeStreams, onSelectStream }) => {
  const { user } = useAuth();
  const { startStream, isStartingStream, isStreaming, currentStream, streamError, clearStreamError } = useStream();

  const [customTitle, setCustomTitle] = useState<string>('');
  const [showTitleInput, setShowTitleInput] = useState<boolean>(false);

  const handleStartStream = async () => {
    const success = await startStream(customTitle || undefined);
    if (success) {
      setShowTitleInput(false);
      setCustomTitle('');
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header & Go Live Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">Active Live Streams</h2>
            <p className="text-[11px] text-slate-400">Public live streams currently broadcasting</p>
          </div>
        </div>

        {/* Go Live Action Button */}
        {!isStreaming && (
          <div className="flex flex-col sm:items-end">
            {!showTitleInput ? (
              <button
                id="go-live-button"
                onClick={() => setShowTitleInput(true)}
                disabled={isStartingStream}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-600 text-white border border-indigo-500/30 text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                title="Start a public live stream"
              >
                <Video className="w-4 h-4 text-white" />
                <span>Go Live</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Stream title (optional)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartStream()}
                  className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none w-48"
                  autoFocus
                />
                <button
                  id="confirm-start-stream"
                  onClick={handleStartStream}
                  disabled={isStartingStream}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isStartingStream ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Radio className="w-3.5 h-3.5" />
                  )}
                  <span>Start</span>
                </button>
                <button
                  onClick={() => {
                    setShowTitleInput(false);
                    clearStreamError();
                  }}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
            <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <Radio className="w-3 h-3 text-rose-500 animate-pulse" /> Public Stream Registration
            </span>
          </div>
        )}
      </div>

      {/* Stream Error Alert Banner */}
      {streamError && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-rose-200">Stream Error: </span>
            <span>{streamError}</span>
          </div>
          <button
            onClick={clearStreamError}
            className="text-rose-400 hover:text-white text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Streams Grid or Empty State */}
      {activeStreams.length === 0 ? (
        <div className="py-12 px-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">No active live streams</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              When users click "Go Live", public live stream cards will appear here in real-time.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeStreams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              isHost={user ? stream.streamerId === user.id : false}
              onSelectStream={onSelectStream}
            />
          ))}
        </div>
      )}
    </div>
  );
};
