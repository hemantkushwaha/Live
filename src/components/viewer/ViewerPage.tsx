import React, { useEffect, useState, useRef } from 'react';
import { Users, Eye, Radio, ArrowLeft, AlertTriangle, Gift, PhoneCall, Sparkles, X, Coins } from 'lucide-react';
import { StreamRoom } from '../../../shared/types';
import { streamingService } from '../../services/streamingService';
import { PeerConnectionState } from '../../webrtc/peer/PeerConnectionManager';
import { RemoteVideo } from './RemoteVideo';
import { ConnectionIndicator } from './ConnectionIndicator';
import { ViewerControls } from './ViewerControls';
import { LoadingState } from './LoadingState';
import { PrivateRequestButton } from '../privateRequest/PrivateRequestButton';
import { TipGiftPanel } from '../economy/TipGiftPanel';
import { LiveGiftFeed } from '../economy/LiveGiftFeed';
import { PrivateViewerModal } from '../privateSession/PrivateViewerModal';
import { SessionSummaryModal } from '../privateSession/SessionSummaryModal';
import { useSignaling } from '../../contexts/SignalingContext';
import { useCreatorEconomy } from '../../hooks/useCreatorEconomy';
import { usePrivateSession } from '../../hooks/usePrivateSession';
import { SOCKET_EVENTS } from '../../../shared/events';

interface ViewerPageProps {
  stream: StreamRoom;
  onLeave: () => void;
  onOpenWallet?: () => void;
}

