import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { StreamRoom } from '../../shared/types';
import { SOCKET_EVENTS } from '../../shared/events';
import { useAuth } from './AuthContext';
import { useMedia } from './MediaContext';
import { ClientStreamService } from '../services/streamService';
import { CLIENT_CONFIG } from '../config/config';
import { clientSocketOptions } from '../config/socket';

interface StreamContextType {
  activeStreams: StreamRoom[];
  currentStream: StreamRoom | null;
  isStreaming: boolean;
  isStartingStream: boolean;
  isEndingStream: boolean;
  streamError: string | null;
  
  // Actions
  startStream: (title?: string) => Promise<boolean>;
  endStream: () => Promise<boolean>;
  refreshStreams: () => Promise<void>;
  clearStreamError: () => void;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export const StreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const { stream: localMediaStream, hasPermissions, startPreview } = useMedia();

  const [activeStreams, setActiveStreams] = useState<StreamRoom[]>([]);
  const [currentStream, setCurrentStream] = useState<StreamRoom | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const [isStartingStream, setIsStartingStream] = useState<boolean>(false);
  const [isEndingStream, setIsEndingStream] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Fetch active streams via REST API on initial mount
  const refreshStreams = useCallback(async () => {
    try {
      const streams = await ClientStreamService.getActiveStreams();
      setActiveStreams(streams);

      if (user) {
        const myStream = streams.find((s) => s.streamerId === user.id);
        if (myStream) {
          setCurrentStream(myStream);
          setIsStreaming(true);
        } else {
          setCurrentStream(null);
          setIsStreaming(false);
        }
      }
    } catch (err: any) {
      console.error('Error fetching active streams:', err);
    }
  }, [user]);

  useEffect(() => {
    refreshStreams();
  }, [refreshStreams]);

  // Real-time socket event listeners for streams
  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(CLIENT_CONFIG.socketUrl, clientSocketOptions);

    const handleListUpdated = (streamsList: StreamRoom[]) => {
      if (Array.isArray(streamsList)) {
        setActiveStreams(streamsList);
        if (user) {
          const myStream = streamsList.find((s) => s.streamerId === user.id);
          if (myStream) {
            setCurrentStream(myStream);
            setIsStreaming(true);
          } else if (currentStream && !myStream) {
            setCurrentStream(null);
            setIsStreaming(false);
          }
        }
      }
    };

    const handleLobbyUpdate = (data: { activeStreams?: StreamRoom[] }) => {
      if (data && Array.isArray(data.activeStreams)) {
        setActiveStreams(data.activeStreams);
        if (user) {
          const myStream = data.activeStreams.find((s) => s.streamerId === user.id);
          if (myStream) {
            setCurrentStream(myStream);
            setIsStreaming(true);
          } else if (currentStream && !myStream) {
            setCurrentStream(null);
            setIsStreaming(false);
          }
        }
      }
    };

    const handleStreamStarted = (newStream: StreamRoom) => {
      if (!newStream) return;
      setActiveStreams((prev) => {
        const exists = prev.some((s) => s.id === newStream.id || s.streamerId === newStream.streamerId);
        if (exists) {
          return prev.map((s) => (s.id === newStream.id ? newStream : s));
        }
        return [...prev, newStream];
      });

      if (user && newStream.streamerId === user.id) {
        setCurrentStream(newStream);
        setIsStreaming(true);
      }
    };

    const handleStreamEnded = (data: { streamId?: string; streamerId?: string }) => {
      if (!data) return;
      const targetId = data.streamId || data.streamerId;
      setActiveStreams((prev) => prev.filter((s) => s.id !== targetId && s.streamerId !== targetId));

      if (user && (data.streamerId === user.id || currentStream?.id === data.streamId)) {
        setCurrentStream(null);
        setIsStreaming(false);
      }
    };

    socket.on(SOCKET_EVENTS.STREAM_LIST_UPDATED, handleListUpdated);
    socket.on(SOCKET_EVENTS.LOBBY_UPDATE, handleLobbyUpdate);
    socket.on(SOCKET_EVENTS.STREAM_STARTED, handleStreamStarted);
    socket.on(SOCKET_EVENTS.STREAM_ENDED, handleStreamEnded);

    return () => {
      socket.off(SOCKET_EVENTS.STREAM_LIST_UPDATED, handleListUpdated);
      socket.off(SOCKET_EVENTS.LOBBY_UPDATE, handleLobbyUpdate);
      socket.off(SOCKET_EVENTS.STREAM_STARTED, handleStreamStarted);
      socket.off(SOCKET_EVENTS.STREAM_ENDED, handleStreamEnded);
      socket.disconnect();
    };
  }, [token, user, currentStream]);

  /**
   * Action: Start Public Live Stream
   */
  const startStream = async (title?: string): Promise<boolean> => {
    setIsStartingStream(true);
    setStreamError(null);

    try {
      if (!user) {
        throw new Error('Authentication required. Please log in.');
      }

      if (isStreaming || currentStream) {
        throw new Error('User is already hosting an active live stream.');
      }

      // Validate camera readiness before starting stream
      if (!hasPermissions || !localMediaStream) {
        const streamAcquired = await startPreview();
        if (!streamAcquired) {
          throw new Error('Camera and microphone must be initialized and permitted before going live.');
        }
      }

      const streamData = await ClientStreamService.startStream(title);
      setCurrentStream(streamData);
      setIsStreaming(true);

      await refreshStreams();
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to start live stream.';
      setStreamError(errorMsg);
      return false;
    } finally {
      setIsStartingStream(false);
    }
  };

  /**
   * Action: End Active Public Live Stream
   */
  const endStream = async (): Promise<boolean> => {
    setIsEndingStream(true);
    setStreamError(null);

    try {
      await ClientStreamService.endStream();
      setCurrentStream(null);
      setIsStreaming(false);

      await refreshStreams();
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to end live stream.';
      setStreamError(errorMsg);
      return false;
    } finally {
      setIsEndingStream(false);
    }
  };

  const clearStreamError = () => {
    setStreamError(null);
  };

  return (
    <StreamContext.Provider
      value={{
        activeStreams,
        currentStream,
        isStreaming,
        isStartingStream,
        isEndingStream,
        streamError,
        startStream,
        endStream,
        refreshStreams,
        clearStreamError,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
};

export const useStream = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStream must be used within a StreamProvider');
  }
  return context;
};
