import { CreatorProfile, CreatorProfileFull, CreatorProfileStats, User } from '../../shared/types';
import { followService } from './followService';
import { presenceService } from './presenceService';
import { streamService } from './streamService';
import { giftService } from './giftService';
import { walletService } from './walletService';
import { ValidationError, NotFoundError } from '../../shared/errors/errors';
import { Logger } from '../utils/logger';
import { cacheService } from './cacheService';

export class CreatorService {
  private static instance: CreatorService;

  // Map of creatorId -> CreatorProfile
  private profiles = new Map<string, CreatorProfile>();

  public static getInstance(): CreatorService {
    if (!CreatorService.instance) {
      CreatorService.instance = new CreatorService();
      CreatorService.instance.seedInitialCreators();
    }
    return CreatorService.instance;
  }

  /**
   * Seed curated initial creator profiles for vibrant discovery
   */
  private seedInitialCreators(): void {
    const defaultCreators: CreatorProfile[] = [
      {
        id: 'creator_elena_01',
        displayName: 'Elena Rostova',
        username: 'elena_vibes',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1000',
        bio: 'Singer-songwriter & acoustic live performer. Hosting nightly music jam sessions & live Q&As!',
        country: 'United States',
        languages: ['English', 'Spanish'],
        categories: ['Music', 'Live Performance', 'Acoustic'],
        isOnline: true,
        isVerified: true,
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'creator_alex_02',
        displayName: 'Alex Rivers',
        username: 'alex_gaming',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
        coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000',
        bio: 'Pro FPS gamer & tech enthusiast. Speedruns, tournament commentary, and gear reviews.',
        country: 'Canada',
        languages: ['English', 'French'],
        categories: ['Gaming', 'Esports', 'Tech'],
        isOnline: true,
        isVerified: true,
        createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'creator_maya_03',
        displayName: 'Maya Patel',
        username: 'maya_code',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
        coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000',
        bio: 'Senior Software Engineer building AI products & teaching Web3 / React architecture.',
        country: 'United Kingdom',
        languages: ['English', 'Hindi'],
        categories: ['Technology', 'Education', 'Coding'],
        isOnline: false,
        isVerified: true,
        createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'creator_lucas_04',
        displayName: 'Lucas Vance',
        username: 'lucas_fitness',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
        coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1000',
        bio: 'Calisthenics coach & high-intensity workout host. Daily live training & nutrition tips.',
        country: 'Australia',
        languages: ['English'],
        categories: ['Fitness', 'Health', 'Lifestyle'],
        isOnline: true,
        isVerified: false,
        createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'creator_sophia_05',
        displayName: 'Sophia Chen',
        username: 'sophia_art',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
        coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=1000',
        bio: 'Digital illustrator & 3D animator. Live painting streams, character design & critique.',
        country: 'Japan',
        languages: ['Japanese', 'English'],
        categories: ['Art & Design', 'Creative', 'Animation'],
        isOnline: false,
        isVerified: true,
        createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
      },
    ];

    for (const c of defaultCreators) {
      this.profiles.set(c.id, c);
    }
  }

  /**
   * Check if creator exists by ID
   */
  public exists(creatorId: string): boolean {
    return this.profiles.has(creatorId);
  }