export const ViewerPage: React.FC<ViewerPageProps> = ({ stream, onLeave, onOpenWallet }) => {
  const { socket } = useSignaling();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<PeerConnectionState>('connecting');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [viewerCount, setViewerCount] = useState<number>(stream.viewers?.length || 0);
  const [streamEnded, setStreamEnded] = useState<boolean>(false);
  const [isPausedForPrivate, setIsPausedForPrivate] = useState<boolean>(stream.isPausedForPrivate || false);
  const [isTipPanelOpen, setIsTipPanelOpen] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const { wallet, latestTipGift } = useCreatorEconomy({
    streamId: stream.id,
    creatorId: stream.streamerId,
    socket,
  });

  const {
    activeSession: privateSession,
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

  // Sync viewer count from stream prop
  useEffect(() => {
    setViewerCount(stream.viewers?.length || 0);
  }, [stream.viewers]);

  // Timer calculation
  useEffect(() => {
    const startTime = stream.createdAt || Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [stream.createdAt]);

  // Listen to stream state switching socket events
  useEffect(() => {
    if (!socket) return;

    const handlePaused = (data: { streamId: string }) => {
      if (data?.streamId === stream.id) {
        setIsPausedForPrivate(true);
      }
    };

    const handleResumed = (data: { streamId: string }) => {
      if (data?.streamId === stream.id) {
        setIsPausedForPrivate(false);
      }
    };

    socket.on(SOCKET_EVENTS.STREAM_PAUSED_FOR_PRIVATE, handlePaused);
    socket.on(SOCKET_EVENTS.STREAM_RESUMED_FROM_PRIVATE, handleResumed);

    return () => {
      socket.off(SOCKET_EVENTS.STREAM_PAUSED_FOR_PRIVATE, handlePaused);
      socket.off(SOCKET_EVENTS.STREAM_RESUMED_FROM_PRIVATE, handleResumed);
    };
  }, [socket, stream.id]);

  // Subscribe to StreamingService remote media streams and connection states
  useEffect(() => {
    const hostPeerId = stream.streamerId;

    // Check if remote stream is already stored
    const existing = streamingService.getRemoteStream(hostPeerId);
    if (existing) {
      setRemoteStream(existing);
      setConnectionState('connected');
    }

    const unsubRemoteStream = streamingService.onRemoteStream((peerId, stream) => {
      if (peerId === hostPeerId || peerId === `stream_${hostPeerId}`) {
        setRemoteStream(stream);
      }
    });

    const unsubConnectionState = streamingService.onConnectionState((peerId, state) => {
      if (peerId === hostPeerId) {
        setConnectionState(state);
      }
    });

    const unsubStreamEnded = streamingService.onStreamEnded((endedStreamId) => {
      if (endedStreamId === stream.id || endedStreamId === `stream_${stream.streamerId}`) {
        setStreamEnded(true);
      }
    });

    return () => {
      unsubRemoteStream();
      unsubConnectionState();
      unsubStreamEnded();
    };
  }, [stream.id, stream.streamerId]);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error('Fullscreen failed', err));
    } else {
      document.exitFullscreen().catch((err) => console.error('Exit fullscreen failed', err));
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-white p-4 md:p-6 flex flex-col" id="viewer-page-container">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onLeave}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors border border-neutral-800"
            title="Back to Lobby"
            id="viewer-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> LIVE
              </span>
              <h1 className="text-lg font-bold text-white tracking-tight truncate max-w-md">{stream.title}</h1>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Host: <span className="font-medium text-neutral-200">{stream.streamerName}</span> ({stream.streamerEmail})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <ConnectionIndicator state={connectionState} />

          {/* Wallet Balance Button */}
          <button
            onClick={onOpenWallet}
            className="px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            id="viewer-wallet-btn"
            title="Open Wallet"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{(wallet?.balance ?? 1000).toLocaleString()} Coins</span>
          </button>

          {/* Send Tip / Gift Button */}
          <button
            onClick={() => setIsTipPanelOpen(!isTipPanelOpen)}
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20 border border-amber-400/30 transition-all flex items-center gap-1.5 cursor-pointer"
            id="open-tip-gift-panel-btn"
          >
            <Gift className="w-3.5 h-3.5 text-white" />
            <span>Send Tip / Gift</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300">
            <Users className="w-3.5 h-3.5 text-rose-500" />
            <span>{viewerCount} Viewers</span>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-400">
            {formatDuration(elapsedSeconds)}
          </div>
        </div>
      </div>

      {/* Main Player Display Area */}
      <div ref={containerRef} className="flex-1 flex flex-col justify-center max-w-5xl w-full mx-auto relative min-h-[400px]">
        {/* Banner if streamer is temporarily in a private session */}
        {isPausedForPrivate && !streamEnded && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-4 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-amber-200 text-sm">Creator is currently in a private session</h4>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  Public broadcast is temporarily paused. The stream will automatically resume once the 1-on-1 private call completes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notification Overlay when Host Ends Stream */}
        {streamEnded ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center max-w-md mx-auto my-auto shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Live Stream Ended</h3>
            <p className="text-sm text-neutral-400 mb-6">
              The host <span className="font-semibold text-neutral-200">{stream.streamerName}</span> has concluded this live stream session.
            </p>
            <button
              onClick={onLeave}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg"
              id="viewer-return-lobby-btn"
            >
              Return to Lobby
            </button>
          </div>
        ) : connectionState === 'connecting' && !remoteStream ? (
          <LoadingState
            title="Connecting to Host Stream"
            message={`Negotiating peer-to-peer WebRTC video pipeline with ${stream.streamerName}...`}
          />
        ) : (
          <div className="relative flex-1 flex flex-col justify-center">
            {/* Animated Gift Overlay */}
            <LiveGiftFeed latestTipGift={latestTipGift} />

            <RemoteVideo
              stream={remoteStream}
              isMuted={isAudioMuted}
              onMuteToggle={() => setIsAudioMuted(!isAudioMuted)}
              className="w-full aspect-video max-h-[70vh] shadow-2xl border border-neutral-800"
            />

            <ViewerControls
              isMuted={isAudioMuted}
              onToggleMute={() => setIsAudioMuted(!isAudioMuted)}
              onToggleFullscreen={handleToggleFullscreen}
              onLeaveStream={onLeave}
              className="mt-4"
            />

            {/* Tip & Gift Modal/Panel */}
            {isTipPanelOpen && (
              <div className="mt-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setIsTipPanelOpen(false)}
                    className="p-1 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <TipGiftPanel
                  streamId={stream.id}
                  creatorId={stream.streamerId}
                  creatorName={stream.streamerName}
                  socket={socket}
                  onClose={() => setIsTipPanelOpen(false)}
                />
              </div>
            )}

            {/* Private Call Request Section (EWO-011 & PRD Amendment 2) */}
            <div className="mt-4">
              <PrivateRequestButton
                streamId={stream.id}
                creatorId={stream.streamerId}
                creatorName={stream.streamerName}
                socket={socket}
                onOpenTipPanel={() => setIsTipPanelOpen(true)}
                onOpenWallet={onOpenWallet}
              />
            </div>
          </div>
        )}
      </div>

      {/* Session Summary Modal on Completion for Viewer */}
      {sessionSummary && (
        <SessionSummaryModal
          summary={sessionSummary}
          isCreator={false}
          onClose={dismissSummary}
        />
      )}

      {/* Active Private 1-on-1 Call Session Modal for Accepted Viewer */}
      {privateSession && (
        <PrivateViewerModal
          session={privateSession}
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
          onLeaveCall={endPrivateSession}
        />
      )}
    </div>
  );
};
