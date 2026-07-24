import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { Gift, Coins, CheckCircle, AlertCircle, Heart, Send, Sparkles } from 'lucide-react';
import { GiftGrid } from './GiftGrid';
import { TipDialog } from './TipDialog';
import { WalletBalanceWidget } from './WalletBalanceWidget';
import { GiftItem, UserWallet } from '../../../shared/types';
import { useCreatorEconomy } from '../../hooks/useCreatorEconomy';

interface GiftPanelProps {
  streamId: string;
  creatorId: string;
  creatorName: string;
  socket?: Socket | null;
  onOpenWallet?: () => void;
  className?: string;
}

export const GiftPanel: React.FC<GiftPanelProps> = ({
  streamId,
  creatorId,
  creatorName,
  socket,
  onOpenWallet,
  className = '',
}) => {
  const { wallet, availableGifts, isLoading, error, clearError, sendGift, sendTip } =
    useCreatorEconomy({ streamId, creatorId, socket });

  const [activeTab, setActiveTab] = useState<'gifts' | 'tips'>('gifts');
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(availableGifts[0] || null);
  const [giftMessage, setGiftMessage] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSendGift = async () => {
    if (!selectedGift) return;
    try {
      clearError();
      setSuccessMsg(null);
      await sendGift(creatorId, selectedGift.id, giftMessage);
      setSuccessMsg(`Sent ${selectedGift.name} (${selectedGift.icon}) for ${selectedGift.price} Coins!`);
      setGiftMessage('');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      // Error handled by hook
    }
  };

  const handleSendTip = async (amount: number, message?: string) => {
    clearError();
    setSuccessMsg(null);
    await sendTip(creatorId, amount, message);
    setSuccessMsg(`Sent ${amount} Coins tip to ${creatorName}!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-white space-y-4 ${className}`}
      id="gift-panel"
    >
      {/* Wallet Widget Header */}
      <WalletBalanceWidget wallet={wallet} onOpenWallet={onOpenWallet} />

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab('gifts');
            clearError();
            setSuccessMsg(null);
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'gifts'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
          id="tab-gifts"
        >
          Virtual Gifts
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('tips');
            clearError();
            setSuccessMsg(null);
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tips'
              ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
          id="tab-tips"
        >
          Custom Tip
        </button>
      </div>

      {/* Status Banners */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={clearError} className="text-rose-400 hover:text-white font-bold">
            &times;
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Content */}
      {activeTab === 'gifts' ? (
        <div className="space-y-4">
          <GiftGrid
            gifts={availableGifts}
            selectedGift={selectedGift}
            onSelectGift={(g) => setSelectedGift(g)}
            disabled={isLoading}
          />

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Add a gift message for creator (optional)..."
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />

            <button
              type="button"
              onClick={handleSendGift}
              disabled={!selectedGift || isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 font-bold text-xs text-white shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              id="send-gift-btn"
            >
              <Gift className="w-4 h-4" />
              <span>
                {selectedGift
                  ? `Send ${selectedGift.name} (${selectedGift.price} Coins)`
                  : 'Select a Gift'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <TipDialog
          creatorName={creatorName}
          onSendTip={handleSendTip}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
