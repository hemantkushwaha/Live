import React, { useEffect, useRef, useState } from 'react';
import { VideoOff, Radio, Gift, Coins, Wallet, TrendingUp } from 'lucide-react';
import { StreamRoom, TipGiftRecord } from '../../../shared/types';
import { useMedia } from '../../contexts/MediaContext';
import { LiveStatusCard } from './LiveStatusCard';
import { CreatorStats } from './CreatorStats';
import { QuickActions } from './QuickActions';
import { CreatorProfileCard } from './CreatorProfileCard';
import { GiftHistory } from '../economy/GiftHistory';
import { LiveGiftFeed } from '../economy/LiveGiftFeed';
import { WalletBalanceWidget } from '../economy/WalletBalanceWidget';
import { PendingRequestsPanel } from '../privateRequest/PendingRequestsPanel';
import { PrivateCallSettingsCard } from '../privateRequest/PrivateCallSettingsCard';
import { PrivateSessionPanel } from '../privateSession/PrivateSessionPanel';
import { SessionSummaryModal } from '../privateSession/SessionSummaryModal';
import { CreatorEarningsDashboard } from '../analytics/CreatorEarningsDashboard';
import { useCreatorEconomy } from '../../hooks/useCreatorEconomy';
import { usePrivateSession } from '../../hooks/usePrivateSession';
import { useSignaling } from '../../contexts/SignalingContext';


interface CreatorDashboardProps {
  currentStream: StreamRoom;
  onEndStream: () => Promise<void>;
  isEndingStream: boolean;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  currentStream,
  onEndStream,
  isEndingStream,
}) => {
  const { socket } = useSignaling();
  const { wallet, tipGifts, latestTipGift } = useCreatorEconomy({
    streamId: currentStream.id,
    creatorId: currentStream.streamerId,
    socket,
  });

  const {
    activeSession,
    sessionSummary,
    timerData,
    warningMessage,
    remoteStream: privateRemoteStream,
    localStream: privateLocalStream,
    connectionState: privateConnectionState,
    durationSeconds: privateDurationSeconds,
    isAudioMuted: privateAudioMuted,
    isVideoDisabled: privateVideoDisabled,
    dismissSummary,
    endPrivateSession,
    toggleAudio: togglePrivateAudio,
    toggleVideo: togglePrivateVideo,
  } = usePrivateSession({ socket });

  const {
    stream,
    isAudioMuted,
    isVideoDisabled,
    toggleAudio,
    toggleVideo,
    resolution,
    activeVideoLabel,
    activeAudioLabel,
  } = useMedia();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showEarningsDashboard, setShowEarningsDashboard] = useState<boolean>(false);

  useEffect(() => {

    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, isVideoDisabled]);

  const currentViewers = currentStream.viewers?.length || 0;
  const peakViewers = Math.max(currentStream.peakViewers || 0, currentViewers);

  // Calculate total coins earned in this stream
  const streamEarningsCoins = tipGifts.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300" id="creator-dashboard-container">
      {/* Session Summary Modal on Completion */}
      {sessionSummary && (
        <SessionSummaryModal
          summary={sessionSummary}
          isCreator={true}
          onClose={dismissSummary}
        />
      )}

      {/* Active Private 1-on-1 Call Session Panel */}
      {activeSession && (
        <PrivateSessionPanel
          session={activeSession}
          remoteStream={privateRemoteStream}
          localStream={privateLocalStream}
          connectionState={privateConnectionState}
          durationSeconds={privateDurationSeconds}
          timerData={timerData}
          warningMessage={warningMessage}
          isAudioMuted={privateAudioMuted}
          isVideoDisabled={privateVideoDisabled}
          onToggleAudio={togglePrivateAudio}
          onToggleVideo={togglePrivateVideo}
          onEndCall={endPrivateSession}
        />
      )}

      {/* Live Status Header Card */}
      <LiveStatusCard
        streamTitle={currentStream.title}
        creatorName={currentStream.streamerName}
        isPausedForPrivate={currentStream.isPausedForPrivate}
        startedAt={currentStream.createdAt}
      />

      {/* Live Statistics Row */}
      <CreatorStats
        currentViewers={currentViewers}
        peakViewers={peakViewers}
        isPausedForPrivate={currentStream.isPausedForPrivate}
        resolution={resolution}
      />

      {/* Main Grid: Video Stream Monitor & Sidebar Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Live Video Monitor & Earnings */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Live Broadcast Feed</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {resolution ? `${resolution.width}x${resolution.height}` : '720p'}
              </span>
            </div>

            <div className="relative aspect-video w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
              {/* Overlay animated gift banner */}
              <LiveGiftFeed latestTipGift={latestTipGift} />

              {stream && !isVideoDisabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <VideoOff className="w-12 h-12 text-rose-400" />
                  <p className="text-sm font-semibold text-slate-300">Camera Feed Paused</p>
                  <p className="text-xs text-slate-500">Your camera is currently off, but live broadcast remains active.</p>
                </div>
              )}

              {/* Device Track Labels Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-[11px] font-mono text-slate-300 pointer-events-none bg-slate-950/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-800/80">
                <div className="truncate">{activeVideoLabel}</div>
                <div className="truncate">{activeAudioLabel}</div>
              </div>
            </div>
          </div>

          {/* Stream Earnings Summary Banner */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stream Earnings</p>
                <p className="text-xl font-bold font-mono text-amber-400">
                  {streamEarningsCoins} <span className="text-xs font-normal">Coins</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEarningsDashboard(!showEarningsDashboard)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                id="view-earnings-dashboard-btn"
              >
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>{showEarningsDashboard ? 'Hide Analytics' : 'Earnings Dashboard'}</span>
              </button>
              <WalletBalanceWidget wallet={wallet} className="max-w-xs" />
            </div>
          </div>

          {/* Full Earnings Analytics Dashboard Section */}
          {showEarningsDashboard && (
            <div className="p-2 rounded-3xl bg-slate-950/80 border border-indigo-500/30">
              <CreatorEarningsDashboard onBack={() => setShowEarningsDashboard(false)} />
            </div>
          )}

          {/* Incoming Private Call Request Queue */}
          <PendingRequestsPanel
            streamId={currentStream.id}
            socket={socket}
          />
        </div>

        {/* Right 1 Col: Creator Profile Card, Private Call Settings & Live Gift History */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <CreatorProfileCard
            creatorName={currentStream.streamerName}
            creatorEmail={currentStream.streamerEmail}
            streamTitle={currentStream.title}
          />

          <PrivateCallSettingsCard
            creatorId={currentStream.streamerId}
          />

          <GiftHistory
            history={tipGifts}
            title="Live Stream Gifts & Tips"
          />
        </div>
      </div>

      {/* Quick Controls Section */}
      <QuickActions
        isAudioMuted={isAudioMuted}
        isVideoDisabled={isVideoDisabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onEndStream={onEndStream}
        isEndingStream={isEndingStream}
      />
    </div>
  );
};
