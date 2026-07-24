import { streamService } from './streamService';
import { presenceService } from './presenceService';
import { Logger } from '../utils/logger';

export interface SignalingSession {
  streamId: string;
  hostUserId: string;
  viewerUserId: string;
  viewerSocketId: string;
  joinedAt: number;
}

export class SignalingService {
  // Map of streamId -> Map of viewerUserId -> SignalingSession
  private streamViewersMap: Map<string, Map<string, SignalingSession>> = new Map();

  /**
   * Register a viewer joining a stream for WebRTC signaling
   */
  public joinStream(streamId: string, viewerUserId: string, viewerSocketId: string): { hostUserId: string; session: SignalingSession } {
    const activeStreams = streamService.getAllStreams();
    const stream = activeStreams.find((s) => s.id === streamId || s.streamerId === streamId);

    if (!stream) {
      throw new Error(`Invalid stream: Stream ${streamId} is not active`);
    }

    const hostUserId = stream.streamerId;
    if (hostUserId === viewerUserId) {
      throw new Error('Host cannot join their own stream as a viewer');
    }

    if (!this.streamViewersMap.has(stream.id)) {
      this.streamViewersMap.set(stream.id, new Map());
    }

    const streamViewers = this.streamViewersMap.get(stream.id)!;
    const session: SignalingSession = {
      streamId: stream.id,
      hostUserId,
      viewerUserId,
      viewerSocketId,
      joinedAt: Date.now(),
    };

    streamViewers.set(viewerUserId, session);
    Logger.info('SignalingService', `Viewer ${viewerUserId} joined stream ${stream.id} for signaling`);

    return { hostUserId, session };
  }

  /**
   * Remove a viewer from stream WebRTC signaling
   */
  public leaveStream(streamId: string, viewerUserId: string): SignalingSession | null {
    const streamViewers = this.streamViewersMap.get(streamId);
    if (!streamViewers) return null;

    const session = streamViewers.get(viewerUserId) || null;
    if (session) {
      streamViewers.delete(viewerUserId);
      if (streamViewers.size === 0) {
        this.streamViewersMap.delete(streamId);
      }
      Logger.info('SignalingService', `Viewer ${viewerUserId} left stream ${streamId}`);
    }
    return session;
  }

  /**
   * Handle user disconnection: cleanup any viewer or host signaling sessions
   */
  public handleUserDisconnect(userId: string): Array<{ streamId: string; viewerUserId: string; hostUserId: string }> {
    const cleanedSessions: Array<{ streamId: string; viewerUserId: string; hostUserId: string }> = [];

    // Check if user was a viewer in any stream
    for (const [streamId, streamViewers] of this.streamViewersMap.entries()) {
      if (streamViewers.has(userId)) {
        const session = streamViewers.get(userId)!;
        streamViewers.delete(userId);
        cleanedSessions.push({
          streamId,
          viewerUserId: userId,
          hostUserId: session.hostUserId,
        });
      }
    }

    // Check if user was a host of any stream
    for (const [streamId, streamViewers] of this.streamViewersMap.entries()) {
      const activeStreams = streamService.getAllStreams();
      const stream = activeStreams.find((s) => s.id === streamId);
      if (stream && stream.streamerId === userId) {
        for (const [viewerUserId, session] of streamViewers.entries()) {
          cleanedSessions.push({
            streamId,
            viewerUserId,
            hostUserId: userId,
          });
        }
        this.streamViewersMap.delete(streamId);
      }
    }

    return cleanedSessions;
  }

  /**
   * Get all active sessions for a stream
   */
  public getStreamSessions(streamId: string): SignalingSession[] {
    const streamViewers = this.streamViewersMap.get(streamId);
    if (!streamViewers) return [];
    return Array.from(streamViewers.values());
  }

  /**
   * Validate signaling target
   */
  public validateSignalingTarget(streamId: string, fromUserId: string, targetUserId: string): boolean {
    const activeStreams = streamService.getAllStreams();
    const stream = activeStreams.find((s) => s.id === streamId);
    if (!stream) return false;

    const isHost = stream.streamerId === fromUserId || stream.streamerId === targetUserId;
    return isHost;
  }
}

export const signalingService = new SignalingService();
