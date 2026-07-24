import { User } from '../../shared/types';

export interface SessionData {
  token: string;
  user: User;
  loginTimestamp: string;
}

class SessionStore {
  private sessions = new Map<string, SessionData>();

  public createSession(user: User): SessionData {
    const token = `sess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    const loginTimestamp = new Date().toISOString();
    const sessionData: SessionData = {
      token,
      user,
      loginTimestamp,
    };
    this.sessions.set(token, sessionData);
    return sessionData;
  }

  public getSession(token: string): SessionData | undefined {
    return this.sessions.get(token);
  }

  public deleteSession(token: string): boolean {
    return this.sessions.delete(token);
  }

  public clearAll(): void {
    this.sessions.clear();
  }
}

export const sessionStore = new SessionStore();
