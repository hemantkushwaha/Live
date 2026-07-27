import { Server as SocketIOServer } from 'socket.io';
import { CallSession, CallSessionSummary, PrivateSessionState } from '../../shared/types';
import { privateSessionManager } from './privateSessionManager';
import { walletTransferEngine } from './walletTransferEngine';
import { walletService } from './walletService';
import { privateRequestService } from './privateRequestService';
import { privateCallSettingsService } from './privateCallSettingsService';
import { presenceService } from './presenceService';
import { revenueService } from './revenueService';
import { SOCKET_EVENTS } from '../../shared/events';
import { Logger } from '../utils/logger';

export class BillingService {
  private static instance: BillingService;

  // Active session timers: sessionId -> NodeJS.Timeout
  private sessionTimers: Map<string, NodeJS.Timeout> = new Map();
  private ioServer: SocketIOServer | null = null;

  public static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  public setSocketServer(io: SocketIOServer): void {
    this.ioServer = io;
  }

  /**
   * Start a billing session when a call begins
   */
  public startBillingSession(session: CallSession): CallSession {
    const requestId = session.requestId;
    let ratePerMinute = 50; // Default fallback
    let durationMinutes = 5; // Default fallback

    if (requestId) {
      const request = privateRequestService.getRequestById(requestId);
      if (request) {
        durationMinutes = request.requestedDuration || 5;
        const settings = privateCallSettingsService.getSettings(session.creatorId);
        ratePerMinute = settings.pricePerMinute || 50;
      }
    } else {
      const settings = privateCallSettingsService.getSettings(session.creatorId);
      ratePerMinute = settings.pricePerMinute || 50;
    }

    const maxDurationSeconds = durationMinutes * 60;
    const now = Date.now();

    // Check initial viewer balance
    const viewerWallet = walletService.getWallet(session.viewerId);
    if (viewerWallet.balance < ratePerMinute) {
      throw new Error(
        `Insufficient balance: Viewer has ${viewerWallet.balance} Coins, but creator rate is ${ratePerMinute} Coins/minute.`
      );
    }

    // Initialize session fields
    session.ratePerMinute = ratePerMinute;
    session.durationMinutes = durationMinutes;
    session.maxDurationSeconds = maxDurationSeconds;
    session.coinsPaid = 0;
    session.creatorEarned = 0;
    session.elapsedTimeSeconds = 0;
    session.remainingTimeSeconds = maxDurationSeconds;
    session.status = 'active';
    session.state = 'Connecting';
    session.active = true;

    privateSessionManager.createSession(session);

    // Initial first-minute deduction (or deduction at minute 0/start)
    this.processMinuteBilling(session, 1);

    session.state = 'Active';

    // Start 1-second interval timer
    const timer = setInterval(() => {
      this.tickSession(session.id);
    }, 1000);

    this.sessionTimers.set(session.id, timer);

    Logger.info(
      'BillingService',
      `Started billing timer for session ${session.id} (Rate: ${ratePerMinute} coins/min, Duration: ${durationMinutes} mins)`
    );

    return session;
  }

  /**
   * Ticks every second for an active private call session
   */
  private tickSession(sessionId: string): void {
    const session = privateSessionManager.getSession(sessionId);
    if (!session || !session.active || session.status !== 'active') {
      this.clearTimer(sessionId);
      return;
    }

    const now = Date.now();
    const elapsedTimeSeconds = Math.floor((now - session.startedAt) / 1000);
    const remainingTimeSeconds = Math.max(0, (session.maxDurationSeconds || 0) - elapsedTimeSeconds);

    session.elapsedTimeSeconds = elapsedTimeSeconds;
    session.remainingTimeSeconds = remainingTimeSeconds;

    // Check minute boundaries for subsequent minute deductions (at 60s, 120s, 180s, etc.)
    const currentCompletedMinutes = Math.floor(elapsedTimeSeconds / 60);
    const nextMinuteIndex = currentCompletedMinutes + 1;
    const expectedPaidCoins = nextMinuteIndex * (session.ratePerMinute || 0);

    if (
      elapsedTimeSeconds > 0 &&
      elapsedTimeSeconds % 60 === 0 &&
      (session.coinsPaid || 0) < expectedPaidCoins &&
      remainingTimeSeconds > 0
    ) {
      const viewerWallet = walletService.getWallet(session.viewerId);
      const rate = session.ratePerMinute || 50;

      // Check if viewer has enough balance for the next minute
      if (viewerWallet.balance < rate) {
        Logger.warn(
          'BillingService',
          `Viewer ${session.viewerId} has insufficient balance (${viewerWallet.balance} Coins) for minute ${nextMinuteIndex}. Terminating call.`
        );
        this.stopBillingSession(sessionId, 'low_balance');
        return;
      }

      this.processMinuteBilling(session, nextMinuteIndex);
    }

    // Determine state & Warning triggers
    let currentState: PrivateSessionState = session.state || 'Active';

    // Low balance / 30-second warning check
    const viewerWallet = walletService.getWallet(session.viewerId);
    const rate = session.ratePerMinute || 50;
    const isLowBalanceWarning = viewerWallet.balance < rate * 2; // Less than 2 minutes of balance left
    const is30SecWarning = remainingTimeSeconds <= 30 && remainingTimeSeconds > 0;

    if (is30SecWarning || isLowBalanceWarning) {
      if (currentState !== 'Warning') {
        currentState = 'Warning';
        session.state = 'Warning';

        const warningMsg = is30SecWarning
          ? '30 seconds remaining in private call!'
          : 'Low coin balance! Please recharge to continue call.';

        this.broadcastToParticipants(session, SOCKET_EVENTS.PRIVATE_WARNING, {
          sessionId: session.id,
          remainingTime: remainingTimeSeconds,
          message: warningMsg,
          coinsRemaining: viewerWallet.balance,
        });
      }
    } else if (currentState === 'Warning' && remainingTimeSeconds > 30) {
      currentState = 'Active';
      session.state = 'Active';
    }

    // Broadcast 1-second timer event
    this.broadcastToParticipants(session, SOCKET_EVENTS.PRIVATE_TIMER, {
      sessionId: session.id,
      elapsedTime: elapsedTimeSeconds,
      remainingTime: remainingTimeSeconds,
      currentCost: session.coinsPaid || 0,
      coinsRemaining: viewerWallet.balance,
      state: currentState,
    });

    // Check Auto Termination when time expires
    if (remainingTimeSeconds <= 0) {
      Logger.info('BillingService', `Session ${sessionId} duration limit reached. Ending session.`);
      this.stopBillingSession(sessionId, 'completed');
    }
  }

