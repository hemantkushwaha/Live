import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { streamService } from '../services/streamService';
import { privateRequestService } from '../services/privateRequestService';
import { broadcastStreamUpdate } from '../socket/socketHandler';
import { Logger } from '../utils/logger';

export class StreamController {
  /**
   * POST /api/v1/streams/start
   * Start a new public live stream
   */
  public async startStream(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to start a live stream.',
        });
        return;
      }

      const { title } = req.body || {};

      try {
        const stream = streamService.startStream(req.user, title);
        
        // Broadcast socket update to all connected clients
        broadcastStreamUpdate(stream, 'started');

        Logger.info('StreamController', `User ${req.user.email} started live stream: ${stream.id}`);

        res.status(201).json({
          success: true,
          message: 'Public live stream started successfully',
          data: stream,
        });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          message: err.message || 'Failed to start live stream.',
        });
      }
    } catch (err: any) {
      Logger.error('StreamController', 'Error in startStream', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while starting stream.',
      });
    }
  }

  /**
   * POST /api/v1/streams/end
   * End an active public live stream
   */
  public async endStream(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to end a live stream.',
        });
        return;
      }

      try {
        const endedStream = streamService.endStream(req.user.id);
        privateRequestService.handleStreamEnded(endedStream.id);

        // Broadcast socket update to all connected clients
        broadcastStreamUpdate(endedStream, 'ended');

        Logger.info('StreamController', `User ${req.user.email} ended live stream: ${endedStream.id}`);

        res.status(200).json({
          success: true,
          message: 'Public live stream ended successfully',
          data: { streamId: endedStream.id },
        });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          message: err.message || 'Failed to end live stream.',
        });
      }
    } catch (err: any) {
      Logger.error('StreamController', 'Error in endStream', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while ending stream.',
      });
    }
  }

  /**
   * GET /api/v1/streams
   * Fetch list of active streams
   */
  public async getStreams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const streams = streamService.getAllStreams();
      res.status(200).json({
        success: true,
        data: streams,
      });
    } catch (err: any) {
      Logger.error('StreamController', 'Error in getStreams', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching active streams.',
      });
    }
  }
}

export const streamController = new StreamController();
