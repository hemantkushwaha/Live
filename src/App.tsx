import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { MainLayout } from './components/layout/MainLayout';
import { AuthPage } from './pages/AuthPage';
import { LobbyPage } from './pages/LobbyPage';
import { StreamPage } from './pages/StreamPage';
import { StreamRoom } from './types';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeRoom, setActiveRoom] = useState<StreamRoom | null>(null);
  const [isStreamer, setIsStreamer] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold uppercase tracking-wider">Loading LiveConnect...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleJoinStream = (room: StreamRoom) => {
    setActiveRoom(room);
    setIsStreamer(room.streamerId === user?.id);
  };

  const handleStartStream = (title: string) => {
    if (user) {
      const room: StreamRoom = {
        id: user.id,
        streamerId: user.id,
        streamerName: user.username,
        streamerEmail: user.email,
        title,
        viewers: [],
        isPausedForPrivate: false,
        createdAt: Date.now(),
      };
      setActiveRoom(room);
      setIsStreamer(true);
    }
  };

  const handleLeaveStream = () => {
    setActiveRoom(null);
    setIsStreamer(false);
  };

  return (
    <MainLayout>
      {activeRoom ? (
        <StreamPage
          room={activeRoom}
          isStreamer={isStreamer}
          onLeave={handleLeaveStream}
        />
      ) : (
        <LobbyPage
          onJoinStream={handleJoinStream}
          onStartStream={handleStartStream}
        />
      )}
    </MainLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainAppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
