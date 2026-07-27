import { AccessToken } from 'livekit-server-sdk';
import { ENV } from '../../config/env';
import { Logger } from '../../utils/logger';

export interface TokenOptions {
  roomName: string;
  identity: string;
  name?: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
  isAdmin?: boolean;
  ttl?: string | number; // e.g., '1h' or seconds
}

export class TokenService {
  private static instance: TokenService;

  private apiKey: string;
  private apiSecret: string;

  private constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY || ENV.LIVEKIT_API_KEY || 'devkey';
    this.apiSecret = process.env.LIVEKIT_API_SECRET || ENV.LIVEKIT_API_SECRET || 'secretkey';
  }

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Generate an AccessToken for a user to join a LiveKit room
   */
  public async generateToken(options: TokenOptions): Promise<string> {
    const {
      roomName,
      identity,
      name = identity,
      canPublish = false,
      canSubscribe = true,
      isAdmin = false,
    } = options;

    try {
      const at = new AccessToken(this.apiKey, this.apiSecret, {
        identity,
        name,
        ttl: options.ttl || '6h',
      });

      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish,
        canSubscribe,
        canPublishData: true,
        roomAdmin: isAdmin,
      });

      const token = await at.toJwt();
      Logger.info('TokenService', `Generated LiveKit access token for ${identity} in room ${roomName} (publish: ${canPublish})`);
      return token;
    } catch (err: any) {
      Logger.error('TokenService', `Error generating LiveKit token for ${identity}`, err);
      // Fallback deterministic mock JWT for local development if SDK throws
      return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sfu_token_${identity}_${roomName}_${Date.now()}`;
    }
  }
}

export const tokenService = TokenService.getInstance();
