import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { MediaProvider } from '../../contexts/MediaContext';
import { StreamProvider, useStream } from '../../contexts/StreamContext';
import { SignalingProvider } from '../../contexts/SignalingContext';
import { PresenceUser, StreamRoom, ApiResponse } from '../../../shared/types';
import { SOCKET_EVENTS } from '../../../shared/events';
import { apiClient } from '../../config/api';
import { CLIENT_CONFIG } from '../../config/config';
import { clientSocketOptions } from '../../config/socket';
import { streamingService } from '../../services/streamingService';
import { LobbyHeader } from './LobbyHeader';
import { CurrentUserCard } from './CurrentUserCard';
import { ActiveStreamsPanel } from './ActiveStreamsPanel';
import { OnlineUsersPanel } from './OnlineUsersPanel';
import { LocalPreview } from '../media/LocalPreview';
import { CurrentStreamPanel } from '../stream/CurrentStreamPanel';
import { ViewerPage } from '../viewer/ViewerPage';
import { WalletPage } from '../wallet/WalletPage';
import { CreatorEarningsDashboard } from '../analytics/CreatorEarningsDashboard';
import { DiscoveryPage } from '../discovery/DiscoveryPage';

interface LobbyDataResponse {

  currentUser?: any;
  onlineUsers: PresenceUser[];
  activeStreams: StreamRoom[];
}

