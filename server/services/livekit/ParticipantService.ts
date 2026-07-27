import { RoomServiceClient, ParticipantInfo } from 'livekit-server-sdk';
import { ENV } from '../../config/env';
import { Logger } from '../../utils/logger';

export interface ParticipantRecord {
  identity: string;
  name?: string;
  roomName: string;
  joinedAt: number;
  isPublisher: boolean;
}

export class ParticipantService {
  private static instance: ParticipantService;
  private roomClient: RoomServiceClient | null = null;
  private localParticipants: Map<string, ParticipantRecord[]> = new Map(); // roomName -> ParticipantRecord[]

  private constructor() {
    this.initClient();
  }

  private initClient() {
    try {
      const url = process.env.LIVEKIT_URL || ENV.LIVEKIT_URL;
      const apiKey = process.env.LIVEKIT_API_KEY || ENV.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET || ENV.LIVEKIT_API_SECRET;

      if (url && apiKey && apiSecret && !url.includes('example.com')) {
        const httpUrl = url.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
        this.roomClient = new RoomServiceClient(httpUrl, apiKey, apiSecret);
      }
    } catch (err: any) {
      Logger.warn('ParticipantService', `Could not initialize LiveKit RoomServiceClient: ${err.message}`);
    }
  }

  public static getInstance(): ParticipantService {
    if (!ParticipantService.instance) {
      ParticipantService.instance = new ParticipantService();
    }
    return ParticipantService.instance;
  }

  /**
   * Register participant join locally or fetch from LiveKit
   */
  public registerJoin(roomName: string, identity: string, name?: string, isPublisher: boolean = false): ParticipantRecord {
    let list = this.localParticipants.get(roomName) || [];
    const existingIndex = list.findIndex((p) => p.identity === identity);

    const record: ParticipantRecord = {
      identity,
      name: name || identity,
      roomName,
      joinedAt: Date.now(),
      isPublisher,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.push(record);
    }

    this.localParticipants.set(roomName, list);
    Logger.info('ParticipantService', `Registered participant ${identity} in SFU room ${roomName}`);
    return record;
  }

  /**
   * Register participant leave
   */
  public registerLeave(roomName: string, identity: string): boolean {
    const list = this.localParticipants.get(roomName);
    if (!list) return false;

    const filtered = list.filter((p) => p.identity !== identity);
    this.localParticipants.set(roomName, filtered);
    Logger.info('ParticipantService', `Participant ${identity} left SFU room ${roomName}`);
    return true;
  }

  /**
   * List participants in a room
   */
  public async listParticipants(roomName: string): Promise<ParticipantRecord[]> {
    if (this.roomClient) {
      try {
        const livekitParticipants = await this.roomClient.listParticipants(roomName);
        if (livekitParticipants && livekitParticipants.length > 0) {
          return livekitParticipants.map((p) => ({
            identity: p.identity,
            name: p.name || p.identity,
            roomName,
            joinedAt: Number(p.joinedAt) * 1000 || Date.now(),
            isPublisher: p.permission?.canPublish || false,
          }));
        }
      } catch (err) {
        // Fallback to local
      }
    }

    return this.localParticipants.get(roomName) || [];
  }

  /**
   * Remove / Kick participant from a room
   */
  public async removeParticipant(roomName: string, identity: string): Promise<boolean> {
    this.registerLeave(roomName, identity);

    if (this.roomClient) {
      try {
        await this.roomClient.removeParticipant(roomName, identity);
        Logger.info('ParticipantService', `Kicked participant ${identity} from room ${roomName} via LiveKit SDK`);
        return true;
      } catch (err: any) {
        Logger.warn('ParticipantService', `Failed to remove participant via LiveKit SDK: ${err.message}`);
      }
    }

    return true;
  }

  /**
   * Mute a track published by a participant
   */
  public async mutePublishedTrack(roomName: string, identity: string, trackSid: string, muted: boolean): Promise<boolean> {
    if (this.roomClient) {
      try {
        await this.roomClient.mutePublishedTrack(roomName, identity, trackSid, muted);
        Logger.info('ParticipantService', `Muted track ${trackSid} for ${identity} in room ${roomName}`);
        return true;
      } catch (err: any) {
        Logger.warn('ParticipantService', `Error muting track via LiveKit SDK: ${err.message}`);
      }
    }
    return false;
  }
}

export const participantService = ParticipantService.getInstance();