  /**
   * Process per-minute wallet transfer
   */
  private processMinuteBilling(session: CallSession, minuteNumber: number): void {
    const rate = session.ratePerMinute || 50;

    try {
      const result = walletTransferEngine.transferCoins(
        session.viewerId,
        session.creatorId,
        rate,
        `Private call minute ${minuteNumber} (${session.id})`
      );

      session.coinsPaid = (session.coinsPaid || 0) + rate;
      session.creatorEarned = (session.creatorEarned || 0) + rate;

      // Process Creator Earnings & Financial Ledger (85% Creator / 15% Platform)
      revenueService.processEarning({
        category: 'private_call',
        senderId: session.viewerId,
        creatorId: session.creatorId,
        totalCoins: rate,
        sourceId: session.id,
        description: `Private call minute ${minuteNumber}`,
      });

      // Broadcast private:billing event
      this.broadcastToParticipants(session, SOCKET_EVENTS.PRIVATE_BILLING, {
        sessionId: session.id,
        minute: minuteNumber,
        amountDeducted: rate,
        coinsPaid: session.coinsPaid,
        creatorEarned: session.creatorEarned,
        viewerBalance: result.viewerWallet.balance,
        creatorBalance: result.creatorWallet.balance,
      });

      // Broadcast wallet update event to both clients
      this.broadcastToParticipants(session, SOCKET_EVENTS.WALLET_UPDATED, {
        viewerWallet: result.viewerWallet,
        creatorWallet: result.creatorWallet,
      });
    } catch (err: any) {
      Logger.error('BillingService', `Error in processMinuteBilling for session ${session.id}`, err);
      this.stopBillingSession(session.id, 'low_balance');
    }
  }

  /**
   * Stop billing and complete private call session
   */
  public stopBillingSession(
    sessionId: string,
    endReason: 'completed' | 'user_ended' | 'low_balance' | 'timeout' | 'disconnected' = 'user_ended'
  ): CallSessionSummary | null {
    const session = privateSessionManager.getSession(sessionId);
    this.clearTimer(sessionId);

    if (!session) return null;

    const now = Date.now();
    session.status = 'completed';
    session.state = 'Completed';
    session.active = false;
    session.endedAt = now;

    const summary: CallSessionSummary = {
      sessionId: session.id,
      requestId: session.requestId,
      streamId: session.streamId,
      creatorId: session.creatorId,
      creatorName: session.creatorName || 'Creator',
      viewerId: session.viewerId,
      viewerName: session.viewerName || 'Viewer',
      durationSeconds: session.elapsedTimeSeconds || Math.floor((now - session.startedAt) / 1000),
      coinsPaid: session.coinsPaid || 0,
      creatorEarned: session.creatorEarned || 0,
      ratePerMinute: session.ratePerMinute || 50,
      startedAt: session.startedAt,
      endedAt: now,
      endReason,
    };

    privateSessionManager.saveSummary(summary);

    // Broadcast private:completed and private:ended socket events
    const payload = {
      sessionId: session.id,
      session,
      summary,
      reason: endReason,
    };

    this.broadcastToParticipants(session, SOCKET_EVENTS.PRIVATE_COMPLETED, payload);
    this.broadcastToParticipants(session, SOCKET_EVENTS.PRIVATE_ENDED, payload);
    this.broadcastToParticipants(session, SOCKET_EVENTS.PRIVATE_CALL_ENDED, payload);

    Logger.info(
      'BillingService',
      `Completed private call session ${sessionId}. Summary: ${summary.durationSeconds}s, ${summary.coinsPaid} coins paid.`
    );

    return summary;
  }

  private clearTimer(sessionId: string): void {
    const timer = this.sessionTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.sessionTimers.delete(sessionId);
    }
  }

  private broadcastToParticipants(session: CallSession, event: string, payload: any): void {
    if (!this.ioServer) return;

    const onlineUsers = presenceService.getOnlineUsers();
    const creatorUser = onlineUsers.find((u) => u.userId === session.creatorId);
    const viewerUser = onlineUsers.find((u) => u.userId === session.viewerId);

    if (creatorUser?.socketId) {
      this.ioServer.to(creatorUser.socketId).emit(event, payload);
    }
    if (viewerUser?.socketId) {
      this.ioServer.to(viewerUser.socketId).emit(event, payload);
    }
  }
}

export const billingService = BillingService.getInstance();
