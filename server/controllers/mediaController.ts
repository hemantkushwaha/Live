import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { mediaService } from '../services/mediaService';
import { creatorService } from '../services/creatorService';
import { securityService } from '../services/SecurityService';
import { ValidationError } from '../../shared/errors/errors';
import { Logger } from '../utils/logger';

export class MediaController {
  /**
   * Upload Media File (Multipart form-data or JSON base64)
   * POST /api/v1/media/upload
   */
  public uploadMedia = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ownerId = req.user?.id || 'anonymous';
      const folder = (req.body?.folder as string) || 'uploads';

      let buffer: Buffer;
      let mimeType: string;
      let originalName: string;

      // Handle multer file attachment
      if (req.file) {
        buffer = req.file.buffer;
        mimeType = req.file.mimetype;
        originalName = req.file.originalname;
      } else if (req.body?.base64Data) {
        // Handle JSON base64 upload
        const rawBase64 = req.body.base64Data as string;
        const matches = rawBase64.match(/^data:([a-zA-Z0-9-]+\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
          throw new ValidationError('Invalid base64 image payload structure');
        }

        mimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
        originalName = req.body.originalName || `upload_${Date.now()}.png`;
      } else {
        throw new ValidationError('No file attached or base64Data provided in request');
      }

      // Security Validation: Validate file extension, MIME type, and size limits
      const validation = securityService.validateFileUpload({
        originalname: originalName,
        mimetype: mimeType,
        size: buffer.length,
      });

      if (!validation.valid) {
        throw new ValidationError(validation.error || 'Invalid file upload request.');
      }

      const metadata = await mediaService.uploadMedia(buffer, mimeType, originalName, ownerId, folder);

      // If folder is 'avatars' or 'covers' and user is logged in, auto update creator profile
      if (req.user) {
        if (folder === 'avatars') {
          try {
            creatorService.updateProfile(req.user.id, { avatar: metadata.secureUrl });
          } catch {
            // Profile might not exist yet if regular user
          }
        } else if (folder === 'covers') {
          try {
            creatorService.updateProfile(req.user.id, { coverImage: metadata.secureUrl });
          } catch {
            // Profile might not exist yet if regular user
          }
        }
      }

      res.status(201).json({
        success: true,
        data: metadata,
        message: 'Media uploaded successfully',
      });
    } catch (error: any) {
      Logger.error('MediaController', 'Error uploading media', error);
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message || 'Failed to upload media file',
      });
    }
  };

  /**
   * Get Media Metadata
   * GET /api/v1/media/:id
   */
  public getMedia = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const metadata = await mediaService.getMedia(id);

      res.status(200).json({
        success: true,
        data: metadata,
      });
    } catch (error: any) {
      res.status(error.statusCode || 404).json({
        success: false,
        error: error.message || 'Media not found',
      });
    }
  };

  /**
   * Delete Media Item
   * DELETE /api/v1/media/:id
   */
  public deleteMedia = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const ownerId = req.user?.id;

      await mediaService.deleteMedia(id, ownerId);

      res.status(200).json({
        success: true,
        message: `Media item ${id} deleted successfully`,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message || 'Failed to delete media',
      });
    }
  };
}

export const mediaController = new MediaController();
