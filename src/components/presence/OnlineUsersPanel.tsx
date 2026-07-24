import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Users, Circle, Clock, UserCheck, Radio } from 'lucide-react';
import { PresenceUser, User } from '../../../shared/types';
import { SOCKET_EVENTS } from '../../../shared/events';

interface OnlineUsersPanelProps {
  socket: Socket | null;
  currentUser: User | null;
  token: string | null;
}

export const OnlineUsersPanel: React.FC<OnlineUsersPanelProps> = ({ socket, currentUser, token }) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!socket || !token) return;

    // Join presence channel when socket connects or token is provided
    const joinPresence = () => {
      socket.emit(SOCKET_EVENTS.PRESENCE_JOIN, { token });
    };

    if (socket.connected) {
      joinPresence();
    }

    // Event handler: Full online users list broadcast
    const handleOnlineUsersList = (usersList: PresenceUser[]) => {
      if (Array.isArray(usersList)) {
        setOnlineUsers(usersList);
      }
    };

    // Event handler: Granular user joined event
    const handleUserJoined = (joinedUser: PresenceUser) => {
      if (!joinedUser || !joinedUser.userId) return;
      setOnlineUsers((prev) => {
        const exists = prev.some((u) => u.userId === joinedUser.userId);
        if (exists) {
          return prev.map((u) => (u.userId === joinedUser.userId ? joinedUser : u));
        }
        return [...prev, joinedUser];
      });
    };

    // Event handler: Granular user left event
    const handleUserLeft = (leftUser: { userId: string; email: string }) => {
      if (!leftUser || !leftUser.userId) return;
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== leftUser.userId));
    };

    // Re-join presence on socket connect
    socket.on('connect', joinPresence);
    socket.on(SOCKET_EVENTS.PRESENCE_ONLINE_USERS, handleOnlineUsersList);
    socket.on(SOCKET_EVENTS.PRESENCE_USER_JOINED, handleUserJoined);
    socket.on(SOCKET_EVENTS.PRESENCE_USER_LEFT, handleUserLeft);

    // Periodic heartbeat (every 15 seconds)
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit(SOCKET_EVENTS.PRESENCE_HEARTBEAT, { token });
      }
    }, 15000);

    return () => {
      clearInterval(heartbeatInterval);
      socket.off('connect', joinPresence);
      socket.off(SOCKET_EVENTS.PRESENCE_ONLINE_USERS, handleOnlineUsersList);
      socket.off(SOCKET_EVENTS.PRESENCE_USER_JOINED, handleUserJoined);
      socket.off(SOCKET_EVENTS.PRESENCE_USER_LEFT, handleUserLeft);
    };
  }, [socket, token]);

  const formatConnectionTime = (timestamp: number) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getInitial = (email: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">Online Users</h2>
            <p className="text-[11px] text-slate-400">Real-time socket presence</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <Circle className="w-2 h-2 fill-emerald-400 animate-pulse" />
            <span>{onlineUsers.length} Online</span>
          </span>
        </div>
      </div>

      {/* Online Users List or Empty State */}
      {onlineUsers.length === 0 ? (
        <div className="py-8 px-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
          <p className="text-sm font-medium text-slate-400">No users online.</p>
          <p className="text-xs text-slate-500 mt-0.5">Waiting for connected user sessions...</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
          {onlineUsers.map((pUser) => {
            const isSelf = currentUser && pUser.userId === currentUser.id;

            return (
              <div
                key={pUser.userId}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isSelf
                    ? 'bg-indigo-950/30 border-indigo-500/30 ring-1 ring-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Avatar Placeholder & User Info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-sm shadow-inner">
                      {getInitial(pUser.email)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{pUser.email}</span>
                      {isSelf && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <UserCheck className="w-3 h-3" /> You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Connected {formatConnectionTime(pUser.connectedAt)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Online Badge */}
                <div className="flex items-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Circle className="w-1.5 h-1.5 fill-emerald-400" />
                    <span>Online</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
