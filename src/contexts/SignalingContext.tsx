import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useStream } from './StreamContext';
import { useMedia } from './MediaContext';
import { SignalingEngine } from '../webrtc/SignalingEngine';
import { PeerConnectionState } from '../webrtc/peer/PeerConnectionManager';
import { streamingService } from '../services/streamingService';
import { CLIENT_CONFIG } from '../config/config';
import { clientSocketOptions } from '../config/socket';

export interface PeerStateInfo {
  peerId: string;
  state: PeerConnectionState;
  updatedAt: number;
}

interface SignalingContextType {
  peerStates: Record<string, PeerStateInfo>;
  isSignalingActive: boolean;
  joinStreamSignaling: (streamId: string) => void;
  leaveStreamSignaling: () => void;
  signalingLogs: string[];
  socket: Socket | null;
}

const SignalingContext = createContext<SignalingContextType | undefined>(undefined);

export const SignalingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const { isStreaming, currentStream } = useStream();
  const { stream: localMediaStream } = useMedia();

  const [peerStates, setPeerStates] = useState<Record<string, PeerStateInfo>>({});
  const [isSignalingActive, setIsSignalingActive] = useState<boolean>(false);
  const [signalingLogs, setSignalingLogs] = useState<string[]>([]);

  const engineRef = useRef<SignalingEngine | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSignalingLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Keep streamingService updated with local media stream
  useEffect(() => {
    streamingService.setLocalStream(localMediaStream);
  }, [localMediaStream]);

  // Initialize socket and signaling engine
  useEffect(() => {
    if (!token || !user) return;

    const socket = io(CLIENT_CONFIG.socketUrl, clientSocketOptions);
    socketRef.current = socket;

    const engine = new SignalingEngine(socket, user.id, {
      onConnectionStateChange: (peerId, state) => {
        streamingService.handleConnectionStateChange(peerId, state);
        setPeerStates((prev) => ({
          ...prev,
          [peerId]: { peerId, state, updatedAt: Date.now() },
        }));
        addLog(`Peer ${peerId} connection state changed to '${state}'`);
      },
      onRemoteStream: (peerId, remoteStream) => {
        streamingService.handleRemoteStream(peerId, remoteStream);
        addLog(`Received remote stream from peer ${peerId}`);
      },
      onStreamEnded: (streamId) => {
        streamingService.handleStreamEnded(streamId);
        addLog(`Stream ${streamId} ended by host`);
      },
      onError: (peerId, error) => {
        addLog(`Error on peer ${peerId}: ${error.message}`);
      },
    });

    streamingService.bindSignalingEngine(engine);
    engineRef.current = engine;
    setIsSignalingActive(true);
    addLog(`Signaling Engine initialized for user ${user.email}`);

    return () => {
      engine.destroy();
      socket.disconnect();
      engineRef.current = null;
      socketRef.current = null;
      setIsSignalingActive(false);
    };
  }, [token, user]);

  // Automatically start hosting signaling when user goes live
  useEffect(() => {
    if (isStreaming && currentStream && engineRef.current) {
      if (localMediaStream) {
        engineRef.current.setLocalMediaStream(localMediaStream);
      }
      engineRef.current.startHosting(currentStream.id);
      addLog(`Hosting WebRTC signaling active for stream: ${currentStream.title}`);
    }
  }, [isStreaming, currentStream, localMediaStream]);

  const joinStreamSignaling = (streamId: string) => {
    if (engineRef.current) {
      streamingService.joinStream(streamId);
      addLog(`Joined WebRTC signaling for stream ${streamId}`);
    }
  };

  const leaveStreamSignaling = () => {
    if (engineRef.current) {
      streamingService.leaveStream();
      setPeerStates({});
      addLog('Left WebRTC stream signaling');
    }
  };

  return (
    <SignalingContext.Provider
      value={{
        peerStates,
        isSignalingActive,
        joinStreamSignaling,
        leaveStreamSignaling,
        signalingLogs,
        socket: socketRef.current,
      }}
    >
      {children}
    </SignalingContext.Provider>
  );
};

export const useSignaling = (): SignalingContextType => {
  const context = useContext(SignalingContext);
  if (!context) {
    throw new Error('useSignaling must be used within a SignalingProvider');
  }
  return context;
};
