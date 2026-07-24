import { CreatorSettings, GiftItem, TipGiftRecord, UserWallet } from '../../shared/types';
import { walletService } from './walletService';
import { giftService, DEFAULT_GIFTS } from './giftService';
import { Logger } from '../utils/logger';

export const AVAILABLE_GIFTS: GiftItem[] = DEFAULT_GIFTS;

export class CreatorEconomyService {
  private static instance: CreatorEconomyService;

  // In-memory data structures
  private creatorSettingsMap: Map<string, CreatorSettings> = new Map();
  private userWallets: Map<string, UserWallet> = new Map();
  private streamTipGifts: Map<string, TipGiftRecord[]> = new Map();

  public static getInstance(): CreatorEconomyService {
    if (!CreatorEconomyService.instance) {
      CreatorEconomyService.instance = new CreatorEconomyService();
    }
    return CreatorEconomyService.instance;
  }

  /**
   * Get creator settings or return default configuration
   */
  public getCreatorSettings(creatorId: string): CreatorSettings {
    if (!this.creatorSettingsMap.has(creatorId)) {
      const defaultSettings: CreatorSettings = {
        creatorId,
        privateCallPrice: 5, // $5.00
        minTipRequirement: 5, // Minimum $5 total tip required to send private request
        maxCallDuration: 15, // 15 minutes
        autoReject: false,
        offlineMode: false,
      };
      this.creatorSettingsMap.set(creatorId, defaultSettings);
    }
    return this.creatorSettingsMap.get(creatorId)!;
  }

  /**
   * Update creator settings
   */
  public updateCreatorSettings(creatorId: string, updates: Partial<CreatorSettings>): CreatorSettings {
    const current = this.getCreatorSettings(creatorId);
    const updated: CreatorSettings = {
      ...current,
      ...updates,
      creatorId, // Ensure creatorId is immutable
    };
    this.creatorSettingsMap.set(creatorId, updated);
    Logger.info('CreatorEconomy', `Updated settings for creator ${creatorId}: minTip=$${updated.minTipRequirement}, price=$${updated.privateCallPrice}`);
    return updated;
  }

  /**
   * Get user wallet via walletService
   */
  public getUserWallet(userId: string): UserWallet {
    return walletService.getWallet(userId);
  }

  /**
   * Top up user wallet via walletService
   */
  public topUpWallet(userId: string, amount: number): UserWallet {
    const { wallet } = walletService.demoRecharge(userId, amount);
    return wallet;
  }

  /**
   * Send a tip from viewer to creator
   */
  public sendTip(
    sender: { id: string; email: string; username?: string },
    streamId: string,
    receiverId: string,
    amount: number,
    message?: string
  ): TipGiftRecord {
    const { record } = giftService.sendTip(sender, streamId, receiverId, amount, message);
    return record;
  }

  /**
   * Send a gift from viewer to creator
   */
  public sendGift(
    sender: { id: string; email: string; username?: string },
    streamId: string,
    receiverId: string,
    giftId: string,
    message?: string
  ): TipGiftRecord {
    const { record } = giftService.sendGift(sender, streamId, receiverId, giftId, message);
    return record;
  }

  /**
   * Get all tips and gifts for a stream
   */
  public getStreamTipsAndGifts(streamId: string): TipGiftRecord[] {
    return giftService.getHistory(streamId);
  }

  /**
   * Get total tips sent by a specific viewer to a specific stream
   */
  public getTotalTippedByViewerForStream(streamId: string, viewerId: string): number {
    const list = this.getStreamTipsAndGifts(streamId);
    return list
      .filter((record) => record.senderId === viewerId)
      .reduce((sum, record) => sum + record.amount, 0);
  }

  /**
   * Validate if a viewer satisfies creator's rules for requesting a private call
   */
  public validatePrivateRequestRequirements(
    creatorId: string,
    streamId: string,
    viewerId: string
  ): {
    allowed: boolean;
    reason?: string;
    totalTipped: number;
    minTipRequirement: number;
    privateCallPrice: number;
    viewerBalance: number;
  } {
    const settings = this.getCreatorSettings(creatorId);
    if (settings.offlineMode) {
      return {
        allowed: false,
        reason: 'Creator is currently not accepting private call requests (Offline Mode).',
        totalTipped: 0,
        minTipRequirement: settings.minTipRequirement,
        privateCallPrice: settings.privateCallPrice,
        viewerBalance: this.getUserWallet(viewerId).balance,
      };
    }

    if (settings.autoReject) {
      return {
        allowed: false,
        reason: 'Creator is not accepting private call requests at this time.',
        totalTipped: 0,
        minTipRequirement: settings.minTipRequirement,
        privateCallPrice: settings.privateCallPrice,
        viewerBalance: this.getUserWallet(viewerId).balance,
      };
    }

    const totalTipped = this.getTotalTippedByViewerForStream(streamId, viewerId);
    const wallet = this.getUserWallet(viewerId);

    if (totalTipped < settings.minTipRequirement && wallet.balance < settings.privateCallPrice) {
      return {
        allowed: false,
        reason: `Creator requires a minimum total tip of $${settings.minTipRequirement.toFixed(
          2
        )} or a wallet balance of $${settings.privateCallPrice.toFixed(
          2
        )}. You have tipped $${totalTipped.toFixed(2)} and your balance is $${wallet.balance.toFixed(2)}.`,
        totalTipped,
        minTipRequirement: settings.minTipRequirement,
        privateCallPrice: settings.privateCallPrice,
        viewerBalance: wallet.balance,
      };
    }

    return {
      allowed: true,
      totalTipped,
      minTipRequirement: settings.minTipRequirement,
      privateCallPrice: settings.privateCallPrice,
      viewerBalance: wallet.balance,
    };
  }
}

export const creatorEconomyService = CreatorEconomyService.getInstance();
