import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { UserCheck, Clock, ShieldAlert, PhoneCall, Coins, Check, X, Loader2 } from 'lucide-react';
import { usePrivateRequests } from '../../hooks/usePrivateRequests';
import { PrivateCallRequest } from '../../../shared/types';

interface PendingRequestsPanelProps {
  streamId: string;
  socket?: Socket | null;
  className?: string;
}

const RequestItem: React.FC<{
  request: PrivateCallRequest;
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}> = ({ request, onAccept, onReject }) => {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - request.createdAt) / 1000);
    return Math.max(0, 30 - elapsed);
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - request.createdAt) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [request.createdAt]);

  const handleAcceptClick = async () => {
    try {
      setIsProcessing(true);
      await onAccept(request.id);
    } catch {
      // Error handled in parent/hook
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = async () => {
    try {
      setIsProcessing(true);
      await onReject(request.id);
    } catch {
      // Error handled in parent/hook
    } finally {
      setIsProcessing(false);
    }
  };

  const duration = request.requestedDuration || 5;
  const cost = request.estimatedCost || duration * 50;

  return (
    <div
      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
      id={`private-request-item-${request.id}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
          <UserCheck className="w-5 h-5 text-rose-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white truncate max-w-xs">
              {request.viewerName || request.viewerEmail}
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              PENDING
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="font-medium text-slate-300">Duration: {duration} min</span>
            <span className="font-mono font-bold text-amber-400 flex items-center gap-1">
              <Coins className="w-3 h-3" />
              {cost} Coins
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Countdown Timer Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-400">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          <span>{timeLeft}s</span>
        </div>

        {/* Action Buttons: Accept & Reject */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleAcceptClick}
            disabled={isProcessing}
            id={`accept-request-btn-${request.id}`}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Accept Call Request"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Accept</span>
          </button>

          <button
            type="button"
            onClick={handleRejectClick}
            disabled={isProcessing}
            id={`reject-request-btn-${request.id}`}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600/20 hover:text-rose-400 text-slate-300 border border-slate-700 hover:border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Reject Call Request"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            <span>Reject</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const PendingRequestsPanel: React.FC<PendingRequestsPanelProps> = ({
  streamId,
  socket,
  className = '',
}) => {
  const { requests, isLoading, error, clearError, acceptRequest, rejectRequest } = usePrivateRequests({
    streamId,
    isStreamer: true,
    socket,
  });

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 ${className}`}
      id="pending-requests-panel"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Private Call Request Queue</h3>
            <p className="text-xs text-slate-400">Incoming 1-on-1 private call requests from live viewers</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950 text-slate-300 border border-slate-800">
          {requests.length} Pending
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={clearError} className="font-bold hover:text-white">
            &times;
          </button>
        </div>
      )}

      {isLoading && requests.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/50 rounded-2xl border border-slate-800">
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/50 rounded-2xl border border-slate-800/80 flex flex-col items-center gap-1">
          <ShieldAlert className="w-6 h-6 text-slate-600 mb-1" />
          <span className="font-medium text-slate-400">No Pending Requests</span>
          <span>Viewers watching your live stream can request a private 1-on-1 call</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {requests.map((request) => (
            <RequestItem
              key={request.id}
              request={request}
              onAccept={acceptRequest}
              onReject={rejectRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
};
