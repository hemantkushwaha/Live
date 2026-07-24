import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { Gift, Coins, Wallet, PlusCircle, CheckCircle, AlertCircle, Heart, Star, Gem, Crown, Rocket } from 'lucide-react';
import { useCreatorEconomy } from '../../hooks/useCreatorEconomy';
import { GiftItem } from '../../../shared/types';

interface TipGiftPanelProps {
  streamId: string;
  creatorId: string;
  creatorName: string;
  socket?: Socket | null;
  onClose?: () => void;
  className?: string;
}

export const TipGiftPanel: React.FC<TipGiftPanelProps> = ({
  streamId,
  creatorId,
  creatorName,
  socket,
  onClose,
  className = '',
}) => {
  const { wallet, availableGifts, isLoading, error, clearError, topUpWallet, sendTip, sendGift } =
    useCreatorEconomy({ streamId, creatorId, socket });

  const [activeTab, setActiveTab] = useState<'gifts' | 'tips' | 'wallet'>('gifts');
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(50);
  const [customTip, setCustomTip] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<number>(500);

  const handleSendGift = async () => {
    if (!selectedGift) return;
    try {
      clearError();
      setSuccessMsg(null);
      await sendGift(creatorId, selectedGift.id, message);
      setSuccessMsg(`Sent ${selectedGift.name} (${selectedGift.icon}) for ${selectedGift.price} Coins!`);
      setMessage('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      // Error handled in hook
    }
  };

  const handleSendTip = async () => {
    const amount = customTip ? parseInt(customTip, 10) : tipAmount;
    if (isNaN(amount) || amount <= 0) return;
    try {
      clearError();
      setSuccessMsg(null);
      await sendTip(creatorId, amount, message);
      setSuccessMsg(`Sent ${amount} Coins tip to ${creatorName}!`);
      setMessage('');
      setCustomTip('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      // Error handled in hook
    }
  };

  const handleTopUp = async () => {
    if (topUpAmount <= 0) return;
    try {
      clearError();
      setSuccessMsg(null);
      await topUpWallet(topUpAmount);
      setSuccessMsg(`Added ${topUpAmount} Coins to wallet!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      // Error handled in hook
    }
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-white space-y-4 ${className}`}
      id="tip-gift-panel"
    >
      {/* Header & Wallet Balance */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Gift className="w-4 h-4 text-rose-400" />
            <span>Support {creatorName}</span>
          </h3>
          <p className="text-xs text-slate-400">Send tips or animated gifts to the stream</p>
        </div>

        <div
          onClick={() => setActiveTab('wallet')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-300">
            {(wallet?.balance ?? 1000).toLocaleString()} Coins
          </span>
          <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
        <button
          onClick={() => {
            setActiveTab('gifts');
            clearError();
            setSuccessMsg(null);
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'gifts'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Gifts
        </button>
        <button
          onClick={() => {
            setActiveTab('tips');
            clearError();
            setSuccessMsg(null);
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'tips'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Tips
        </button>
        <button
          onClick={() => {
            setActiveTab('wallet');
            clearError();
            setSuccessMsg(null);
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'wallet'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Top Up
        </button>
      </div>

      {/* Success / Error Messages */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-rose-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Gifts Tab */}
      {activeTab === 'gifts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {availableGifts.map((gift) => {
              const isSelected = selectedGift?.id === gift.id;
              return (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGift(gift)}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-500 text-white scale-105 shadow-lg shadow-rose-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{gift.icon}</span>
                  <span className="text-[10px] font-bold truncate max-w-full">{gift.name}</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">{gift.price} Coins</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Add a message for streamer... (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />

          <button
            onClick={handleSendGift}
            disabled={!selectedGift || isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 font-bold text-xs text-white shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Gift className="w-4 h-4" />
            <span>
              {selectedGift
                ? `Send ${selectedGift.name} (${selectedGift.price} Coins)`
                : 'Select a Gift'}
            </span>
          </button>
        </div>
      )}

      {/* Tips Tab */}
      {activeTab === 'tips' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {[10, 50, 100, 500].map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setTipAmount(amt);
                  setCustomTip('');
                }}
                className={`py-2 rounded-xl border text-xs font-bold font-mono transition-all ${
                  tipAmount === amt && !customTip
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {amt} Coins
              </button>
            ))}
          </div>

          <input
            type="number"
            placeholder="Custom Tip Amount (Coins)..."
            value={customTip}
            onChange={(e) => setCustomTip(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />

          <input
            type="text"
            placeholder="Add a message for streamer... (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />

          <button
            onClick={handleSendTip}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 font-bold text-xs text-white shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Coins className="w-4 h-4" />
            <span>
              Send {customTip ? parseInt(customTip, 10) || 0 : tipAmount} Coins Tip
            </span>
          </button>
        </div>
      )}

      {/* Wallet / Top Up Tab */}
      {activeTab === 'wallet' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Current Balance</span>
            <span className="text-lg font-mono font-bold text-amber-300">
              {(wallet?.balance ?? 1000).toLocaleString()} Coins
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400">Select Top Up Amount</label>
            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-2 rounded-xl border text-xs font-bold font-mono transition-all ${
                    topUpAmount === amt
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleTopUp}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Top Up +{topUpAmount} Coins</span>
          </button>
        </div>
      )}
    </div>
  );
};
