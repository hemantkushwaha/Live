import { CallSession } from '../../shared/types';
import { privateRequestService } from './privateRequestService';
import { privateSessionManager, PrivateSessionManager } from './privateSessionManager';
import { billingService } from './billingService';
import { Logger } from '../utils/logger';

export class PrivateRoomManager {
  public createRoom(session: CallSession): CallSession {
    return privateSessionManager.createSession(session);
  }

  public getRoom(sessionId: string): CallSession | undefined {
    return privateSessionManager.getSession(sessionId);
  }

  public getActiveRoomForUser(userId: string): CallSession | undefined {
    return privateSessionManager.getActiveSessionForUser(userId);
  }

  public getActiveRoomForStream(streamId: string): CallSession | undefined {
    return privateSessionManager.getActiveSessionForStream(streamId);
  }

  public endRoom(sessionId: string): CallSession | undefined {
    return privateSessionManager.endSession(sessionId);
  }

  public getAllActiveRooms(): CallSession[] {
    return privateSessionManager.getAllActiveSessions();
  }
}

export class PrivateSessionService {
  private roomManager = new PrivateRoomManager();
  private eventListeners: Array<(event: 'started' | 'ended', session: CallSession) => void> = [];

  public onSessionEvent(listener: (event: 'started' | 'ended', session: CallSession) => void) {
    this.eventListeners.push(listener);
  }

  private notify(event: 'started' | 'ended', session: CallSession) {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event, session);
      } catch (err) {
        Logger.error('PrivateSessionService', `Error in listener for ${event}`, err);
      }
    });
  }

  /**
   * Start a new private session when creator accepts a request or clicks start
   */
  public startSession(requestId: string, creatorId: string): CallSession {
    const request = privateRequestService.getRequestById(requestId);
    if (!request) {
      throw new Error(`Private call request ${requestId} not found`);
    }

    if (request.creatorId !== creatorId && request.streamerId !== creatorId) {
      throw new Error('Unauthorized: Only the creator of this request can start the session');
    }

    const currentStatus = (request.status || '').toLowerCase();
    if (currentStatus !== 'accepted') {
      throw new Error(`Cannot start session for request in status '${request.status}'. Request must be Accepted.`);
    }

    // Check if there is already an active session for this user or stream
    const existingUserSession = this.roomManager.getActiveRoomForUser(creatorId);
    if (existingUserSession) {
      Logger.warn('PrivateSessionService', `Creator ${creatorId} already has active session ${existingUserSession.id}. Ending previous session.`);
      this.endSession(existingUserSession.id, creatorId);
    }

    const sessionId = `pcall_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const session: CallSession = {
      id: sessionId,
      requestId: request.id,
      streamId: request.streamId,
      creatorId: request.creatorId || request.streamerId,
      streamerId: request.streamerId || request.creatorId,
      viewerId: request.viewerId,
      viewerName: request.viewerName,
      startedAt: Date.now(),
      status: 'active',
      state: 'Connecting',
      active: true,
    };

    this.roomManager.createRoom(session);

    // Initialize & start billing service timer
    billingService.startBillingSession(session);

    Logger.info('PrivateSessionService', `Started private session ${session.id} for request ${requestId} between Creator ${session.creatorId} and Viewer ${session.viewerId}`);

    this.notify('started', session);
    return session;
  }

  /**
   * End an active private session
   */
  public endSession(sessionId: string, endedByUserId: string): CallSession {
    let session = this.roomManager.getRoom(sessionId);
    if (!session) {
      session = this.roomManager.getActiveRoomForUser(sessionId);
    }

    if (!session) {
      throw new Error(`Active private session ${sessionId} not found`);
    }

    billingService.stopBillingSession(session.id, 'user_ended');
    const endedSession = this.roomManager.endRoom(session.id) || session;

    Logger.info('PrivateSessionService', `Ended private session ${endedSession.id} by user ${endedByUserId}`);
    this.notify('ended', endedSession);
    return endedSession;
  }

  public getActiveSession(sessionId: string): CallSession | undefined {
    return this.roomManager.getRoom(sessionId);
  }

  public getActiveSessionForUser(userId: string): CallSession | undefined {
    return this.roomManager.getActiveRoomForUser(userId);
  }

  public getActiveSessionForStream(streamId: string): CallSession | undefined {
    return this.roomManager.getActiveRoomForStream(streamId);
  }

  /**
   * Clean up sessions when a user disconnects
   */
  public handleUserDisconnect(userId: string): CallSession | null {
    const session = this.roomManager.getActiveRoomForUser(userId);
    if (session) {
      Logger.info('PrivateSessionService', `User ${userId} disconnected during active session ${session.id}. Ending session.`);
      billingService.stopBillingSession(session.id, 'disconnected');
      return this.endSession(session.id, userId);
    }
    return null;
  }
}

export const privateSessionService = new PrivateSessionService();
