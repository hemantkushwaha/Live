import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { CallSession, CallSessionSummary, PrivateSessionState } from '../../shared/types';
import { SOCKET_EVENTS } from '../../shared/events';
import { PrivateCallEngine } from '../webrtc/PrivateCallEngine';
import { PeerConnectionState } from '../webrtc/peer/PeerConnectionManager';
import { useAuth } from '../contexts/AuthContext';
import { useMedia } from '../contexts/MediaContext';

interface UsePrivateSessionOptions {
  socket: Socket | null;
}

export interface PrivateSessionTimerData {
  elapsedTime: number;
  remainingTime: number;
  currentCost: number;
  coinsRemaining: number;
  state: PrivateSessionState;
}

export function usePrivateSession({ socket }: UsePrivateSessionOptions) {
  const { user } = useAuth();
  const { stream: mediaContextStream } = useMedia();

  const [activeSession, setActiveSession] = useState<CallSession | null>(null);
  const [sessionSummary, setSessionSummary] = useState<CallSessionSummary | null>(null);
  const [timerData, setTimerData] = useState<PrivateSessionTimerData>({
    elapsedTime: 0,
    remainingTime: 300,
    currentCost: 0,
    coinsRemaining: 1000,
    state: 'Connecting',
  });
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<PeerConnectionState>('new');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState<boolean>(false);

  const engineRef = useRef<PrivateCallEngine | null>(null);

  // Clean up private call session engine
  const cleanupSession = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.close();
      engineRef.current = null;
    }

    setActiveSession(null);
    setRemoteStream(null);
    setLocalStream(null);
    setConnectionState('closed');
    setDurationSeconds(0);
    setIsAudioMuted(false);
    setIsVideoDisabled(false);
    setWarningMessage(null);
  }, []);

  const dismissSummary = useCallback(() => {
    setSessionSummary(null);
  }, []);

  // Socket event listeners for session lifecycle & billing
  useEffect(() => {
    if (!socket || !user) return;

    const handlePrivateStarted = async (data: {
      session: CallSession;
      sessionId: string;
      creatorId: string;
      viewerId: string;
    }) => {
      const session = data?.session || {
        id: data.sessionId,
        creatorId: data.creatorId,
        viewerId: data.viewerId,
        startedAt: Date.now(),
        status: 'active',
        state: 'Connecting',
        active: true,
      };

      // Check if current user is participant (creator or viewer)
      if (user.id !== session.creatorId && user.id !== session.viewerId) {
        return;
      }

      console.log('[usePrivateSession] Private session started:', session);
      setActiveSession(session);
      setSessionSummary(null);
      setWarningMessage(null);
      setConnectionState('connecting');

      const isHost = user.id === session.creatorId;
      const targetUserId = isHost ? session.viewerId : session.creatorId;

      // Instantiate private WebRTC engine
      const engine = new PrivateCallEngine(
        session.id,
        targetUserId,
        isHost,
        socket,
        {
          onRemoteStream: (stream) => {
            console.log('[usePrivateSession] Remote stream received in hook');
            setRemoteStream(stream);
          },
          onLocalStream: (stream) => {
            setLocalStream(stream);
          },
          onConnectionStateChange: (state) => {
            setConnectionState(state);
          },
          onError: (err) => {
            console.error('[usePrivateSession] Engine error:', err);
          },
        }
      );

      engineRef.current = engine;

      // Start engine with local media stream
      await engine.start(isHost ? mediaContextStream : null);
    };

    const handlePrivateTimer = (data: {
      sessionId: string;
      elapsedTime: number;
      remainingTime: number;
      currentCost: number;
      coinsRemaining: number;
      state: PrivateSessionState;
    }) => {
      if (!data) return;
      setDurationSeconds(data.elapsedTime || 0);
      setTimerData({
        elapsedTime: data.elapsedTime || 0,
        remainingTime: data.remainingTime || 0,
        currentCost: data.currentCost || 0,
        coinsRemaining: data.coinsRemaining || 0,
        state: data.state || 'Active',
      });
    };

    const handlePrivateWarning = (data: { sessionId: string; remainingTime: number; message: string }) => {
      if (!data) return;
      console.log('[usePrivateSession] Received private call warning:', data);
      setWarningMessage(data.message || '30 seconds remaining in call!');
    };

    const handlePrivateCompleted = (data: {
      sessionId: string;
      session: CallSession;
      summary: CallSessionSummary;
    }) => {
      console.log('[usePrivateSession] Private session completed:', data);
      if (data?.summary) {
        setSessionSummary(data.summary);
      }
      cleanupSession();
    };

    const handlePrivateEnded = (data: { sessionId: string }) => {
      console.log('[usePrivateSession] Private session ended:', data);
      cleanupSession();
    };

    socket.on(SOCKET_EVENTS.PRIVATE_STARTED, handlePrivateStarted);
    socket.on(SOCKET_EVENTS.PRIVATE_CALL_STARTED, handlePrivateStarted);
    socket.on(SOCKET_EVENTS.PRIVATE_TIMER, handlePrivateTimer);
    socket.on(SOCKET_EVENTS.PRIVATE_WARNING, handlePrivateWarning);
    socket.on(SOCKET_EVENTS.PRIVATE_COMPLETED, handlePrivateCompleted);
    socket.on(SOCKET_EVENTS.PRIVATE_ENDED, handlePrivateEnded);
    socket.on(SOCKET_EVENTS.PRIVATE_CALL_ENDED, handlePrivateEnded);

    return () => {
      socket.off(SOCKET_EVENTS.PRIVATE_STARTED, handlePrivateStarted);
      socket.off(SOCKET_EVENTS.PRIVATE_CALL_STARTED, handlePrivateStarted);
      socket.off(SOCKET_EVENTS.PRIVATE_TIMER, handlePrivateTimer);
      socket.off(SOCKET_EVENTS.PRIVATE_WARNING, handlePrivateWarning);
      socket.off(SOCKET_EVENTS.PRIVATE_COMPLETED, handlePrivateCompleted);
      socket.off(SOCKET_EVENTS.PRIVATE_ENDED, handlePrivateEnded);
      socket.off(SOCKET_EVENTS.PRIVATE_CALL_ENDED, handlePrivateEnded);
    };
  }, [socket, user, mediaContextStream, cleanupSession]);

  /**
   * Creator or client initiates private session after accepting request
   */
  const startPrivateSession = useCallback(
    (requestId: string) => {
      if (!socket || !requestId) return;
      console.log('[usePrivateSession] Emitting private:start for request:', requestId);
      socket.emit(SOCKET_EVENTS.PRIVATE_START, { requestId });
    },
    [socket]
  );

  /**
   * User manually ends the active private session
   */
  const endPrivateSession = useCallback(() => {
    if (!socket || !activeSession) {
      cleanupSession();
      return;
    }

    console.log('[usePrivateSession] Emitting private:end for session:', activeSession.id);
    socket.emit(SOCKET_EVENTS.PRIVATE_END, { sessionId: activeSession.id });
    cleanupSession();
  }, [socket, activeSession, cleanupSession]);

  /**
   * Toggle audio mute
   */
  const toggleAudio = useCallback(() => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    if (engineRef.current) {
      engineRef.current.toggleAudio(nextState);
    }
  }, [isAudioMuted]);

  /**
   * Toggle video disable
   */
  const toggleVideo = useCallback(() => {
    const nextState = !isVideoDisabled;
    setIsVideoDisabled(nextState);
    if (engineRef.current) {
      engineRef.current.toggleVideo(nextState);
    }
  }, [isVideoDisabled]);

  return {
    activeSession,
    sessionSummary,
    timerData,
    warningMessage,
    remoteStream,
    localStream,
    connectionState,
    durationSeconds,
    isAudioMuted,
    isVideoDisabled,
    dismissSummary,
    startPrivateSession,
    endPrivateSession,
    toggleAudio,
    toggleVideo,
  };
}
