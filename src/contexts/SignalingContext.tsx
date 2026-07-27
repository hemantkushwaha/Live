import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useStream } from './StreamContext';
import { useMedia } from './MediaContext';
import { SignalingEngine } from '../webrtc/SignalingEngine';
import { LiveKitSFUEngine } from '../webrtc/LiveKitSFUEngine';
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
  const sfuEngineRef = useRef<LiveKitSFUEngine | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSignalingLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Keep streamingService updated with local media stream
  useEffect(() => {
    streamingService.setLocalStream(localMediaStream);
    if (sfuEngineRef.current) {
      sfuEngineRef.current.setLocalMediaStream(localMediaStream);
    }
  }, [localMediaStream]);

  // Initialize socket, signaling engine, and LiveKit SFU engine
  useEffect(() => {
    if (!token || !user) return;

    const socket = io(CLIENT_CONFIG.socketUrl, clientSocketOptions);
    socketRef.current = socket;

    // 1. Initialize LiveKit SFU Engine
    const sfuEngine = new LiveKitSFUEngine(user.id, {
      onConnectionStateChange: (peerId, state) => {
        setPeerStates((prev) => ({
          ...prev,
          [peerId]: { peerId, state, updatedAt: Date.now() },
        }));
        addLog(`SFU Room ${peerId} connection state: ${state}`);
      },
      onRemoteStream: (peerId, remoteStream) => {
        streamingService.handleRemoteStream(peerId, remoteStream);
        addLog(`LiveKit SFU received stream for peer ${peerId}`);
      },
      onStreamEnded: (streamId) => {
        streamingService.handleStreamEnded(streamId);
        addLog(`LiveKit SFU stream ${streamId} ended`);
      },
      onError: (peerId, error) => {
        addLog(`LiveKit SFU Error on ${peerId}: ${error.message}`);
      },
    });

    sfuEngineRef.current = sfuEngine;
    streamingService.bindLiveKitEngine(sfuEngine);

    // 2. Listen to required LiveKit SFU socket events
    socket.on('room:created', (data: any) => {
      addLog(`Socket Event room:created -> Room: ${data.roomName}`);
    });

    socket.on('room:closed', (data: any) => {
      addLog(`Socket Event room:closed -> Room: ${data.roomName}`);
    });

    socket.on('participant:joined', (data: any) => {
      addLog(`Socket Event participant:joined -> ${data.identity} in ${data.roomName}`);
    });

    socket.on('participant:left', (data: any) => {
      addLog(`Socket Event participant:left -> ${data.identity} in ${data.roomName}`);
    });

    // 3. Initialize P2P Signaling Engine (fallback)
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
    addLog(`LiveKit SFU Engine & Signaling Engine initialized for user ${user.email}`);

    return () => {
      sfuEngine.destroy();
      engine.destroy();
      socket.disconnect();
      sfuEngineRef.current = null;
      engineRef.current = null;
      socketRef.current = null;
      setIsSignalingActive(false);
    };
  }, [token, user]);

  // Automatically start hosting SFU stream when creator goes live
  useEffect(() => {
    if (isStreaming && currentStream && sfuEngineRef.current) {
      if (localMediaStream) {
        sfuEngineRef.current.setLocalMediaStream(localMediaStream);
      }
      // Create SFU room via REST API and connect host as Publisher
      fetch('/api/v1/livekit/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomName: currentStream.id,
          maxParticipants: 100,
        }),
      })
        .then(() => {
          streamingService.startSFUHosting(currentStream.id);
          addLog(`LiveKit SFU stream room active for: ${currentStream.title}`);
        })
        .catch((err) => {
          addLog(`Error creating SFU room: ${err.message}`);
        });

      if (engineRef.current) {
        engineRef.current.startHosting(currentStream.id);
      }
    }
  }, [isStreaming, currentStream, localMediaStream, token]);

  const joinStreamSignaling = (streamId: string) => {
    streamingService.joinStream(streamId);
    addLog(`Joined LiveKit SFU stream ${streamId}`);
  };

  const leaveStreamSignaling = () => {
    streamingService.leaveStream();
    setPeerStates({});
    addLog('Left LiveKit SFU stream');
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
