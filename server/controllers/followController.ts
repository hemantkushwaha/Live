import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { followService } from '../services/followService';
import { creatorService } from '../services/creatorService';
import { Logger } from '../utils/logger';

export class FollowController {
  /**
   * POST /api/v1/follow
   * Follow a creator
   */
  public async followCreator(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const followerId = req.user?.id;
      if (!followerId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: User authentication required',
        });
        return;
      }

      const { creatorId } = req.body;
      if (!creatorId) {
        res.status(400).json({
          success: false,
          message: 'creatorId parameter is required in body',
        });
        return;
      }

      const record = followService.follow(followerId, creatorId, (id) => creatorService.exists(id));
      const updatedFollowersCount = followService.getFollowersCount(creatorId);

      res.status(200).json({
        success: true,
        message: 'Successfully followed creator',
        data: {
          ...record,
          followersCount: updatedFollowersCount,
        },
      });
    } catch (err: any) {
      Logger.error('FollowController', 'Error in followCreator', err);
      const status =
        err.name === 'ValidationError' ? 400 : err.name === 'NotFoundError' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to follow creator',
      });
    }
  }

  /**
   * DELETE /api/v1/follow
   * Unfollow a creator
   */
  public async unfollowCreator(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const followerId = req.user?.id;
      if (!followerId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized: User authentication required',
        });
        return;
      }

      const creatorId = (req.body?.creatorId || req.query?.creatorId) as string;
      if (!creatorId) {
        res.status(400).json({
          success: false,
          message: 'creatorId parameter is required in body or query',
        });
        return;
      }

      followService.unfollow(followerId, creatorId);
      const updatedFollowersCount = followService.getFollowersCount(creatorId);

      res.status(200).json({
        success: true,
        message: 'Successfully unfollowed creator',
        data: {
          creatorId,
          followerId,
          followersCount: updatedFollowersCount,
        },
      });
    } catch (err: any) {
      Logger.error('FollowController', 'Error in unfollowCreator', err);
      const status = err.name === 'ValidationError' ? 400 : 500;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to unfollow creator',
      });
    }
  }

  /**
   * GET /api/v1/follow/followers/:creatorId
   */
  public async getFollowers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { creatorId } = req.params;
      const followersList = followService.getFollowersList(creatorId);
      res.status(200).json({
        success: true,
        data: {
          creatorId,
          count: followersList.length,
          followers: followersList,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch followers',
      });
    }
  }

  /**
   * GET /api/v1/follow/following/:followerId
   */
  public async getFollowing(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { followerId } = req.params;
      const followingList = followService.getFollowingList(followerId);
      res.status(200).json({
        success: true,
        data: {
          followerId,
          count: followingList.length,
          following: followingList,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch following list',
      });
    }
  }
}

export const followController = new FollowController();
