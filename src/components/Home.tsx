import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Radio, Server, Activity, CheckCircle2, XCircle, Loader2, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { APP_NAME, APP_VERSION } from '../../shared/constants/constants';
import { ApiSuccessResponse } from '../../shared/helpers/response';
import { apiClient } from '../config/api';
import { CLIENT_CONFIG } from '../config/config';
import { clientSocketOptions } from '../config/socket';
import { useAuth } from '../contexts/AuthContext';
import { OnlineUsersPanel } from './presence/OnlineUsersPanel';

export const Home: React.FC = () => {
  const { user, token, logout } = useAuth();

  const [health, setHealth] = useState<ApiSuccessResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    // Check Backend Health Endpoint (/api/v1/health)
    const checkHealth = async () => {
      try {
        setHealthLoading(true);
        const res = await apiClient.get<ApiSuccessResponse>('/health');
        setHealth(res.data);
        setHealthError(null);
      } catch (err) {
        setHealthError(err instanceof Error ? err.message : 'Failed to reach health endpoint');
      } finally {
        setHealthLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);

    // Initialize Socket.io Connection
    const socketInstance: Socket = io(CLIENT_CONFIG.socketUrl, clientSocketOptions);
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setSocketConnected(true);
      setSocketId(socketInstance.id || null);
    });

    socketInstance.on('disconnect', () => {
      setSocketConnected(false);
      setSocketId(null);
    });

    return () => {
      clearInterval(interval);
      socketInstance.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    if (socket) {
      socket.disconnect();
    }
    await logout();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl space-y-6">
        {/* Header Bar with Current User Info & Logout Button */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-base">{user?.email}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <ShieldCheck className="w-3 h-3" /> Authenticated
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                User ID: {user?.id}
              </p>
            </div>
          </div>

          <button
            id="logout-button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition-all duration-150"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Logout</span>
          </button>
        </div>

        {/* Branding Sub-header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-white">{APP_NAME} Home</h1>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Version {APP_VERSION} &bull; Real-Time Online Presence (EWO-005)
          </p>
        </div>

        {/* Online Users Panel */}
        <OnlineUsersPanel socket={socket} currentUser={user} token={token} />

        {/* Status Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Backend Status Check */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-xs text-slate-200">Backend Status</span>
              </div>
              {healthLoading && !health ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Checking
                </span>
              ) : health?.success ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Healthy
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3 h-3" /> Unhealthy
                </span>
              )}
            </div>

            <div className="text-[11px] space-y-0.5 text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <div><span className="text-slate-500">Endpoint:</span> GET /api/v1/health</div>
              {health ? (
                <div><span className="text-slate-500">Status:</span> {health.message}</div>
              ) : healthError ? (
                <div className="text-rose-400"><span className="text-slate-500">Error:</span> {healthError}</div>
              ) : (
                <div><span className="text-slate-500">Status:</span> Connecting...</div>
              )}
            </div>
          </div>

          {/* Socket Status Check */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-xs text-slate-200">Socket Status</span>
              </div>
              {socketConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Loader2 className="w-3 h-3 animate-spin" /> Disconnected
                </span>
              )}
            </div>

            <div className="text-[11px] space-y-0.5 text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <div><span className="text-slate-500">Protocol:</span> Socket.io Server</div>
              {socketId && (
                <div><span className="text-slate-500">ID:</span> {socketId}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pt-2">
          LiveConnect Real-Time Online Presence &bull; EWO-005
        </div>
      </div>
    </div>
  );
};
