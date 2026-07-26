import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { creatorService } from '../services/creatorService';
import { discoveryService } from '../services/discoveryService';
import { Logger } from '../utils/logger';

export class CreatorController {
  /**
   * GET /api/v1/creators
   * Browse and search creator profiles
   */
  public async getCreators(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUserId = req.user?.id;
      const { search, category, country, section } = req.query;

      const creators = discoveryService.searchCreators(
        {
          search: search as string,
          category: category as string,
          country: country as string,
          section: section as any,
        },
        currentUserId
      );

      res.status(200).json({
        success: true,
        message: 'Creators retrieved successfully',
        data: creators,
      });
    } catch (err: any) {
      Logger.error('CreatorController', 'Error in getCreators', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Internal server error fetching creators',
      });
    }
  }

  /**
   * GET /api/v1/creator/:id
   * Get public creator profile details and stats
   */
  public async getCreatorById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const creatorId = req.params.id;
      const currentUserId = req.user?.id;

      if (!creatorId) {
        res.status(400).json({
          success: false,
          message: 'Creator ID parameter is required',
        });
        return;
      }

      const creatorFull = creatorService.getCreatorProfileFull(creatorId, currentUserId);

      res.status(200).json({
        success: true,
        message: 'Creator profile retrieved successfully',
        data: creatorFull,
      });
    } catch (err: any) {
      Logger.error('CreatorController', `Error in getCreatorById (${req.params.id})`, err);
      const status = err.name === 'NotFoundError' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: err.message || 'Error fetching creator profile',
      });
    }
  }

  /**
   * PUT /api/v1/creator/profile
   * Update authenticated creator's profile
   */
  public async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const creatorId = req.user?.id;
      if (!creatorId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: User authentication required',
        });
        return;
      }

      const { displayName, bio, avatar, coverImage, country, languages, categories } = req.body;

      const updated = creatorService.updateProfile(creatorId, {
        displayName,
        bio,
        avatar,
        coverImage,
        country,
        languages,
        categories,
      });

      res.status(200).json({
        success: true,
        message: 'Creator profile updated successfully',
        data: updated,
      });
    } catch (err: any) {
      Logger.error('CreatorController', 'Error in updateProfile', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Error updating creator profile',
      });
    }
  }
}

export const creatorController = new CreatorController();
