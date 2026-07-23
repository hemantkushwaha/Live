import React from 'react';
import { Radio, LogOut, User as UserIcon, Shield, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { StatusBadge } from '../ui/StatusBadge';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
          <Radio className="w-5 h-5" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            LiveConnect
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              v1.0 MVP
            </span>
          </span>
        </div>
      </div>

      {/* User Context & Socket Connection Indicator */}
      {user && (
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Wifi className="w-3.5 h-3.5" /> Socket Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <WifiOff className="w-3.5 h-3.5" /> Reconnecting...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 p-1.5 pl-3 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs uppercase">
                {user.username.substring(0, 2)}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-slate-200 leading-none">{user.username}</p>
                <p className="text-[11px] text-slate-400 leading-none mt-1">{user.email}</p>
              </div>
            </div>

            <StatusBadge status={user.status} size="sm" />

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
