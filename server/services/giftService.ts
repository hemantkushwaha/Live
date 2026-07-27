import { GiftItem, TipGiftRecord, UserWallet } from '../../shared/types';
import { walletService } from './walletService';
import { revenueService } from './revenueService';
import { Logger } from '../utils/logger';

export const DEFAULT_GIFTS: GiftItem[] = [
  { id: 'like', name: 'Like', icon: '❤️', price: 1 },
  { id: 'rose', name: 'Rose', icon: '🌹', price: 10 },
  { id: 'coffee', name: 'Coffee', icon: '☕', price: 50 },
  { id: 'pizza', name: 'Pizza', icon: '🍕', price: 100 },
  { id: 'diamond', name: 'Diamond', icon: '💎', price: 500 },
  { id: 'crown', name: 'Crown', icon: '👑', price: 1000 },
];

export class GiftService {
  private static instance: GiftService;

  // In-memory gift history mapped by streamId and global history
  private giftHistory: TipGiftRecord[] = [];
  private streamGiftsMap: Map<string, TipGiftRecord[]> = new Map();

  public static getInstance(): GiftService {
    if (!GiftService.instance) {
      GiftService.instance = new GiftService();
    }
    return GiftService.instance;
  }

  public getAvailableGifts(): GiftItem[] {
    return DEFAULT_GIFTS;
  }

  /**
   * Transfer coins from sender to receiver
   */
  public transferCoins(
    senderId: string,
    receiverId: string,
    amount: number,
    type: 'Gift' | 'Tip',
    description: string
  ): { senderWallet: UserWallet; receiverWallet: UserWallet } {
    if (senderId === receiverId) {
      throw new Error('Creator sending to self is not allowed.');
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new Error('Amount must be a positive number greater than zero.');
    }

    const senderWallet = walletService.getWallet(senderId);
    if (senderWallet.balance < amount) {
      throw new Error(`Insufficient wallet balance. Balance: ${senderWallet.balance} Coins, required: ${amount} Coins.`);
    }

    // Deduct from sender
    const { wallet: newSenderWallet } = walletService.recordTransaction(
      senderId,
      type,
      amount,
      description
    );

    // Credit to receiver
    const { wallet: newReceiverWallet } = walletService.recordTransaction(
      receiverId,
      'Credit',
      amount,
      `Received ${type} of ${amount} Coins`
    );

    newSenderWallet.totalTipsSent += amount;
    newReceiverWallet.totalTipsReceived += amount;

    return { senderWallet: newSenderWallet, receiverWallet: newReceiverWallet };
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
  ): {
    record: TipGiftRecord;
    senderWallet: UserWallet;
    receiverWallet: UserWallet;
  } {
    if (!streamId) {
      throw new Error('Unknown stream: Stream ID is required');
    }

    const gift = DEFAULT_GIFTS.find(
      (g) => g.id.toLowerCase() === giftId.toLowerCase() || g.name.toLowerCase() === giftId.toLowerCase()
    );

    if (!gift) {
      throw new Error(`Invalid or unknown gift: ${giftId}`);
    }

    const senderName = sender.username || sender.email.split('@')[0];
    const { senderWallet, receiverWallet } = this.transferCoins(
      sender.id,
      receiverId,
      gift.price,
      'Gift',
      `Sent gift ${gift.name} (${gift.icon}) to streamer ${receiverId}`
    );

    const record: TipGiftRecord = {
      id: `gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      streamId,
      senderId: sender.id,
      senderName,
      senderEmail: sender.email,
      receiverId,
      amount: gift.price,
      type: 'gift',
      giftName: gift.name,
      giftIcon: gift.icon,
      message: message ? message.trim() : undefined,
      createdAt: Date.now(),
    };

    this.giftHistory.push(record);

    let list = this.streamGiftsMap.get(streamId);
    if (!list) {
      list = [];
      this.streamGiftsMap.set(streamId, list);
    }
    list.push(record);

    // Process Creator Earnings & Financial Ledger
    revenueService.processEarning({
      category: 'gift',
      senderId: sender.id,
      creatorId: receiverId,
      totalCoins: gift.price,
      sourceId: record.id,
      description: `Gift ${gift.name} (${gift.icon}) sent in stream`,
    });

    Logger.info(
      'GiftService',
      `Gift ${gift.name} (${gift.price} Coins) sent by ${sender.email} to creator ${receiverId}`
    );

    return { record, senderWallet, receiverWallet };
  }

  /**
   * Send a custom tip from viewer to creator
   */
  public sendTip(
    sender: { id: string; email: string; username?: string },
    streamId: string,
    receiverId: string,
    amount: number,
    message?: string
  ): {
    record: TipGiftRecord;
    senderWallet: UserWallet;
    receiverWallet: UserWallet;
  } {
    if (!streamId) {
      throw new Error('Unknown stream: Stream ID is required');
    }

    const senderName = sender.username || sender.email.split('@')[0];
    const { senderWallet, receiverWallet } = this.transferCoins(
      sender.id,
      receiverId,
      amount,
      'Tip',
      `Tip of ${amount} Coins sent to streamer ${receiverId}`
    );

    const record: TipGiftRecord = {
      id: `tip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      streamId,
      senderId: sender.id,
      senderName,
      senderEmail: sender.email,
      receiverId,
      amount,
      type: 'tip',
      message: message ? message.trim() : undefined,
      createdAt: Date.now(),
    };

    this.giftHistory.push(record);

    let list = this.streamGiftsMap.get(streamId);
    if (!list) {
      list = [];
      this.streamGiftsMap.set(streamId, list);
    }
    list.push(record);

    // Process Creator Earnings & Financial Ledger
    revenueService.processEarning({
      category: 'tip',
      senderId: sender.id,
      creatorId: receiverId,
      totalCoins: amount,
      sourceId: record.id,
      description: `Tip of ${amount} Coins sent in stream`,
    });

    Logger.info(
      'GiftService',
      `Tip of ${amount} Coins sent by ${sender.email} to creator ${receiverId}`
    );

    return { record, senderWallet, receiverWallet };
  }

  /**
   * Get history of gifts and tips (optionally filtered by streamId or userId)
   */
  public getHistory(streamId?: string, userId?: string): TipGiftRecord[] {
    let list = this.giftHistory;

    if (streamId) {
      list = list.filter((item) => item.streamId === streamId);
    }

    if (userId) {
      list = list.filter((item) => item.senderId === userId || item.receiverId === userId);
    }

    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }
}

export const giftService = GiftService.getInstance();
