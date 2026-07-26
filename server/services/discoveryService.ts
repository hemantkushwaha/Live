import { CreatorDiscoveryPayload, CreatorProfileFull } from '../../shared/types';
import { creatorService } from './creatorService';
import { Logger } from '../utils/logger';

export interface CreatorSearchQuery {
  search?: string;
  category?: string;
  country?: string;
  section?: 'trending' | 'online' | 'recently_live' | 'newest' | 'all';
}

export class DiscoveryService {
  private static instance: DiscoveryService;

  public static getInstance(): DiscoveryService {
    if (!DiscoveryService.instance) {
      DiscoveryService.instance = new DiscoveryService();
    }
    return DiscoveryService.instance;
  }

  /**
   * Get main discovery sections payload
   */
  public getDiscoveryPayload(currentUserId?: string): CreatorDiscoveryPayload {
    const allCreators = creatorService.getAllCreatorsFull(currentUserId);

    // Extract all unique categories
    const categoriesSet = new Set<string>();
    for (const c of allCreators) {
      if (c.categories && Array.isArray(c.categories)) {
        for (const cat of c.categories) {
          categoriesSet.add(cat);
        }
      }
    }

    // 1. Trending creators: sorted by followers + earnings + live boost
    const trending = [...allCreators].sort((a, b) => {
      const scoreA = (a.stats.followersCount || 0) * 10 + (a.stats.totalEarnings || 0) + (a.isLive ? 500 : 0);
      const scoreB = (b.stats.followersCount || 0) * 10 + (b.stats.totalEarnings || 0) + (b.isLive ? 500 : 0);
      return scoreB - scoreA;
    });

    // 2. Online creators
    const online = allCreators.filter((c) => c.isOnline || c.isLive);

    // 3. Recently Live creators (currently live or active)
    const recentlyLive = allCreators.filter((c) => c.isLive || c.stats.totalStreams > 0 || c.isOnline);

    // 4. Newest creators: sorted by creation date
    const newest = [...allCreators].sort((a, b) => b.createdAt - a.createdAt);

    Logger.info('DiscoveryService', `Built discovery payload with ${allCreators.length} total creators`);

    return {
      trending,
      online,
      recentlyLive,
      newest,
      categories: Array.from(categoriesSet),
      totalCreators: allCreators.length,
    };
  }

  /**
   * Search and filter creators by term, category, country, section
   */
  public searchCreators(query: CreatorSearchQuery, currentUserId?: string): CreatorProfileFull[] {
    let list = creatorService.getAllCreatorsFull(currentUserId);

    // Filter by section
    if (query.section) {
      switch (query.section) {
        case 'online':
          list = list.filter((c) => c.isOnline || c.isLive);
          break;
        case 'recently_live':
          list = list.filter((c) => c.isLive || c.stats.totalStreams > 0 || c.isOnline);
          break;
        case 'newest':
          list = [...list].sort((a, b) => b.createdAt - a.createdAt);
          break;
        case 'trending':
          list = [...list].sort((a, b) => {
            const scoreA = (a.stats.followersCount || 0) * 10 + (a.stats.totalEarnings || 0) + (a.isLive ? 500 : 0);
            const scoreB = (b.stats.followersCount || 0) * 10 + (b.stats.totalEarnings || 0) + (b.isLive ? 500 : 0);
            return scoreB - scoreA;
          });
          break;
        default:
          break;
      }
    }

    // Filter by search text (username or displayName)
    if (query.search && query.search.trim().length > 0) {
      const term = query.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.username.toLowerCase().includes(term) ||
          c.displayName.toLowerCase().includes(term) ||
          c.bio.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (query.category && query.category.trim().length > 0 && query.category.toLowerCase() !== 'all') {
      const cat = query.category.trim().toLowerCase();
      list = list.filter(
        (c) => c.categories && c.categories.some((item) => item.toLowerCase().includes(cat))
      );
    }

    // Filter by country
    if (query.country && query.country.trim().length > 0 && query.country.toLowerCase() !== 'all') {
      const countryTerm = query.country.trim().toLowerCase();
      list = list.filter((c) => c.country.toLowerCase().includes(countryTerm));
    }

    return list;
  }
}

export const discoveryService = DiscoveryService.getInstance();
