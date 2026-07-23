import { Response } from 'express';
import { memoryStore } from '../store/memoryStore';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class LobbyController {
  static getOnlineUsers(req: AuthenticatedRequest, res: Response) {
    const users = memoryStore.getOnlineUsers();
    return sendSuccess(res, 'Online users retrieved', { users });
  }

  static getActiveStreams(req: AuthenticatedRequest, res: Response) {
    const streams = memoryStore.getActiveStreams();
    return sendSuccess(res, 'Active streams retrieved', { streams });
  }

  static getStreamById(req: AuthenticatedRequest, res: Response) {
    const { roomId } = req.params;
    const stream = memoryStore.getStreamRoom(roomId);
    if (!stream) {
      return res.status(404).json({ success: false, message: 'Stream room not found' });
    }
    return sendSuccess(res, 'Stream retrieved', { stream });
  }
}