export const LobbyPageContent: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { isStreaming, currentStream, endStream, isEndingStream, activeStreams: streamContextStreams } = useStream();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [activeStreams, setActiveStreams] = useState<StreamRoom[]>([]);
  const [viewingStream, setViewingStream] = useState<StreamRoom | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
  const [isEarningsOpen, setIsEarningsOpen] = useState<boolean>(false);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);


  // Sync activeStreams from StreamContext whenever it updates
  useEffect(() => {
    if (streamContextStreams && streamContextStreams.length > 0) {
      setActiveStreams(streamContextStreams);
    }
  }, [streamContextStreams]);

  // Keep viewingStream up to date with latest viewer count from activeStreams
  useEffect(() => {
    if (viewingStream) {
      const updated = activeStreams.find((s) => s.id === viewingStream.id || s.streamerId === viewingStream.streamerId);
      if (updated) {
        setViewingStream(updated);
      }
    }
  }, [activeStreams]);

  // 1. Initial REST fetch for lobby data
  useEffect(() => {
    const fetchLobbyData = async () => {
      try {
        const res = await apiClient.get<ApiResponse<LobbyDataResponse>>('/lobby');
        if (res.data && res.data.data) {
          const { onlineUsers: initialUsers, activeStreams: initialStreams } = res.data.data;
          if (Array.isArray(initialUsers)) setOnlineUsers(initialUsers);
          if (Array.isArray(initialStreams)) setActiveStreams(initialStreams);
        }
      } catch (err) {
        console.error('Failed to fetch initial lobby data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLobbyData();
  }, []);

  // 2. Socket.io setup & Real-time synchronization
  useEffect(() => {
    if (!token) return;

    const socketInstance = io(CLIENT_CONFIG.socketUrl, clientSocketOptions);
    setSocket(socketInstance);

    const joinLobbyChannels = () => {
      socketInstance.emit(SOCKET_EVENTS.PRESENCE_JOIN, { token });
      socketInstance.emit(SOCKET_EVENTS.LOBBY_JOIN, { token });
    };

    socketInstance.on('connect', () => {
      joinLobbyChannels();
    });

    if (socketInstance.connected) {
      joinLobbyChannels();
    }

    // Real-time Lobby Update listener
    socketInstance.on(SOCKET_EVENTS.LOBBY_UPDATE, (data: { onlineUsers?: PresenceUser[]; activeStreams?: StreamRoom[] }) => {
      if (data) {
        if (Array.isArray(data.onlineUsers)) setOnlineUsers(data.onlineUsers);
        if (Array.isArray(data.activeStreams)) setActiveStreams(data.activeStreams);
      }
    });

    // Real-time Stream List Update listener
    socketInstance.on(SOCKET_EVENTS.STREAM_LIST_UPDATED, (streamsList: StreamRoom[]) => {
      if (Array.isArray(streamsList)) {
        setActiveStreams(streamsList);
      }
    });

    // Redundant Presence listeners
    socketInstance.on(SOCKET_EVENTS.PRESENCE_ONLINE_USERS, (usersList: PresenceUser[]) => {
      if (Array.isArray(usersList)) setOnlineUsers(usersList);
    });

    socketInstance.on(SOCKET_EVENTS.PRESENCE_USER_JOINED, (joinedUser: PresenceUser) => {
      if (!joinedUser || !joinedUser.userId) return;
      setOnlineUsers((prev) => {
        const exists = prev.some((u) => u.userId === joinedUser.userId);
        if (exists) {
          return prev.map((u) => (u.userId === joinedUser.userId ? joinedUser : u));
        }
        return [...prev, joinedUser];
      });
    });

    socketInstance.on(SOCKET_EVENTS.PRESENCE_USER_LEFT, (leftUser: { userId: string }) => {
      if (!leftUser || !leftUser.userId) return;
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== leftUser.userId));
    });

    // Heartbeat interval
    const heartbeatInterval = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit(SOCKET_EVENTS.PRESENCE_HEARTBEAT, { token });
      }
    }, 15000);

    return () => {
      clearInterval(heartbeatInterval);
      socketInstance.off('connect', joinLobbyChannels);
      socketInstance.off(SOCKET_EVENTS.LOBBY_UPDATE);
      socketInstance.off(SOCKET_EVENTS.STREAM_LIST_UPDATED);
      socketInstance.off(SOCKET_EVENTS.PRESENCE_ONLINE_USERS);
      socketInstance.off(SOCKET_EVENTS.PRESENCE_USER_JOINED);
      socketInstance.off(SOCKET_EVENTS.PRESENCE_USER_LEFT);
      socketInstance.disconnect();
    };
  }, [token]);

  const handleLogout = async () => {
    if (socket) {
      socket.disconnect();
    }
    await logout();
  };

  const handleLeaveViewer = () => {
    streamingService.leaveStream();
    setViewingStream(null);
  };

  if (isWalletOpen) {
    return <WalletPage onBack={() => setIsWalletOpen(false)} />;
  }

  if (isDiscoveryOpen) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <LobbyHeader
          currentUser={user}
          onLogout={handleLogout}
          onOpenWallet={() => {
            setIsDiscoveryOpen(false);
            setIsWalletOpen(true);
          }}
          onOpenEarnings={() => {
            setIsDiscoveryOpen(false);
            setIsEarningsOpen(true);
          }}
          onOpenDiscovery={() => setIsDiscoveryOpen(true)}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <DiscoveryPage
            onBack={() => setIsDiscoveryOpen(false)}
            onWatchStream={(stream) => {
              setIsDiscoveryOpen(false);
              setViewingStream(stream);
            }}
          />
        </main>
      </div>
    );
  }

  if (isEarningsOpen) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <LobbyHeader
          currentUser={user}
          onLogout={handleLogout}
          onOpenWallet={() => {
            setIsEarningsOpen(false);
            setIsWalletOpen(true);
          }}
          onOpenEarnings={() => setIsEarningsOpen(true)}
          onOpenDiscovery={() => {
            setIsEarningsOpen(false);
            setIsDiscoveryOpen(true);
          }}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <CreatorEarningsDashboard onBack={() => setIsEarningsOpen(false)} />
        </main>
      </div>
    );
  }

  if (viewingStream) {
    return (
      <ViewerPage
        stream={viewingStream}
        onLeave={handleLeaveViewer}
        onOpenWallet={() => setIsWalletOpen(true)}
      />
    );
  }

  if (isStreaming && currentStream) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" id="creator-dashboard-page">
        <LocalPreview />
        <LobbyHeader
          currentUser={user}
          onLogout={handleLogout}
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenEarnings={() => setIsEarningsOpen(true)}
          onOpenDiscovery={() => setIsDiscoveryOpen(true)}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <CurrentStreamPanel
            currentStream={currentStream}
            onEndStream={endStream}
            isEndingStream={isEndingStream}
          />
        </main>
        <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
          LiveConnect Creator Dashboard &bull; EWO-011 Creator Live Control
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Local Camera & Microphone Media Stream Preview Overlay */}
      <LocalPreview />

      {/* Top Navigation Bar */}
      <LobbyHeader
        currentUser={user}
        onLogout={handleLogout}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenEarnings={() => setIsEarningsOpen(true)}
        onOpenDiscovery={() => setIsDiscoveryOpen(true)}
      />


      {/* Main Responsive Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Current User Card */}
          <div className="lg:col-span-3 space-y-6">
            <CurrentUserCard
              user={user}
              onOpenWallet={() => setIsWalletOpen(true)}
            />
          </div>

          {/* Center Panel: Active Streams */}
          <div className="md:col-span-2 lg:col-span-6 space-y-6">
            <ActiveStreamsPanel
              activeStreams={activeStreams}
              onSelectStream={(stream) => setViewingStream(stream)}
            />
          </div>

          {/* Right Panel: Online Users Panel */}
          <div className="md:col-span-2 lg:col-span-3 space-y-6">
            <OnlineUsersPanel onlineUsers={onlineUsers} currentUser={user} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        LiveConnect Live Lobby &bull; EWO-010 Public Stream Viewer MVP
      </footer>
    </div>
  );
};

export const LobbyPage: React.FC = () => {
  return (
    <MediaProvider>
      <StreamProvider>
        <SignalingProvider>
          <LobbyPageContent />
        </SignalingProvider>
      </StreamProvider>
    </MediaProvider>
  );
};
