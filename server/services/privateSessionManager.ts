import { CallSession, CallSessionSummary } from '../../shared/types';

export class PrivateSessionManager {
  private static instance: PrivateSessionManager;

  private activeSessions: Map<string, CallSession> = new Map();
  private sessionSummaries: Map<string, CallSessionSummary> = new Map();

  public static getInstance(): PrivateSessionManager {
    if (!PrivateSessionManager.instance) {
      PrivateSessionManager.instance = new PrivateSessionManager();
    }
    return PrivateSessionManager.instance;
  }

  public createSession(session: CallSession): CallSession {
    this.activeSessions.set(session.id, session);
    return session;
  }

  public getSession(sessionId: string): CallSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  public getActiveSessionForUser(userId: string): CallSession | undefined {
    for (const session of this.activeSessions.values()) {
      if (
        (session.status === 'active' || session.active) &&
        (session.creatorId === userId || session.viewerId === userId)
      ) {
        return session;
      }
    }
    return undefined;
  }

  public getActiveSessionForStream(streamId: string): CallSession | undefined {
    for (const session of this.activeSessions.values()) {
      if ((session.status === 'active' || session.active) && session.streamId === streamId) {
        return session;
      }
    }
    return undefined;
  }

  public endSession(sessionId: string): CallSession | undefined {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.state = 'Completed';
      session.active = false;
      session.endedAt = Date.now();
    }
    return session;
  }

  public saveSummary(summary: CallSessionSummary): void {
    this.sessionSummaries.set(summary.sessionId, summary);
  }

  public getSummary(sessionId: string): CallSessionSummary | undefined {
    return this.sessionSummaries.get(sessionId);
  }

  public getAllSummaries(): CallSessionSummary[] {
    return Array.from(this.sessionSummaries.values());
  }

  public getAllActiveSessions(): CallSession[] {
    return Array.from(this.activeSessions.values()).filter((s) => s.active || s.status === 'active');
  }
}

export const privateSessionManager = PrivateSessionManager.getInstance();
