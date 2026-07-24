import { PrivateCallRequest, User } from '../../shared/types';
import { streamService } from './streamService';
import { privateCallSettingsService } from './privateCallSettingsService';
import { walletService } from './walletService';
import { Logger } from '../utils/logger';

export type PrivateRequestEventCallback = (
  event: 'received' | 'updated' | 'expired' | 'accepted' | 'rejected' | 'queue-updated',
  request: PrivateCallRequest
) => void;

export class PrivateRequestService {
  private static instance: PrivateRequestService;

  // Map of requestId -> PrivateCallRequest
  private requests: Map<string, PrivateCallRequest> = new Map();

  // Map of requestId -> NodeJS.Timeout
  private timers: Map<string, NodeJS.Timeout> = new Map();

  // Event listeners for socket broadcasting
  private eventListeners: Set<PrivateRequestEventCallback> = new Set();

  public static getInstance(): PrivateRequestService {
    if (!PrivateRequestService.instance) {
      PrivateRequestService.instance = new PrivateRequestService();
    }
    return PrivateRequestService.instance;
  }

  public onEvent(callback: PrivateRequestEventCallback): () => void {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  private notify(
    event: 'received' | 'updated' | 'expired' | 'accepted' | 'rejected' | 'queue-updated',
    request: PrivateCallRequest
  ) {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event, request);
      } catch (err) {
        Logger.error('PrivateRequestService', 'Error in event listener', err);
      }
    });
  }

  /**
   * Create a new private call request from a viewer to a streamer
   */
  public createRequest(
    viewer: User,
    streamId: string,
    requestedDuration?: number
  ): PrivateCallRequest {
    const stream = streamService.getStreamById(streamId);
    if (!stream) {
      throw new Error('Stream not found or inactive');
    }

    const creatorId = stream.streamerId;
    if (viewer.id === creatorId) {
      throw new Error('Streamer cannot request a private call with themselves');
    }

    // 1. Get creator private call settings
    const settings = privateCallSettingsService.getSettings(creatorId);

    // 2. Check if private calls are enabled
    if (!settings.enabled) {
      throw new Error('Private calls are currently disabled by this creator.');
    }

    // 3. Check if creator is busy
    if (settings.busyMode) {
      throw new Error('Creator is currently busy and not accepting call requests.');
    }

    // 4. Validate requested duration
    const duration = requestedDuration && requestedDuration > 0
      ? Math.min(requestedDuration, settings.maxDuration)
      : Math.min(5, settings.maxDuration);

    if (duration <= 0 || duration > settings.maxDuration) {
      throw new Error(`Requested duration must be between 1 and ${settings.maxDuration} minutes.`);
    }

    // 5. Calculate estimated cost
    const estimatedCost = duration * settings.pricePerMinute;

    // 6. Check viewer's wallet balance vs minimum coins requirement and estimated cost
    const wallet = walletService.getWallet(viewer.id);
    if (wallet.balance < settings.minCoins) {
      throw new Error(
        `Insufficient Coins: Creator requires a minimum wallet balance of ${settings.minCoins} Coins to request a call (Your balance: ${wallet.balance} Coins).`
      );
    }

    if (wallet.balance < estimatedCost) {
      throw new Error(
        `Insufficient Coins for ${duration} minute call: Estimated cost is ${estimatedCost} Coins (Your balance: ${wallet.balance} Coins).`
      );
    }

    // 7. Check for duplicate pending request by this viewer
    const existingPending = Array.from(this.requests.values()).find(
      (r) =>
        (r.streamId === stream.id || r.creatorId === creatorId) &&
        r.viewerId === viewer.id &&
        r.status === 'Pending'
    );

    if (existingPending) {
      throw new Error('Duplicate request: You already have a pending call request.');
    }

    const now = Date.now();
    const requestId = `req_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const request: PrivateCallRequest = {
      id: requestId,
      streamId: stream.id,
      creatorId,
      streamerId: creatorId,
      viewerId: viewer.id,
      viewerEmail: viewer.email,
      viewerName: viewer.username || viewer.email,
      status: 'Pending',
      requestedAt: now,
      createdAt: now,
      requestedDuration: duration,
      estimatedCost,
    };

    this.requests.set(requestId, request);

    // 8. Schedule 30-second timeout for automatic expiry
    const timer = setTimeout(() => {
      this.expireRequest(requestId);
    }, 30000);

    this.timers.set(requestId, timer);

    Logger.info(
      'PrivateRequestService',
      `Created request ${requestId} from viewer ${viewer.email} to creator ${creatorId} (${duration} mins, ${estimatedCost} Coins)`
    );

    this.notify('received', request);
    return request;
  }

  /**
   * Cancel an active request
   */
  public cancelRequest(requestId: string, userId: string): PrivateCallRequest {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.viewerId !== userId && request.creatorId !== userId && request.streamerId !== userId) {
      throw new Error('Unauthorized to cancel this request');
    }

    if (request.status === 'Pending') {
      const timer = this.timers.get(requestId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(requestId);
      }

      request.status = 'Cancelled';
      this.requests.set(requestId, request);

      Logger.info('PrivateRequestService', `Cancelled request ${requestId} by user ${userId}`);
      this.notify('updated', request);
    }

    return request;
  }

  /**
   * Accept a pending private call request (Creator)
   */
  public acceptRequest(requestId: string, creatorId: string): PrivateCallRequest {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.creatorId !== creatorId && request.streamerId !== creatorId) {
      throw new Error('Unauthorized to accept this request');
    }

    if (request.status === 'Expired' || request.status === 'expired') {
      throw new Error('Cannot accept expired request');
    }

    if (request.status === 'Accepted' || request.status === 'accepted') {
      throw new Error('Duplicate acceptance: Request already accepted');
    }

    // Validate creator stream / online status
    const stream = streamService.getStreamById(request.streamId);
    if (!stream) {
      throw new Error('Creator offline: Stream is no longer active');
    }

    // Clear timer
    const timer = this.timers.get(requestId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(requestId);
    }

    // Set status to Accepted
    request.status = 'Accepted';
    this.requests.set(requestId, request);

    Logger.info('PrivateRequestService', `Accepted request ${requestId} by creator ${creatorId}`);

    // Auto-reject all other pending requests for this creator/stream
    const otherPending = Array.from(this.requests.values()).filter(
      (r) =>
        r.id !== requestId &&
        (r.creatorId === creatorId || r.streamId === request.streamId) &&
        (r.status === 'Pending' || r.status === 'pending')
    );

    otherPending.forEach((otherReq) => {
      const otherTimer = this.timers.get(otherReq.id);
      if (otherTimer) {
        clearTimeout(otherTimer);
        this.timers.delete(otherReq.id);
      }
      otherReq.status = 'Rejected';
      this.requests.set(otherReq.id, otherReq);
      Logger.info('PrivateRequestService', `Auto-rejected pending request ${otherReq.id} because request ${requestId} was accepted`);
      this.notify('rejected', otherReq);
    });

    this.notify('accepted', request);
    return request;
  }

  /**
   * Reject a pending private call request (Creator)
   */
  public rejectRequest(requestId: string, creatorId: string): PrivateCallRequest {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.creatorId !== creatorId && request.streamerId !== creatorId) {
      throw new Error('Unauthorized to reject this request');
    }

    if (request.status === 'Expired' || request.status === 'expired') {
      throw new Error('Cannot reject expired request');
    }

    const timer = this.timers.get(requestId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(requestId);
    }

    request.status = 'Rejected';
    this.requests.set(requestId, request);

    Logger.info('PrivateRequestService', `Rejected request ${requestId} by creator ${creatorId}`);
    this.notify('rejected', request);
    return request;
  }

  /**
   * Automatically expire a request after 30 seconds
   */
  public expireRequest(requestId: string): PrivateCallRequest | null {
    const request = this.requests.get(requestId);
    if (!request) return null;

    const timer = this.timers.get(requestId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(requestId);
    }

    if (request.status === 'Pending') {
      request.status = 'Expired';
      this.requests.set(requestId, request);

      Logger.info('PrivateRequestService', `Expired request ${requestId} after timeout`);
      this.notify('expired', request);
    }

    return request;
  }

  /**
   * Get all pending requests for a given stream or creator
   */
  public getPendingRequestsForStream(streamId: string): PrivateCallRequest[] {
    const stream = streamService.getStreamById(streamId);
    const targetStreamId = stream ? stream.id : streamId;

    return Array.from(this.requests.values()).filter(
      (r) => (r.streamId === targetStreamId || r.creatorId === targetStreamId) && r.status === 'Pending'
    );
  }

  /**
   * Get pending request for a viewer
   */
  public getPendingRequestForViewer(viewerId: string, streamId?: string): PrivateCallRequest | null {
    const found = Array.from(this.requests.values()).find((r) => {
      if (r.viewerId !== viewerId || r.status !== 'Pending') return false;
      if (streamId) {
        const stream = streamService.getStreamById(streamId);
        const targetId = stream ? stream.id : streamId;
        return r.streamId === targetId || r.creatorId === targetId;
      }
      return true;
    });

    return found || null;
  }

  /**
   * Get request by ID
   */
  public getRequestById(requestId: string): PrivateCallRequest | undefined {
    return this.requests.get(requestId);
  }

  /**
   * Get all requests
   */
  public getAllRequests(): PrivateCallRequest[] {
    return Array.from(this.requests.values());
  }

  /**
   * Clean up requests when a stream ends
   */
  public handleStreamEnded(streamId: string): void {
    const requestsToCancel = Array.from(this.requests.values()).filter(
      (r) => (r.streamId === streamId || r.creatorId === streamId) && r.status === 'Pending'
    );

    requestsToCancel.forEach((req) => {
      const timer = this.timers.get(req.id);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(req.id);
      }
      req.status = 'Expired';
      this.notify('expired', req);
    });
  }
}

export const privateRequestService = PrivateRequestService.getInstance();
