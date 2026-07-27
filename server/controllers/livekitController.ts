import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { liveKitService } from '../services/livekit/LiveKitService';
import { getIO } from '../socket/socketHandler';
import { SOCKET_EVENTS } from '../../shared/events';
import { Logger } from '../utils/logger';

export class LiveKitController {
  /**
   * POST /api/v1/livekit/token
   * Generate LiveKit SFU access token for joining a room
   */
  public async generateToken(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { roomName, participantName, identity, isPublisher } = req.body || {};

      if (!roomName || typeof roomName !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Missing or invalid roomName parameter.',
        });
        return;
      }

      const userIdentity = authReq.user?.id || identity || `user_${Math.random().toString(36).substring(2, 9)}`;
      const userName = participantName || authReq.user?.username || authReq.user?.email || userIdentity;
      const canPublish = typeof isPublisher === 'boolean' ? isPublisher : authReq.user?.role === 'creator' || roomName.includes(userIdentity);

      const result = await liveKitService.generateAccessToken({
        roomName,
        identity: userIdentity,
        name: userName,
        canPublish,
        canSubscribe: true,
        isAdmin: authReq.user?.id === roomName || canPublish,
      });

      // Register participant join
      liveKitService.registerParticipantJoin(roomName, userIdentity, userName, canPublish);

      // Emit socket event participant:joined
      const io = getIO();
      if (io) {
        io.to(`stream:${roomName}`).emit('participant:joined', {
          roomName,
          identity: userIdentity,
          name: userName,
          isPublisher: canPublish,
          timestamp: Date.now(),
        });
      }

      Logger.info('LiveKitController', `Issued SFU Token for ${userIdentity} -> Room: ${roomName}`);

      res.status(200).json({
        success: true,
        data: {
          token: result.token,
          livekitUrl: result.livekitUrl,
          roomName,
          identity: userIdentity,
          canPublish,
        },
      });
    } catch (err: any) {
      Logger.error('LiveKitController', 'Error in generateToken', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while generating LiveKit access token.',
      });
    }
  }

  /**
   * POST /api/v1/livekit/room
   * Create an SFU Room
   */
  public async createRoom(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { roomName, emptyTimeout, maxParticipants, metadata } = req.body || {};

      if (!roomName || typeof roomName !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Missing or invalid roomName parameter.',
        });
        return;
      }

      const room = await liveKitService.createRoom({
        roomName,
        emptyTimeout: emptyTimeout ? Number(emptyTimeout) : 300,
        maxParticipants: maxParticipants ? Number(maxParticipants) : 100,
        metadata: metadata || '',
      });

      // Emit socket event room:created
      const io = getIO();
      if (io) {
        io.emit('room:created', {
          roomName: room.name,
          creatorId: req.user?.id || 'system',
          maxParticipants: room.maxParticipants,
          timestamp: room.createdAt,
        });
      }

      Logger.info('LiveKitController', `Created LiveKit Room: ${roomName}`);

      res.status(201).json({
        success: true,
        message: 'LiveKit SFU room created successfully.',
        data: room,
      });
    } catch (err: any) {
      Logger.error('LiveKitController', 'Error in createRoom', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating LiveKit room.',
      });
    }
  }

  /**
   * DELETE /api/v1/livekit/room/:id
   * Delete / Close an SFU Room
   */
  public async deleteRoom(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const roomName = req.params.id;

      if (!roomName) {
        res.status(400).json({
          success: false,
          message: 'Missing room id parameter.',
        });
        return;
      }

      await liveKitService.deleteRoom(roomName);

      // Emit socket event room:closed
      const io = getIO();
      if (io) {
        io.emit('room:closed', {
          roomName,
          closedBy: req.user?.id || 'system',
          timestamp: Date.now(),
        });
        io.to(`stream:${roomName}`).emit('room:closed', {
          roomName,
          timestamp: Date.now(),
        });
      }

      Logger.info('LiveKitController', `Deleted LiveKit Room: ${roomName}`);

      res.status(200).json({
        success: true,
        message: 'LiveKit SFU room closed successfully.',
        data: { roomName },
      });
    } catch (err: any) {
      Logger.error('LiveKitController', 'Error in deleteRoom', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting LiveKit room.',
      });
    }
  }

  /**
   * GET /api/v1/livekit/rooms
   * List all active SFU Rooms
   */
  public async getRooms(req: Request, res: Response): Promise<void> {
    try {
      const rooms = await liveKitService.listRooms();
      res.status(200).json({
        success: true,
        data: rooms,
      });
    } catch (err: any) {
      Logger.error('LiveKitController', 'Error in getRooms', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching LiveKit rooms.',
      });
    }
  }

  /**
   * GET /api/v1/livekit/room/:id/participants
   * List participants in an SFU Room
   */
  public async getParticipants(req: Request, res: Response): Promise<void> {
    try {
      const roomName = req.params.id;
      const participants = await liveKitService.listParticipants(roomName);
      res.status(200).json({
        success: true,
        data: participants,
      });
    } catch (err: any) {
      Logger.error('LiveKitController', 'Error in getParticipants', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching participants.',
      });
    }
  }
}

export const liveKitController = new LiveKitController();
