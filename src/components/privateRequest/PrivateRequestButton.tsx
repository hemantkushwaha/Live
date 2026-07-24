import React, { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { PhoneCall, XCircle, Clock, AlertCircle, Coins, Sparkles, ShieldAlert, Loader2, CheckCircle2, X } from 'lucide-react';
import { usePrivateRequests } from '../../hooks/usePrivateRequests';
import { privateRequestClient } from '../../services/privateRequestClient';
import { creatorEconomyClient } from '../../services/creatorEconomyClient';
import { PrivateCallSettings, UserWallet } from '../../../shared/types';

interface PrivateRequestButtonProps {
  streamId: string;
  creatorId: string;
  creatorName?: string;
  socket?: Socket | null;
  onOpenWallet?: () => void;
  className?: string;
}

export const PrivateRequestButton: React.FC<PrivateRequestButtonProps> = ({
  streamId,
  creatorId,
  creatorName = 'Creator',
  socket,
  onOpenWallet,
  className = '',
}) => {
  const { pendingRequest, requestStatus, isLoading, error, clearError, clearRequestState, sendRequest, cancelRequest } =
    usePrivateRequests({ streamId, isStreamer: false, socket });

  const [settings, setSettings] = useState<PrivateCallSettings | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [requestedDuration, setRequestedDuration] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);

  // Load creator settings and viewer wallet
  const loadData = useCallback(async () => {
    if (!creatorId) return;
    try {
      setIsFetchingData(true);
      const [sData, wData] = await Promise.all([
        privateRequestClient.getSettings(creatorId).catch(() => ({
          creatorId,
          enabled: true,
          minCoins: 100,
          pricePerMinute: 50,
          maxDuration: 10,
          busyMode: false,
        })),
        creatorEconomyClient.getWallet().catch(() => null),
      ]);
      setSettings(sData);
      setWallet(wData);
      if (sData?.maxDuration && requestedDuration > sData.maxDuration) {
        setRequestedDuration(sData.maxDuration);
      }
    } catch {
      // Ignore
    } finally {
      setIsFetchingData(false);
    }
  }, [creatorId]);

  useEffect(() => {
    loadData();
  }, [loadData, pendingRequest]);

  // 30-second countdown for pending request
  useEffect(() => {
    if (!pendingRequest || (requestStatus && requestStatus !== 'Pending')) {
      setTimeLeft(0);
      return;
    }

    const calculateTime = () => {
      const elapsed = Math.floor((Date.now() - pendingRequest.createdAt) / 1000);
      return Math.max(0, 30 - elapsed);
    };

    setTimeLeft(calculateTime());

    const interval = setInterval(() => {
      const remaining = calculateTime();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingRequest, requestStatus]);

  const pricePerMin = settings?.pricePerMinute ?? 50;
  const minCoins = settings?.minCoins ?? 100;
  const maxDur = settings?.maxDuration ?? 10;
  const estimatedCost = requestedDuration * pricePerMin;
  const userBalance = wallet?.balance ?? 1000;

  const isEnabled = settings?.enabled ?? true;
  const isBusy = settings?.busyMode ?? false;
  const hasMinCoins = userBalance >= minCoins;
  const hasEnoughForCost = userBalance >= estimatedCost;

  const canRequest = isEnabled && !isBusy && hasMinCoins && hasEnoughForCost;

  const handleSend = async () => {
    try {
      clearError();
      await sendRequest(requestedDuration);
      await loadData();
    } catch {
      // Error set in hook
    }
  };

  const handleCancel = async () => {
    try {
      clearError();
      await cancelRequest();
      await loadData();
    } catch {
      // Error set in hook
    }
  };

  const currentStatus = requestStatus || pendingRequest?.status;

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-4 shadow-xl ${className}`}
      id="private-request-viewer-container"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">1-on-1 Private Call Request</h4>
            <p className="text-[11px] text-slate-400">Request a private call with {creatorName}</p>
          </div>
        </div>
        <div className="text-right font-mono text-xs">
          <span className="text-slate-400">Rate: </span>
          <span className="font-bold text-amber-400">{pricePerMin} Coins/min</span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={clearError} className="text-rose-400 hover:text-white font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Pricing & Eligibility Rules Info (When no request active) */}
      {!pendingRequest && !currentStatus && (
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">Min Coins Required</span>
              <span className="font-mono font-bold text-amber-400">{minCoins} Coins</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">Your Wallet Balance</span>
              <span className="font-mono font-bold text-amber-400">{userBalance} Coins</span>
            </div>
          </div>

          {!isEnabled && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Creator has currently disabled private call requests.</span>
            </div>
          )}

          {isEnabled && isBusy && (
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Creator is currently busy.</span>
            </div>
          )}

          {isEnabled && !isBusy && !hasMinCoins && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center justify-between">
              <span>Requires at least {minCoins} Coins balance</span>
              {onOpenWallet && (
                <button
                  type="button"
                  onClick={onOpenWallet}
                  className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px]"
                >
                  Top Up
                </button>
              )}
            </div>
          )}

          {/* Duration Selector & Estimated Cost */}
          {isEnabled && !isBusy && (
            <div className="space-y-2 pt-1 border-t border-slate-900">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Requested Duration</label>
                <span className="font-mono font-bold text-white">{requestedDuration} Minutes</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max={maxDur}
                  value={requestedDuration}
                  onChange={(e) => setRequestedDuration(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] text-amber-300 font-medium">Estimated Cost</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {estimatedCost} Coins
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Request Display according to Status */}
      {!pendingRequest && !currentStatus ? (
        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading || isFetchingData || !canRequest}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:from-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          id="request-private-call-btn"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PhoneCall className="w-4 h-4" />
          )}
          <span>Request Private Call ({estimatedCost} Coins)</span>
        </button>
      ) : currentStatus === 'Accepted' || currentStatus === 'accepted' ? (
        <div
          className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-3"
          id="request-status-accepted"
        >
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              ACCEPTED
            </span>
            <span className="text-xs text-emerald-400 font-bold">Request Approved!</span>
          </div>

          <p className="text-xs text-slate-300">
            {creatorName} has accepted your 1-on-1 private call request.
          </p>

          <div className="text-xs text-slate-300 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-emerald-500/20">
            <div className="flex justify-between">
              <span className="text-slate-400">Duration:</span>
              <span className="font-mono font-bold">{pendingRequest?.requestedDuration || requestedDuration} Mins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Cost:</span>
              <span className="font-mono font-bold text-amber-400">{pendingRequest?.estimatedCost || estimatedCost} Coins</span>
            </div>
          </div>
        </div>
      ) : currentStatus === 'Rejected' || currentStatus === 'rejected' ? (
        <div
          className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 space-y-3"
          id="request-status-rejected"
        >
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              REJECTED
            </span>
            <button
              type="button"
              onClick={clearRequestState}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>

          <p className="text-xs text-rose-300">
            Your private call request was rejected by {creatorName}.
          </p>

          <button
            type="button"
            onClick={clearRequestState}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : currentStatus === 'Expired' || currentStatus === 'expired' ? (
        <div
          className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 space-y-3"
          id="request-status-expired"
        >
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              EXPIRED
            </span>
            <button
              type="button"
              onClick={clearRequestState}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>

          <p className="text-xs text-amber-300">
            Your request timed out without a response.
          </p>

          <button
            type="button"
            onClick={clearRequestState}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Send New Request
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3" id="request-status-pending">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              PENDING REQUEST
            </span>
            <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-xs">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Expires in {timeLeft}s</span>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Duration:</span>
              <span className="font-mono font-bold">{pendingRequest?.requestedDuration || requestedDuration} Mins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Cost:</span>
              <span className="font-mono font-bold text-amber-400">{pendingRequest?.estimatedCost || estimatedCost} Coins</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            id="cancel-private-request-btn"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>{isLoading ? 'Cancelling...' : 'Cancel Request'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
