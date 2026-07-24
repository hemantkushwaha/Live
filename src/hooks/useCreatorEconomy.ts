import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { CreatorSettings, GiftItem, TipGiftRecord, UserWallet } from '../../shared/types';
import { SOCKET_EVENTS } from '../../shared/events';
import { creatorEconomyClient } from '../services/creatorEconomyClient';
import { useAuth } from '../contexts/AuthContext';

interface UseCreatorEconomyOptions {
  streamId?: string;
  creatorId?: string;
  socket?: Socket | null;
}

export function useCreatorEconomy({ streamId, creatorId, socket }: UseCreatorEconomyOptions = {}) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [creatorSettings, setCreatorSettings] = useState<CreatorSettings | null>(null);
  const [availableGifts, setAvailableGifts] = useState<GiftItem[]>([]);
  const [tipGifts, setTipGifts] = useState<TipGiftRecord[]>([]);
  const [latestTipGift, setLatestTipGift] = useState<TipGiftRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null | undefined>(socket);
  socketRef.current = socket;

  // Fetch initial user wallet
  const refreshWallet = useCallback(async () => {
    if (!user) return;
    try {
      const data = await creatorEconomyClient.getWallet();
      setWallet(data);
    } catch (err: any) {
      // Ignore initial unauth errors
    }
  }, [user]);

  // Fetch creator settings
  const refreshCreatorSettings = useCallback(async () => {
    const targetId = creatorId || user?.id;
    if (!targetId) return;
    try {
      const data = await creatorEconomyClient.getCreatorSettings(targetId);
      setCreatorSettings(data);
    } catch (err: any) {
      // Ignore
    }
  }, [creatorId, user]);

  // Fetch available gifts
  const refreshAvailableGifts = useCallback(async () => {
    try {
      const gifts = await creatorEconomyClient.getAvailableGifts();
      setAvailableGifts(gifts);
    } catch (err: any) {
      // Ignore
    }
  }, []);

  // Fetch stream tip/gift history
  const refreshStreamTipsGifts = useCallback(async () => {
    if (!streamId) return;
    try {
      const records = await creatorEconomyClient.getStreamTipsGifts(streamId);
      setTipGifts(records);
    } catch (err: any) {
      // Ignore
    }
  }, [streamId]);

  useEffect(() => {
    refreshWallet();
    refreshCreatorSettings();
    refreshAvailableGifts();
    refreshStreamTipsGifts();
  }, [refreshWallet, refreshCreatorSettings, refreshAvailableGifts, refreshStreamTipsGifts]);

  // Socket event listeners for real-time tips/gifts and wallet updates
  useEffect(() => {
    const activeSocket = socketRef.current;
    if (!activeSocket) return;

    const handleTipSent = (data: { record: TipGiftRecord }) => {
      const record = data?.record;
      if (!record) return;

      if (!streamId || record.streamId === streamId) {
        setTipGifts((prev) => [...prev, record]);
        setLatestTipGift(record);

        // Clear latest tip gift animation banner after 5 seconds
        setTimeout(() => {
          setLatestTipGift((current) => (current?.id === record.id ? null : current));
        }, 5000);
      }
    };

    const handleGiftSent = (data: { record: TipGiftRecord }) => {
      const record = data?.record;
      if (!record) return;

      if (!streamId || record.streamId === streamId) {
        setTipGifts((prev) => [...prev, record]);
        setLatestTipGift(record);

        // Clear latest tip gift animation banner after 5 seconds
        setTimeout(() => {
          setLatestTipGift((current) => (current?.id === record.id ? null : current));
        }, 5000);
      }
    };

    const handleWalletUpdated = (data: { wallet: UserWallet }) => {
      if (data?.wallet && user && data.wallet.userId === user.id) {
        setWallet(data.wallet);
      }
    };

    const handleSettingsUpdated = (data: { settings: CreatorSettings }) => {
      const targetId = creatorId || user?.id;
      if (data?.settings && targetId && data.settings.creatorId === targetId) {
        setCreatorSettings(data.settings);
      }
    };

    activeSocket.on(SOCKET_EVENTS.TIP_SENT, handleTipSent);
    activeSocket.on(SOCKET_EVENTS.GIFT_SENT, handleGiftSent);
    activeSocket.on(SOCKET_EVENTS.WALLET_UPDATED, handleWalletUpdated);
    activeSocket.on(SOCKET_EVENTS.CREATOR_SETTINGS_UPDATED, handleSettingsUpdated);

    return () => {
      activeSocket.off(SOCKET_EVENTS.TIP_SENT, handleTipSent);
      activeSocket.off(SOCKET_EVENTS.GIFT_SENT, handleGiftSent);
      activeSocket.off(SOCKET_EVENTS.WALLET_UPDATED, handleWalletUpdated);
      activeSocket.off(SOCKET_EVENTS.CREATOR_SETTINGS_UPDATED, handleSettingsUpdated);
    };
  }, [streamId, creatorId, user, socket]);

  // Actions
  const topUpWallet = async (amount: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await creatorEconomyClient.topUpWallet(amount);
      setWallet(updated);
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to top up wallet';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTip = async (receiverId: string, amount: number, message?: string) => {
    if (!streamId) throw new Error('streamId is required');
    try {
      setIsLoading(true);
      setError(null);

      let record: TipGiftRecord;
      const activeSocket = socketRef.current;

      if (activeSocket && activeSocket.connected) {
        // Emit via socket for instant latency
        activeSocket.emit(SOCKET_EVENTS.TIP_SENT, {
          streamId,
          receiverId,
          amount,
          message,
        });
        // Optimistically update wallet
        if (wallet) {
          setWallet({
            ...wallet,
            balance: Math.max(0, wallet.balance - amount),
            totalTipsSent: wallet.totalTipsSent + amount,
          });
        }
        record = {
          id: `tip_${Date.now()}`,
          streamId,
          senderId: user?.id || '',
          senderName: user?.username || user?.email.split('@')[0] || 'Viewer',
          senderEmail: user?.email || '',
          receiverId,
          amount,
          type: 'tip',
          message,
          createdAt: Date.now(),
        };
      } else {
        record = await creatorEconomyClient.sendTip(streamId, receiverId, amount, message);
        await refreshWallet();
      }

      return record;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send tip';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const sendGift = async (receiverId: string, giftId: string, message?: string) => {
    if (!streamId) throw new Error('streamId is required');
    try {
      setIsLoading(true);
      setError(null);

      let record: TipGiftRecord;
      const activeSocket = socketRef.current;

      if (activeSocket && activeSocket.connected) {
        activeSocket.emit(SOCKET_EVENTS.GIFT_SENT, {
          streamId,
          receiverId,
          giftId,
          message,
        });
        const gift = availableGifts.find((g) => g.id === giftId);
        if (gift && wallet) {
          setWallet({
            ...wallet,
            balance: Math.max(0, wallet.balance - gift.price),
            totalTipsSent: wallet.totalTipsSent + gift.price,
          });
        }
        record = {
          id: `gift_${Date.now()}`,
          streamId,
          senderId: user?.id || '',
          senderName: user?.username || user?.email.split('@')[0] || 'Viewer',
          senderEmail: user?.email || '',
          receiverId,
          amount: availableGifts.find((g) => g.id === giftId)?.price || 0,
          type: 'gift',
          giftName: availableGifts.find((g) => g.id === giftId)?.name,
          giftIcon: availableGifts.find((g) => g.id === giftId)?.icon,
          message,
          createdAt: Date.now(),
        };
      } else {
        record = await creatorEconomyClient.sendGift(streamId, receiverId, giftId, message);
        await refreshWallet();
      }

      return record;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send gift';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<CreatorSettings>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await creatorEconomyClient.updateCreatorSettings(updates);
      setCreatorSettings(updated);
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update settings';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const checkRequirements = async (targetCreatorId?: string) => {
    const cId = targetCreatorId || creatorId;
    if (!streamId || !cId) return null;
    try {
      return await creatorEconomyClient.checkRequirements(streamId, cId);
    } catch (err: any) {
      return null;
    }
  };

  return {
    wallet,
    creatorSettings,
    availableGifts,
    tipGifts,
    latestTipGift,
    isLoading,
    error,
    clearError: () => setError(null),
    topUpWallet,
    sendTip,
    sendGift,
    updateSettings,
    checkRequirements,
    refreshWallet,
    refreshCreatorSettings,
  };
}
