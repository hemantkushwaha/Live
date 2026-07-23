import React, { useState } from 'react';
import { Video, Users, Play, Plus, Radio, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StreamRoom } from '../types';

interface LobbyPageProps {
  onJoinStream: (room: StreamRoom) => void;
  onStartStream: (title: string) => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({ onJoinStream, onStartStream }) => {
  const { user } = useAuth();
  const { onlineUsers, activeStreams, startStream, joinStream } = useSocket();

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStartStreamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const room = await startStream(streamTitle.trim() || `${user?.username}'s Stream`);
      setIsStartModalOpen(false);
      onStartStream(room.title);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to start live stream');
    }
  };

  const handleJoinStreamClick = async (room: StreamRoom) => {
    try {
      await joinStream(room.id);
      onJoinStream(room);
    } catch (err: unknown) {
      console.error('Failed to join stream:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header & Quick Action */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Real-time Communications Hub
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-indigo-400">{user?.username}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Start your public video stream, watch live broadcasts, or request private 1-on-1 video calls with streamers.
          </p>
        </div>

        <div>
          <button
            onClick={() => setIsStartModalOpen(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all transform active:scale-95"
          >
            <Video className="w-5 h-5" /> Start Live Stream
          </button>
        </div>
      </div>

      {/* Main Grid: Active Streams & Online Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Streams Section (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-rose-500" />
              Active Broadcasts ({activeStreams.length})
            </h3>
          </div>

          {activeStreams.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              <Video className="w-10 h-10 mx-auto text-slate-700 mb-3" />
              <p className="text-sm font-medium text-slate-400">No active streams right now</p>
              <p className="text-xs text-slate-600 mt-1">Be the first to start a live video broadcast!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeStreams.map((room) => (
                <div
                  key={room.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> LIVE
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md">
                        <Eye className="w-3.5 h-3.5 text-slate-400" /> {room.viewers.length} viewers
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {room.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Streamer: <span className="text-slate-200 font-medium">{room.streamerName}</span>
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {room.isPausedForPrivate ? '⏸ In Private Call' : '▶ Live Broadcasting'}
                    </span>
                    <button
                      onClick={() => handleJoinStreamClick(room)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" /> Watch Stream
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Online Users List (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Online Users ({onlineUsers.length})
            </h3>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-h-[480px] overflow-y-auto space-y-2">
            {onlineUsers.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No other users currently online.</p>
            ) : (
              onlineUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {u.username} {u.id === user?.id && <span className="text-indigo-400">(You)</span>}
                      </p>
                      <p className="text-[10px] text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={u.status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Start Stream Modal */}
      {isStartModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-400" /> Start Public Stream
            </h3>

            <form onSubmit={handleStartStreamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Stream Title
                </label>
                <input
                  type="text"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="e.g. Live Q&A & Tech Discussion"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStartModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Launch Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
