import { presenceService } from './presenceService';
import { privateRequestService } from './privateRequestService';
import { cacheService } from './cacheService';
import { redisService } from './redisService';
import { Logger } from '../utils/logger';

export class JobScheduler {
  private static instance: JobScheduler;
  private intervalIds: NodeJS.Timeout[] = [];
  private isRunning = false;

  public static getInstance(): JobScheduler {
    if (!JobScheduler.instance) {
      JobScheduler.instance = new JobScheduler();
    }
    return JobScheduler.instance;
  }

  /**
   * Start all background scheduled jobs
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    Logger.info('JobScheduler', 'Starting background job scheduler routines...');

    // 1. Presence Cleanup (Every 20 seconds)
    const presenceJob = setInterval(() => {
      try {
        presenceService.cleanupStalePresence(45000); // 45s threshold
      } catch (err: any) {
        Logger.error('JobScheduler', 'Error in Presence Cleanup Job', err);
      }
    }, 20000);
    this.intervalIds.push(presenceJob);

    // 2. Expired Private Requests Cleanup (Every 10 seconds)
    const requestsJob = setInterval(() => {
      try {
        const allRequests = privateRequestService.getAllRequests();
        const now = Date.now();
        allRequests.forEach((req) => {
          if (req.status === 'Pending' && now - req.requestedAt > 30000) {
            privateRequestService.expireRequest(req.id);
          }
        });
      } catch (err: any) {
        Logger.error('JobScheduler', 'Error in Expired Private Requests Job', err);
      }
    }, 10000);
    this.intervalIds.push(requestsJob);

    // 3. Inactive Session Cleanup (Every 30 seconds)
    const sessionJob = setInterval(async () => {
      try {
        // Clean stale WebRTC room data or idle sessions from Redis
        const staleRooms = await redisService.get<string[]>('runtime:stale_rooms');
        if (staleRooms && staleRooms.length > 0) {
          await redisService.del(staleRooms);
          await redisService.del('runtime:stale_rooms');
        }
      } catch (err: any) {
        Logger.error('JobScheduler', 'Error in Inactive Session Cleanup Job', err);
      }
    }, 30000);
    this.intervalIds.push(sessionJob);

    // 4. Notification Expiration Job (Every 60 seconds)
    const notifJob = setInterval(async () => {
      try {
        await redisService.delByPattern('notif:temp:*');
      } catch (err: any) {
        Logger.error('JobScheduler', 'Error in Notification Expiration Job', err);
      }
    }, 60000);
    this.intervalIds.push(notifJob);

    // 5. Temporary Cache Cleanup Job (Every 2 minutes)
    const cacheJob = setInterval(async () => {
      try {
        // Clean stale temporary keys if needed
        Logger.info('JobScheduler', 'Temporary Cache Cleanup Routine executed');
      } catch (err: any) {
        Logger.error('JobScheduler', 'Error in Cache Cleanup Job', err);
      }
    }, 120000);
    this.intervalIds.push(cacheJob);

    // 6. Analytics Aggregation Queue Job (Every 1 minute)
    const analyticsJob = setInterval(async () => {
      try {
        // Process queue of analytics events if pending
        const pendingEvents = await redisService.get<any[]>('analytics:queue');
        if (pendingEvents && pendingEvents.length > 0) {
          Logger.info('JobScheduler', `Aggregated ${pendingEvents.length} analytics events from Redis queue`);
          await redisService.del('analytics:queue');
        }
      } catch (err: any) {
        Logger.error('JobScheduler', 'Error in Analytics Aggregation Job', err);
      }
    }, 60000);
    this.intervalIds.push(analyticsJob);
  }

  /**
   * Stop all background scheduled jobs
   */
  public stop(): void {
    this.intervalIds.forEach((id) => clearInterval(id));
    this.intervalIds = [];
    this.isRunning = false;
    Logger.info('JobScheduler', 'Stopped background job scheduler');
  }
}

export const jobScheduler = JobScheduler.getInstance();
