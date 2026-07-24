import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Radio, Server, Activity, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { APP_NAME, APP_VERSION } from '../shared/constants/constants';
import { ApiSuccessResponse } from '../shared/helpers/response';
import { apiClient } from './config/api';
import { CLIENT_CONFIG } from './config/config';
import { clientSocketOptions } from './config/socket';

export default function App() {
  const [health, setHealth] = useState<ApiSuccessResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    // Check Backend Health Endpoint (/api/v1/health) using apiClient
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

    // Initialize Socket.io Connection using CLIENT_CONFIG and clientSocketOptions
    const socket: Socket = io(CLIENT_CONFIG.socketUrl, clientSocketOptions);

    socket.on('connect', () => {
      setSocketConnected(true);
      setSocketId(socket.id || null);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      setSocketId(null);
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-2">
            <Radio className="w-6 h-6 animate-pulse text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{APP_NAME}</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Version {APP_VERSION}
          </p>
        </div>

        {/* Status Dashboard Grid */}
        <div className="grid grid-cols-1 gap-4">
          {/* Backend Status Placeholder / Live Check */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-indigo-400" />
                <span className="font-semibold text-sm text-slate-200">Backend Status Placeholder</span>
              </div>
              {healthLoading && !health ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking
                </span>
              ) : health?.success ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3.5 h-3.5" /> Unhealthy
                </span>
              )}
            </div>

            <div className="text-xs space-y-1 text-slate-400 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div><span className="text-slate-500">Endpoint:</span> GET /api/v1/health</div>
              {health ? (
                <>
                  <div><span className="text-slate-500">Message:</span> {health.message}</div>
                  <div><span className="text-slate-500">Timestamp:</span> {health.timestamp}</div>
                </>
              ) : healthError ? (
                <div className="text-rose-400"><span className="text-slate-500">Error:</span> {healthError}</div>
              ) : (
                <div><span className="text-slate-500">Status:</span> Connecting...</div>
              )}
            </div>
          </div>

          {/* Socket Status Placeholder / Live Check */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-indigo-400" />
                <span className="font-semibold text-sm text-slate-200">Socket Status Placeholder</span>
              </div>
              {socketConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Disconnected
                </span>
              )}
            </div>

            <div className="text-xs space-y-1 text-slate-400 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div><span className="text-slate-500">Protocol:</span> Socket.io Server</div>
              <div>
                <span className="text-slate-500">Status:</span>{' '}
                {socketConnected ? 'Connected to Socket Server' : 'Attempting Connection...'}
              </div>
              {socketId && (
                <div><span className="text-slate-500">Socket ID:</span> {socketId}</div>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="text-center text-xs text-slate-500 pt-2">
          LiveConnect Shared Config & Core Infrastructure &bull; EWO-002
        </div>
      </div>
    </div>
  );
}