  /**
   * Get or automatically create creator profile for an authenticated user
   */
  public getOrCreateProfileForUser(user: User): CreatorProfile {
    let profile = this.profiles.get(user.id);
    if (!profile) {
      const avatarIndex = Math.floor(Math.abs(user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 5) + 1;
      profile = {
        id: user.id,
        displayName: user.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Live Creator',
        username: user.username || 'creator',
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250`,
        coverImage: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000`,
        bio: 'Content creator & live streamer on LiveConnect.',
        country: 'Global',
        languages: ['English'],
        categories: ['Entertainment', 'Live Stream'],
        isOnline: presenceService.isUserOnline(user.id),
        isVerified: false,
        createdAt: Date.now(),
      };
      this.profiles.set(user.id, profile);
      Logger.info('CreatorService', `Created creator profile for user ${user.id} (${user.username})`);
    } else {
      profile.isOnline = presenceService.isUserOnline(user.id);
    }
    return profile;
  }

  /**
   * Get raw CreatorProfile
   */
  public getRawProfile(creatorId: string): CreatorProfile | null {
    return this.profiles.get(creatorId) || null;
  }

  /**
   * Calculate profile stats dynamically for a creator
   */
  public getCreatorStats(creatorId: string): CreatorProfileStats {
    const followersCount = followService.getFollowersCount(creatorId);
    const followingCount = followService.getFollowingCount(creatorId);

    // Stream stats
    const activeStream = streamService.getStreamByHostId(creatorId);
    const allStreams = streamService.getAllStreams().filter((s) => s.streamerId === creatorId);
    const totalStreams = allStreams.length + (activeStream ? 1 : 0);
    const totalViewers = activeStream ? activeStream.viewers.length : 0;

    // Gift and tip stats
    const history = giftService.getHistory().filter((g) => g.receiverId === creatorId);
    let totalGifts = 0;
    let totalTips = 0;
    let giftTipsEarned = 0;

    for (const record of history) {
      if (record.type === 'gift') totalGifts++;
      else totalTips++;
      giftTipsEarned += record.amount || 0;
    }

    const wallet = walletService.getWallet(creatorId);
    const totalEarnings = wallet ? wallet.totalTipsReceived + giftTipsEarned : giftTipsEarned;

    // Likes count based on interaction or base engagement
    const totalLikes = followersCount * 12 + totalGifts * 5 + totalTips * 8 + 42;

    return {
      followersCount,
      followingCount,
      totalStreams,
      totalViewers,
      totalLikes,
      totalGifts,
      totalTips,
      totalEarnings,
    };
  }

  /**
   * Get complete Creator Profile with stats and follow state
   */
  public getCreatorProfileFull(creatorId: string, currentUserId?: string): CreatorProfileFull {
    let profile = this.profiles.get(creatorId);

    if (!profile) {
      // Try to construct from presence or throw
      const presence = presenceService.getPresenceByUserId(creatorId);
      if (presence) {
        profile = this.getOrCreateProfileForUser({
          id: presence.userId,
          email: presence.email,
          username: presence.username,
          status: 'idle',
          connectedAt: presence.connectedAt,
        });
      } else {
        throw new NotFoundError(`Creator profile for ID ${creatorId} not found`);
      }
    }

    const activeStream = streamService.getStreamByHostId(creatorId);
    const isOnline = presenceService.isUserOnline(creatorId) || profile.isOnline;
    const isLive = Boolean(activeStream);
    const liveStreamId = activeStream?.id;

    const stats = this.getCreatorStats(creatorId);
    const isFollowing = currentUserId ? followService.isFollowing(currentUserId, creatorId) : false;

    return {
      ...profile,
      isOnline,
      isLive,
      liveStreamId,
      stats,
      isFollowing,
    };
  }

  /**
   * Get all creators full list
   */
  public getAllCreatorsFull(currentUserId?: string): CreatorProfileFull[] {
    const list: CreatorProfileFull[] = [];
    for (const creatorId of this.profiles.keys()) {
      try {
        const full = this.getCreatorProfileFull(creatorId, currentUserId);
        list.push(full);
      } catch (err) {
        // Skip invalid
      }
    }
    return list;
  }

  /**
   * Update profile fields for creator
   */
  public updateProfile(
    creatorId: string,
    updates: Partial<Pick<CreatorProfile, 'displayName' | 'bio' | 'avatar' | 'coverImage' | 'country' | 'languages' | 'categories'>>
  ): CreatorProfile {
    const profile = this.profiles.get(creatorId);
    if (!profile) {
      throw new NotFoundError(`Creator profile for ID ${creatorId} not found`);
    }

    if (updates.displayName !== undefined) profile.displayName = updates.displayName.trim();
    if (updates.bio !== undefined) profile.bio = updates.bio.trim();
    if (updates.avatar !== undefined) profile.avatar = updates.avatar.trim();
    if (updates.coverImage !== undefined) profile.coverImage = updates.coverImage.trim();
    if (updates.country !== undefined) profile.country = updates.country.trim();
    if (updates.languages !== undefined) profile.languages = updates.languages;
    if (updates.categories !== undefined) profile.categories = updates.categories;

    this.profiles.set(creatorId, profile);
    cacheService.onProfileUpdate(creatorId).catch(() => {});
    Logger.info('CreatorService', `Updated creator profile for ${creatorId}`);
    return profile;
  }
}

export const creatorService = CreatorService.getInstance();
