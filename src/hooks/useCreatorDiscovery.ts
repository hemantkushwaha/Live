import { useState, useEffect, useCallback } from 'react';
import { CreatorDiscoveryPayload, CreatorProfileFull } from '../../shared/types';
import { useAuth } from '../contexts/AuthContext';
import { useSignaling } from '../contexts/SignalingContext';
import { SOCKET_EVENTS } from '../../shared/events';

export interface UseCreatorDiscoveryReturn {
  discoveryData: CreatorDiscoveryPayload | null;
  creators: CreatorProfileFull[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  selectedSection: 'trending' | 'online' | 'recently_live' | 'newest' | 'all';
  setSelectedSection: (sec: 'trending' | 'online' | 'recently_live' | 'newest' | 'all') => void;
  selectedCreator: CreatorProfileFull | null;
  setSelectedCreator: (creator: CreatorProfileFull | null) => void;
  followCreator: (creatorId: string) => Promise<boolean>;
  unfollowCreator: (creatorId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useCreatorDiscovery(): UseCreatorDiscoveryReturn {
  const { token } = useAuth();
  const { socket } = useSignaling();

  const [discoveryData, setDiscoveryData] = useState<CreatorDiscoveryPayload | null>(null);
  const [creators, setCreators] = useState<CreatorProfileFull[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<'trending' | 'online' | 'recently_live' | 'newest' | 'all'>('all');

  const [selectedCreator, setSelectedCreator] = useState<CreatorProfileFull | null>(null);

  const fetchDiscovery = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 1. Fetch discovery main payload
      const discoveryRes = await fetch('/api/v1/discovery', { headers });
      const discoveryJson = await discoveryRes.json();

      if (discoveryJson.success && discoveryJson.data) {
        setDiscoveryData(discoveryJson.data);
      }

      // 2. Fetch filtered creators
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedCountry && selectedCountry !== 'all') params.append('country', selectedCountry);
      if (selectedSection && selectedSection !== 'all') params.append('section', selectedSection);

      const creatorsRes = await fetch(`/api/v1/creators?${params.toString()}`, { headers });
      const creatorsJson = await creatorsRes.json();

      if (creatorsJson.success && Array.isArray(creatorsJson.data)) {
        setCreators(creatorsJson.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load creator discovery data');
    } finally {
      setIsLoading(false);
    }
  }, [token, searchQuery, selectedCategory, selectedCountry, selectedSection]);

  useEffect(() => {
    fetchDiscovery();
  }, [fetchDiscovery]);

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    const handleFollowed = (data: { creatorId: string; followersCount: number }) => {
      setCreators((prev) =>
        prev.map((c) =>
          c.id === data.creatorId
            ? {
                ...c,
                stats: { ...c.stats, followersCount: data.followersCount },
              }
            : c
        )
      );
      if (selectedCreator && selectedCreator.id === data.creatorId) {
        setSelectedCreator((prev) =>
          prev ? { ...prev, stats: { ...prev.stats, followersCount: data.followersCount } } : null
        );
      }
    };

    const handleUnfollowed = (data: { creatorId: string; followersCount: number }) => {
      setCreators((prev) =>
        prev.map((c) =>
          c.id === data.creatorId
            ? {
                ...c,
                stats: { ...c.stats, followersCount: data.followersCount },
              }
            : c
        )
      );
      if (selectedCreator && selectedCreator.id === data.creatorId) {
        setSelectedCreator((prev) =>
          prev ? { ...prev, stats: { ...prev.stats, followersCount: data.followersCount } } : null
        );
      }
    };

    const handleOnline = (data: { creatorId: string }) => {
      setCreators((prev) =>
        prev.map((c) => (c.id === data.creatorId ? { ...c, isOnline: true } : c))
      );
    };

    const handleOffline = (data: { creatorId: string }) => {
      setCreators((prev) =>
        prev.map((c) => (c.id === data.creatorId ? { ...c, isOnline: false } : c))
      );
    };

    socket.on(SOCKET_EVENTS.CREATOR_FOLLOWED, handleFollowed);
    socket.on(SOCKET_EVENTS.CREATOR_UNFOLLOWED, handleUnfollowed);
    socket.on(SOCKET_EVENTS.CREATOR_ONLINE, handleOnline);
    socket.on(SOCKET_EVENTS.CREATOR_OFFLINE, handleOffline);

    return () => {
      socket.off(SOCKET_EVENTS.CREATOR_FOLLOWED, handleFollowed);
      socket.off(SOCKET_EVENTS.CREATOR_UNFOLLOWED, handleUnfollowed);
      socket.off(SOCKET_EVENTS.CREATOR_ONLINE, handleOnline);
      socket.off(SOCKET_EVENTS.CREATOR_OFFLINE, handleOffline);
    };
  }, [socket, selectedCreator]);

  // Follow action
  const followCreator = async (creatorId: string): Promise<boolean> => {
    try {
      if (!token) {
        setError('Please log in to follow creators');
        return false;
      }

      // Optimistic update
      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId
            ? {
                ...c,
                isFollowing: true,
                stats: { ...c.stats, followersCount: c.stats.followersCount + 1 },
              }
            : c
        )
      );
      if (selectedCreator && selectedCreator.id === creatorId) {
        setSelectedCreator((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: true,
                stats: { ...prev.stats, followersCount: prev.stats.followersCount + 1 },
              }
            : null
        );
      }

      const res = await fetch('/api/v1/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ creatorId }),
      });

      const json = await res.json();
      if (!json.success) {
        // Rollback on failure
        fetchDiscovery();
        setError(json.message || 'Failed to follow creator');
        return false;
      }

      return true;
    } catch (err: any) {
      fetchDiscovery();
      setError(err.message || 'Network error following creator');
      return false;
    }
  };

  // Unfollow action
  const unfollowCreator = async (creatorId: string): Promise<boolean> => {
    try {
      if (!token) {
        setError('Please log in to manage follows');
        return false;
      }

      // Optimistic update
      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId
            ? {
                ...c,
                isFollowing: false,
                stats: { ...c.stats, followersCount: Math.max(0, c.stats.followersCount - 1) },
              }
            : c
        )
      );
      if (selectedCreator && selectedCreator.id === creatorId) {
        setSelectedCreator((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: false,
                stats: { ...prev.stats, followersCount: Math.max(0, prev.stats.followersCount - 1) },
              }
            : null
        );
      }

      const res = await fetch('/api/v1/follow', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ creatorId }),
      });

      const json = await res.json();
      if (!json.success) {
        fetchDiscovery();
        setError(json.message || 'Failed to unfollow creator');
        return false;
      }

      return true;
    } catch (err: any) {
      fetchDiscovery();
      setError(err.message || 'Network error unfollowing creator');
      return false;
    }
  };

  return {
    discoveryData,
    creators,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedCountry,
    setSelectedCountry,
    selectedSection,
    setSelectedSection,
    selectedCreator,
    setSelectedCreator,
    followCreator,
    unfollowCreator,
    refetch: fetchDiscovery,
  };
}
