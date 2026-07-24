import React, { useState } from 'react';
import { Coins, Send, AlertCircle, Loader2 } from 'lucide-react';

interface TipDialogProps {
  creatorName: string;
  onSendTip: (amount: number, message?: string) => Promise<void>;
  isLoading?: boolean;
  onClose?: () => void;
  className?: string;
}

const TIP_PRESETS = [10, 50, 100, 500, 1000];

export const TipDialog: React.FC<TipDialogProps> = ({
  creatorName,
  onSendTip,
  isLoading = false,
  onClose,
  className = '',
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = customAmount ? parseFloat(customAmount) : selectedPreset;
    if (isNaN(amount) || amount <= 0) {
      setError('Tip amount must be a positive number of Coins');
      return;
    }

    try {
      await onSendTip(amount, message);
      setCustomAmount('');
      setMessage('');
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send tip');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-4 shadow-xl ${className}`}
      id="tip-dialog"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Send Tip to {creatorName}</h4>
            <p className="text-[11px] text-slate-400">Choose preset or custom coin amount</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2"
          >
            &times;
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Presets */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-400">Preset Amounts</label>
        <div className="grid grid-cols-5 gap-2">
          {TIP_PRESETS.map((amt) => {
            const isSelected = selectedPreset === amt && !customAmount;
            return (
              <button
                key={amt}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setSelectedPreset(amt);
                  setCustomAmount('');
                }}
                className={`py-2 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
                id={`tip-preset-${amt}`}
              >
                {amt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Amount */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-400">Custom Amount (Coins)</label>
        <input
          type="number"
          min="1"
          placeholder="Enter custom coin amount..."
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-400">Message (Optional)</label>
        <input
          type="text"
          placeholder="Add a friendly note..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        id="send-tip-submit-btn"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        <span>Send Tip ({customAmount ? parseFloat(customAmount) || 0 : selectedPreset} Coins)</span>
      </button>
    </form>
  );
};
