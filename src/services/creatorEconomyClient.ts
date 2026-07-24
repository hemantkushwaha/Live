import React from 'react';
import { apiClient } from '../config/api';
import { CreatorSettings, GiftItem, TipGiftRecord, UserWallet } from '../../shared/types';

export class CreatorEconomyClientService {
  /**
   * Fetch settings for a creator
   */
  public async getCreatorSettings(creatorId: string): Promise<CreatorSettings> {
    const response = await apiClient.get<{ success: boolean; data: CreatorSettings }>(
      `/api/v1/economy/settings/${creatorId}`
    );
    return response.data.data;
  }

  /**
   * Update settings for logged in creator
   */
  public async updateCreatorSettings(settings: Partial<CreatorSettings>): Promise<CreatorSettings> {
    const response = await apiClient.put<{ success: boolean; data: CreatorSettings; message?: string }>(
      '/api/v1/economy/settings',
      settings
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update settings');
    }
    return response.data.data;
  }

  /**
   * Get wallet for current user
   */
  public async getWallet(): Promise<UserWallet> {
    const response = await apiClient.get<{ success: boolean; data: UserWallet }>('/api/v1/economy/wallet');
    return response.data.data;
  }

  /**
   * Top up wallet balance
   */
  public async topUpWallet(amount: number): Promise<UserWallet> {
    const response = await apiClient.post<{ success: boolean; data: UserWallet; message?: string }>(
      '/api/v1/economy/wallet/topup',
      { amount }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to top up wallet');
    }
    return response.data.data;
  }

  /**
   * Send tip to stream creator
   */
  public async sendTip(
    streamId: string,
    receiverId: string,
    amount: number,
    message?: string
  ): Promise<TipGiftRecord> {
    let response;
    try {
      response = await apiClient.post<{ success: boolean; data: TipGiftRecord; message?: string }>(
        '/api/v1/tips/send',
        { streamId, receiverId, amount, message }
      );
    } catch {
      response = await apiClient.post<{ success: boolean; data: TipGiftRecord; message?: string }>(
        '/api/v1/economy/tip',
        { streamId, receiverId, amount, message }
      );
    }
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to send tip');
    }
    return response.data.data;
  }

  /**
   * Send gift to stream creator
   */
  public async sendGift(
    streamId: string,
    receiverId: string,
    giftId: string,
    message?: string
  ): Promise<TipGiftRecord> {
    let response;
    try {
      response = await apiClient.post<{ success: boolean; data: TipGiftRecord; message?: string }>(
        '/api/v1/gifts/send',
        { streamId, receiverId, giftId, message }
      );
    } catch {
      response = await apiClient.post<{ success: boolean; data: TipGiftRecord; message?: string }>(
        '/api/v1/economy/gift',
        { streamId, receiverId, giftId, message }
      );
    }
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to send gift');
    }
    return response.data.data;
  }

  /**
   * Get list of available gifts
   */
  public async getAvailableGifts(): Promise<GiftItem[]> {
    const response = await apiClient.get<{ success: boolean; data: GiftItem[] }>('/api/v1/economy/gifts/available');
    return response.data.data || [];
  }

  /**
   * Get tips and gifts history for stream
   */
  public async getStreamTipsGifts(streamId: string): Promise<TipGiftRecord[]> {
    const response = await apiClient.get<{ success: boolean; data: TipGiftRecord[] }>(
      `/api/v1/economy/stream/${streamId}/tips-gifts`
    );
    return response.data.data || [];
  }

  /**
   * Check requirement validation for requesting private call
   */
  public async checkRequirements(
    streamId: string,
    creatorId: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    totalTipped: number;
    minTipRequirement: number;
    privateCallPrice: number;
    viewerBalance: number;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        allowed: boolean;
        reason?: string;
        totalTipped: number;
        minTipRequirement: number;
        privateCallPrice: number;
        viewerBalance: number;
      };
    }>(`/api/v1/economy/stream/${streamId}/check-requirements`, {
      params: { creatorId },
    });
    return response.data.data;
  }
}

export const creatorEconomyClient = new CreatorEconomyClientService();
