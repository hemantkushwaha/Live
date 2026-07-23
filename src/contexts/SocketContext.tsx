import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { connectSocket, getSocket, disconnectSocket } from '../services/socket';
import { User, StreamRoom, PrivateCallRequest, CallSession, SOCKET_EVENTS } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: User[];
  activeStreams: StreamRoom[];
  incomingCallRequest: PrivateCallRequest | null;
  activePrivateCall: {
    session: CallSession;
    peerId: string;
    peerName: string;
    peerEmail?: string;
  } | null;
  startStream: (title: string) => Promise<StreamRoom>;
  stopStream: () => Promise<void>;
  joinStream: (roomId: string) => Promise<StreamRoom>;
  leaveStream: (roomId: string) => void;
  requestPrivateCall: (streamerId: string) => Promise<string>;
  respondPrivateCall: (requestId: string, accept: boolean) => Promise<void>;
  endPrivateCall: (sessionId: string) => Promise<void>;
  clearIncomingRequest: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [activeStreams, setActiveStreams] = useState<StreamRoom[]>([]);
  const [incomingCallRequest, setIncomingCallRequest] = useState<PrivateCallRequest | null>(null);
  const [activePrivateCall, setActivePrivateCall] = useState<{
    session: CallSession;
    peerId: string;
    peerName: string;
    peerEmail?: string;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = connectSocket(token);
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      s.emit(SOCKET_EVENTS.GET_ONLINE_USERS);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on(SOCKET_EVENTS.ONLINE_USERS_LIST, (users: User[]) => {
      setOnlineUsers(users);
    });

    s.on(SOCKET_EVENTS.ACTIVE_STREAMS_LIST, (streams: StreamRoom[]) => {
      setActiveStreams(streams);
    });

    // Handle Incoming Private Call Request (for Streamer)
    s.on(SOCKET_EVENTS.PRIVATE_CALL_REQUESTED, (request: PrivateCallRequest) => {
      setIncomingCallRequest(request);
    });

    // Handle Streamer accepted private call (for Viewer)
    s.on(
      SOCKET_EVENTS.PRIVATE_CALL_ACCEPTED,
      (data: { session: CallSession; streamerId: string; streamerName: string }) => {
        setActivePrivateCall({
          session: data.session,
          peerId: data.streamerId,
          peerName: data.streamerName,
        });
      }
    );

    // Handle Streamer started private call (for Streamer)
    s.on(
      SOCKET_EVENTS.PRIVATE_CALL_STARTED,
      (data: { session: CallSession; peerId: string; peerName: string; peerEmail?: string }) => {
        setIncomingCallRequest(null);
        setActivePrivateCall({
          session: data.session,
          peerId: data.peerId,
          peerName: data.peerName,
          peerEmail: data.peerEmail,
        });
      }
    );

    // Handle Private Call Ended
    s.on(SOCKET_EVENTS.PRIVATE_CALL_ENDED, () => {
      setActivePrivateCall(null);
    });

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off(SOCKET_EVENTS.ONLINE_USERS_LIST);
      s.off(SOCKET_EVENTS.ACTIVE_STREAMS_LIST);
      s.off(SOCKET_EVENTS.PRIVATE_CALL_REQUESTED);
      s.off(SOCKET_EVENTS.PRIVATE_CALL_ACCEPTED);
      s.off(SOCKET_EVENTS.PRIVATE_CALL_STARTED);
      s.off(SOCKET_EVENTS.PRIVATE_CALL_ENDED);
    };
  }, [isAuthenticated, token]);

  const startStream = useCallback(
    (title: string): Promise<StreamRoom> => {
      return new Promise((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Socket not connected'));
        s.emit(SOCKET_EVENTS.START_STREAM, { title }, (res: { success: boolean; room?: StreamRoom; error?: string }) => {
          if (res.success && res.room) {
            resolve(res.room);
          } else {
            reject(new Error(res.error || 'Failed to start stream'));
          }
        });
      });
    },
    []
  );

  const stopStream = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const s = getSocket();
      if (!s) return reject(new Error('Socket not connected'));
      s.emit(SOCKET_EVENTS.STOP_STREAM, (res: { success: boolean; error?: string }) => {
        if (res.success) resolve();
        else reject(new Error(res.error || 'Failed to stop stream'));
      });
    });
  }, []);

  const joinStream = useCallback(
    (roomId: string): Promise<StreamRoom> => {
      return new Promise((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Socket not connected'));
        s.emit(SOCKET_EVENTS.JOIN_STREAM, { roomId }, (res: { success: boolean; room?: StreamRoom; error?: string }) => {
          if (res.success && res.room) resolve(res.room);
          else reject(new Error(res.error || 'Failed to join stream'));
        });
      });
    },
    []
  );

  const leaveStream = useCallback((roomId: string) => {
    const s = getSocket();
    if (s) {
      s.emit(SOCKET_EVENTS.LEAVE_STREAM, { roomId });
    }
  }, []);

  const requestPrivateCall = useCallback(
    (streamerId: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Socket not connected'));
        s.emit(SOCKET_EVENTS.REQUEST_PRIVATE_CALL, { streamerId }, (res: { success: boolean; requestId?: string; error?: string }) => {
          if (res.success && res.requestId) resolve(res.requestId);
          else reject(new Error(res.error || 'Failed to request private call'));
        });
      });
    },
    []
  );

  const respondPrivateCall = useCallback(
    (requestId: string, accept: boolean): Promise<void> => {
      return new Promise((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Socket not connected'));
        s.emit(SOCKET_EVENTS.RESPOND_PRIVATE_CALL, { requestId, accept }, (res: { success: boolean; error?: string }) => {
          if (res.success) {
            setIncomingCallRequest(null);
            resolve();
          } else {
            reject(new Error(res.error || 'Failed to process response'));
          }
        });
      });
    },
    []
  );

  const endPrivateCall = useCallback(
    (sessionId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Socket not connected'));
        s.emit(SOCKET_EVENTS.END_PRIVATE_CALL, { sessionId }, (res: { success: boolean; error?: string }) => {
          if (res.success) {
            setActivePrivateCall(null);
            resolve();
          } else {
            reject(new Error(res.error || 'Failed to end private call'));
          }
        });
      });
    },
    []
  );

  const clearIncomingRequest = useCallback(() => {
    setIncomingCallRequest(null);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        activeStreams,
        incomingCallRequest,
        activePrivateCall,
        startStream,
        stopStream,
        joinStream,
        leaveStream,
        requestPrivateCall,
        respondPrivateCall,
        endPrivateCall,
        clearIncomingRequest,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
