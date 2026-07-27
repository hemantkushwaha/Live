import { tokenService, TokenOptions } from './TokenService';
import { roomService, SFURoomRecord, CreateRoomOptions } from './RoomService';
import { participantService, ParticipantRecord } from './ParticipantService';
import { ENV } from '../../config/env';
import { Logger } from '../../utils/logger';

export class LiveKitService {
  private static instance: LiveKitService;

  private constructor() {}

  public static getInstance(): LiveKitService {
    if (!LiveKitService.instance) {
      LiveKitService.instance = new LiveKitService();
    }
    return LiveKitService.instance;
  }

  public getLiveKitUrl(): string {
    return process.env.LIVEKIT_URL || ENV.LIVEKIT_URL || 'wss://livekit.example.com';
  }

  /**
   * Request access token for an SFU Room
   */
  public async generateAccessToken(options: TokenOptions): Promise<{ token: string; livekitUrl: string }> {
    const token = await tokenService.generateToken(options);
    return {
      token,
      livekitUrl: this.getLiveKitUrl(),
    };
  }

  /**
   * Create an SFU Room
   */
  public async createRoom(options: CreateRoomOptions): Promise<SFURoomRecord> {
    return await roomService.createRoom(options);
  }

  /**
   * Close / Delete an SFU Room
   */
  public async deleteRoom(roomName: string): Promise<boolean> {
    return await roomService.deleteRoom(roomName);
  }

  /**
   * Retrieve Room Info
   */
  public async getRoom(roomName: string): Promise<SFURoomRecord | null> {
    return await roomService.getRoom(roomName);
  }

  /**
   * List Active SFU Rooms
   */
  public async listRooms(): Promise<SFURoomRecord[]> {
    return await roomService.listRooms();
  }

  /**
   * Register Participant Join
   */
  public registerParticipantJoin(roomName: string, identity: string, name?: string, isPublisher: boolean = false): ParticipantRecord {
    return participantService.registerJoin(roomName, identity, name, isPublisher);
  }

  /**
   * Register Participant Leave
   */
  public registerParticipantLeave(roomName: string, identity: string): boolean {
    return participantService.registerLeave(roomName, identity);
  }

  /**
   * List Room Participants
   */
  public async listParticipants(roomName: string): Promise<ParticipantRecord[]> {
    return await participantService.listParticipants(roomName);
  }

  /**
   * Kick / Remove Participant
   */
  public async removeParticipant(roomName: string, identity: string): Promise<boolean> {
    return await participantService.removeParticipant(roomName, identity);
  }
}

export const liveKitService = LiveKitService.getInstance();
