import { StreamRoom, PresenceUser, User } from '../../shared/types';
import { presenceService } from './presenceService';
import { streamService } from './streamService';

export interface LobbyState {
  currentUser?: User;
  onlineUsers: PresenceUser[];
  activeStreams: StreamRoom[];
}

export class LobbyService {
  private static instance: LobbyService;

  public static getInstance(): LobbyService {
    if (!LobbyService.instance) {
      LobbyService.instance = new LobbyService();
    }
    return LobbyService.instance;
  }

  /**
   * Get list of active live streams
   */
  public getActiveStreams(): StreamRoom[] {
    return streamService.getAllStreams();
  }

  /**
   * Get full state of the lobby for REST API or socket payloads
   */
  public getLobbyState(currentUser?: User): LobbyState {
    return {
      currentUser,
      onlineUsers: presenceService.getOnlineUsers(),
      activeStreams: streamService.getAllStreams(),
    };
  }
}

export const lobbyService = LobbyService.getInstance();
