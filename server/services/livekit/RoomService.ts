import { RoomServiceClient, Room as LiveKitRoomInfo } from 'livekit-server-sdk';
import { ENV } from '../../config/env';
import { Logger } from '../../utils/logger';

export interface CreateRoomOptions {
  roomName: string;
  emptyTimeout?: number;
  maxParticipants?: number;
  metadata?: string;
}

export interface SFURoomRecord {
  name: string;
  creatorId?: string;
  createdAt: number;
  emptyTimeout: number;
  maxParticipants: number;
  participantsCount: number;
  metadata?: string;
}

export class RoomService {
  private static instance: RoomService;
  private roomClient: RoomServiceClient | null = null;
  private localRooms: Map<string, SFURoomRecord> = new Map();

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
        Logger.info('RoomService', `Initialized LiveKit RoomServiceClient connected to ${httpUrl}`);
      }
    } catch (err: any) {
      Logger.warn('RoomService', `Could not initialize LiveKit RoomServiceClient: ${err.message}`);
    }
  }

  public static getInstance(): RoomService {
    if (!RoomService.instance) {
      RoomService.instance = new RoomService();
    }
    return RoomService.instance;
  }

  /**
   * Create or initialize a LiveKit room
   */
  public async createRoom(options: CreateRoomOptions): Promise<SFURoomRecord> {
    const { roomName, emptyTimeout = 300, maxParticipants = 100, metadata = '' } = options;

    const roomRecord: SFURoomRecord = {
      name: roomName,
      createdAt: Date.now(),
      emptyTimeout,
      maxParticipants,
      participantsCount: 0,
      metadata,
    };

    this.localRooms.set(roomName, roomRecord);

    if (this.roomClient) {
      try {
        await this.roomClient.createRoom({
          name: roomName,
          emptyTimeout,
          maxParticipants,
          metadata,
        });
        Logger.info('RoomService', `LiveKit SFU Room created via LiveKit Server SDK: ${roomName}`);
      } catch (err: any) {
        Logger.warn('RoomService', `Failed to create room via LiveKit SDK, using local registry: ${err.message}`);
      }
    } else {
      Logger.info('RoomService', `LiveKit SFU Room registered locally: ${roomName}`);
    }

    return roomRecord;
  }

  /**
   * Delete / Close a LiveKit room
   */
  public async deleteRoom(roomName: string): Promise<boolean> {
    const exists = this.localRooms.has(roomName);
    this.localRooms.delete(roomName);

    if (this.roomClient) {
      try {
        await this.roomClient.deleteRoom(roomName);
        Logger.info('RoomService', `LiveKit SFU Room deleted via LiveKit Server SDK: ${roomName}`);
      } catch (err: any) {
        Logger.warn('RoomService', `Error deleting room via LiveKit SDK: ${err.message}`);
      }
    }

    return exists;
  }

  /**
   * Retrieve a room by name
   */
  public async getRoom(roomName: string): Promise<SFURoomRecord | null> {
    if (this.localRooms.has(roomName)) {
      return this.localRooms.get(roomName)!;
    }

    if (this.roomClient) {
      try {
        const rooms = await this.roomClient.listRooms([roomName]);
        if (rooms && rooms.length > 0) {
          const r = rooms[0];
          return {
            name: r.name,
            createdAt: Number(r.creationTime) * 1000 || Date.now(),
            emptyTimeout: r.emptyTimeout,
            maxParticipants: r.maxParticipants,
            participantsCount: r.numParticipants,
            metadata: r.metadata,
          };
        }
      } catch (err) {
        // Fallback
      }
    }

    return null;
  }

  /**
   * List all active LiveKit SFU rooms
   */
  public async listRooms(): Promise<SFURoomRecord[]> {
    if (this.roomClient) {
      try {
        const rooms = await this.roomClient.listRooms();
        if (rooms && rooms.length > 0) {
          return rooms.map((r) => ({
            name: r.name,
            createdAt: Number(r.creationTime) * 1000 || Date.now(),
            emptyTimeout: r.emptyTimeout,
            maxParticipants: r.maxParticipants,
            participantsCount: r.numParticipants,
            metadata: r.metadata,
          }));
        }
      } catch (err) {
        // Fallback to local
      }
    }

    return Array.from(this.localRooms.values());
  }
}

export const roomService = RoomService.getInstance();
