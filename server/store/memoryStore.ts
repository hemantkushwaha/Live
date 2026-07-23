import { User, StreamRoom, PrivateCallRequest, CallSession, UserStatus } from '../../shared/types';
import { Logger } from '../utils/logger';

class MemoryStore {
  private users = new Map<string, User>();
  private socketUserMap = new Map<string, string>();
  private rooms = new Map<string, StreamRoom>();
  private callRequests = new Map<string, PrivateCallRequest>();
  private activeCalls = new Map<string, CallSession>();

  // User methods
  setUser(user: User): User {
    this.users.set(user.id, user);
    if (user.socketId) {
      this.socketUserMap.set(user.socketId, user.id);
    }
    Logger.info('MemoryStore', `User stored: ${user.email} (${user.id})`);
    return user;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getUserBySocketId(socketId: string): User | undefined {
    const userId = this.socketUserMap.get(socketId);
    if (!userId) return undefined;
    return this.users.get(userId);
  }

  updateUserStatus(userId: string, status: UserStatus): User | undefined {
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
      this.users.set(userId, user);
      Logger.info('MemoryStore', `User ${userId} status updated to ${status}`);
    }
    return user;
  }

  removeUserSocket(socketId: string): User | undefined {
    const userId = this.socketUserMap.get(socketId);
    if (userId) {
      this.socketUserMap.delete(socketId);
      const user = this.users.get(userId);
      if (user && user.socketId === socketId) {
        user.socketId = undefined;
        user.status = 'idle';
      }
      return user;
    }
    return undefined;
  }

  getOnlineUsers(): User[] {
    return Array.from(this.users.values()).filter((u) => Boolean(u.socketId));
  }

  // Room / Stream methods
  createStreamRoom(streamerId: string, title: string): StreamRoom {
    const streamer = this.getUser(streamerId);
    const room: StreamRoom = {
      id: streamerId,
      streamerId,
      streamerName: streamer?.username || streamer?.email.split('@')[0] || 'Streamer',
      streamerEmail: streamer?.email || '',
      title: title || `${streamer?.username || 'User'}'s Live Stream`,
      viewers: [],
      isPausedForPrivate: false,
      createdAt: Date.now(),
    };
    this.rooms.set(streamerId, room);
    this.updateUserStatus(streamerId, 'streaming');
    Logger.info('MemoryStore', `Stream room created by ${streamerId}`);
    return room;
  }

  getStreamRoom(roomId: string): StreamRoom | undefined {
    return this.rooms.get(roomId);
  }

  getActiveStreams(): StreamRoom[] {
    return Array.from(this.rooms.values());
  }

  addViewerToRoom(roomId: string, viewerId: string): StreamRoom | undefined {
    const room = this.rooms.get(roomId);
    if (room) {
      if (!room.viewers.includes(viewerId)) {
        room.viewers.push(viewerId);
      }
      this.updateUserStatus(viewerId, 'watching');
    }
    return room;
  }

  removeViewerFromRoom(roomId: string, viewerId: string): StreamRoom | undefined {
    const room = this.rooms.get(roomId);
    if (room) {
      room.viewers = room.viewers.filter((id) => id !== viewerId);
      this.updateUserStatus(viewerId, 'idle');
    }
    return room;
  }

  setStreamPauseState(roomId: string, isPaused: boolean): StreamRoom | undefined {
    const room = this.rooms.get(roomId);
    if (room) {
      room.isPausedForPrivate = isPaused;
    }
    return room;
  }

  deleteStreamRoom(roomId: string): StreamRoom | undefined {
    const room = this.rooms.get(roomId);
    if (room) {
      this.rooms.delete(roomId);
      this.updateUserStatus(room.streamerId, 'idle');
      room.viewers.forEach((vId) => this.updateUserStatus(vId, 'idle'));
      Logger.info('MemoryStore', `Stream room deleted: ${roomId}`);
    }
    return room;
  }

  // Private Call Request methods
  createCallRequest(request: PrivateCallRequest): PrivateCallRequest {
    this.callRequests.set(request.id, request);
    Logger.info('MemoryStore', `Private call request created ${request.id}`);
    return request;
  }

  getCallRequest(requestId: string): PrivateCallRequest | undefined {
    return this.callRequests.get(requestId);
  }

  updateCallRequestStatus(requestId: string, status: PrivateCallRequest['status']): PrivateCallRequest | undefined {
    const req = this.callRequests.get(requestId);
    if (req) {
      req.status = status;
    }
    return req;
  }

  // Active Call Session methods
  createCallSession(session: CallSession): CallSession {
    this.activeCalls.set(session.id, session);
    this.updateUserStatus(session.streamerId, 'in_private_call');
    this.updateUserStatus(session.viewerId, 'in_private_call');
    Logger.info('MemoryStore', `Active call session created ${session.id}`);
    return session;
  }

  getCallSession(sessionId: string): CallSession | undefined {
    return this.activeCalls.get(sessionId);
  }

  getActiveCallByUserId(userId: string): CallSession | undefined {
    return Array.from(this.activeCalls.values()).find(
      (c) => c.active && (c.streamerId === userId || c.viewerId === userId)
    );
  }

  endCallSession(sessionId: string): CallSession | undefined {
    const session = this.activeCalls.get(sessionId);
    if (session) {
      session.active = false;
      this.activeCalls.delete(sessionId);
      
      // If streamer still has a room, set status to streaming or paused
      const room = this.getStreamRoom(session.streamerId);
      if (room) {
        room.isPausedForPrivate = false;
        this.updateUserStatus(session.streamerId, 'streaming');
      } else {
        this.updateUserStatus(session.streamerId, 'idle');
      }

      this.updateUserStatus(session.viewerId, 'idle');
      Logger.info('MemoryStore', `Active call session ended ${sessionId}`);
    }
    return session;
  }
}

export const memoryStore = new MemoryStore();
