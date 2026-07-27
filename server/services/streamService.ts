import { StreamRoom, User } from '../../shared/types';
import { redisService } from './redisService';
import { cacheService } from './cacheService';

export interface ViewerSessionRecord {
  viewerId: string;
  streamId: string;
  joinedAt: number;
  leftAt?: number;
}

export class StreamService {
  private static instance: StreamService;
  private activeStreams: Map<string, StreamRoom> = new Map();
  private viewerLogs: Map<string, ViewerSessionRecord[]> = new Map();

  private static REDIS_STREAMS_KEY = 'runtime:streams';

  public static getInstance(): StreamService {
    if (!StreamService.instance) {
      StreamService.instance = new StreamService();
      StreamService.instance.loadFromRedis();
    }
    return StreamService.instance;
  }

  private async loadFromRedis(): Promise<void> {
    try {
      const streams = await redisService.hgetall<StreamRoom>(StreamService.REDIS_STREAMS_KEY);
      for (const [userId, stream] of Object.entries(streams)) {
        if (stream && stream.id) {
          this.activeStreams.set(userId, stream);
        }
      }
    } catch (err) {
      // Graceful fallback
    }
  }

  /**
   * Retrieve all currently active live streams
   */
  public getAllStreams(): StreamRoom[] {
    return Array.from(this.activeStreams.values());
  }

  /**
   * Find stream by host/streamer User ID
   */
  public getStreamByHostId(hostUserId: string): StreamRoom | undefined {
    return this.activeStreams.get(hostUserId);
  }

  /**
   * Find stream by Stream ID
   */
  public getStreamById(streamId: string): StreamRoom | undefined {
    for (const stream of this.activeStreams.values()) {
      if (stream.id === streamId || stream.streamerId === streamId) {
        return stream;
      }
    }
    return undefined;
  }

  /**
   * Start a new public live stream for an authenticated user
   */
  public startStream(user: { id: string; email: string; username?: string }, title?: string): StreamRoom {
    if (this.activeStreams.has(user.id)) {
      throw new Error('User is already hosting an active live stream.');
    }

    const hostName = user.username || user.email.split('@')[0];
    const streamTitle = title && title.trim() ? title.trim() : `${hostName}'s Live Broadcast`;

    const streamRoom: StreamRoom = {
      id: `stream_${user.id}`,
      streamerId: user.id,
      streamerName: hostName,
      streamerEmail: user.email,
      title: streamTitle,
      viewers: [], // Viewer count = 0
      peakViewers: 0,
      isPausedForPrivate: false,
      createdAt: Date.now(),
    };

    this.activeStreams.set(user.id, streamRoom);
    this.viewerLogs.set(streamRoom.id, []);

    // Persist active stream in Redis & invalidate discovery cache
    redisService.hset(StreamService.REDIS_STREAMS_KEY, user.id, streamRoom).catch(() => {});
    cacheService.onStreamStart(user.id).catch(() => {});

    return streamRoom;
  }

  /**
   * Add a viewer to an active stream
   */
  public addViewer(streamId: string, viewerId: string): StreamRoom {
    const stream = this.getStreamById(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    if (!stream.viewers.includes(viewerId)) {
      stream.viewers.push(viewerId);
    }

    if (stream.viewers.length > (stream.peakViewers || 0)) {
      stream.peakViewers = stream.viewers.length;
    }

    let logs = this.viewerLogs.get(stream.id);
    if (!logs) {
      logs = [];
      this.viewerLogs.set(stream.id, logs);
    }

    // Check if open session exists
    const existing = logs.find((l) => l.viewerId === viewerId && !l.leftAt);
    if (!existing) {
      logs.push({
        viewerId,
        streamId: stream.id,
        joinedAt: Date.now(),
      });
    }

    return stream;
  }

  /**
   * Remove a viewer from an active stream
   */
  public removeViewer(streamId: string, viewerId: string): StreamRoom | null {
    const stream = this.getStreamById(streamId);
    if (!stream) return null;

    stream.viewers = stream.viewers.filter((id) => id !== viewerId);

    const logs = this.viewerLogs.get(stream.id);
    if (logs) {
      const session = logs.find((l) => l.viewerId === viewerId && !l.leftAt);
      if (session) {
        session.leftAt = Date.now();
      }
    }

    return stream;
  }

  /**
   * Get session logs for a stream
   */
  public getViewerLogs(streamId: string): ViewerSessionRecord[] {
    const stream = this.getStreamById(streamId);
    if (!stream) return [];
    return this.viewerLogs.get(stream.id) || [];
  }

  /**
   * End an active live stream for a host
   */
  public endStream(hostUserId: string): StreamRoom {
    const stream = this.activeStreams.get(hostUserId);
    if (!stream) {
      throw new Error('No active live stream found for this user.');
    }

    this.activeStreams.delete(hostUserId);
    this.viewerLogs.delete(stream.id);

    redisService.hdel(StreamService.REDIS_STREAMS_KEY, hostUserId).catch(() => {});
    cacheService.onStreamEnd(hostUserId).catch(() => {});

    return stream;
  }

  /**
   * Remove stream safely on disconnect
   */
  public removeStreamByUserId(userId: string): StreamRoom | null {
    const stream = this.activeStreams.get(userId);
    if (stream) {
      this.activeStreams.delete(userId);
      this.viewerLogs.delete(stream.id);

      redisService.hdel(StreamService.REDIS_STREAMS_KEY, userId).catch(() => {});
      cacheService.onStreamEnd(userId).catch(() => {});

      return stream;
    }
    return null;
  }
}

export const streamService = StreamService.getInstance();
