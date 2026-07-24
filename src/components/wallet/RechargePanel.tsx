import React, { useState } from 'react';
import { PlusCircle, Loader2, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../../config/api';
import { ApiResponse, UserWallet, WalletTransaction } from '../../../shared/types';

interface RechargePanelProps {
  onRecharged?: (updatedWallet: UserWallet, transaction: WalletTransaction) => void;
  className?: string;
}

const RECHARGE_OPTIONS = [100, 500, 1000, 5000];

export const RechargePanel: React.FC<RechargePanelProps> = ({
  onRecharged,
  className = '',
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRecharge = async (amount: number) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await apiClient.post<ApiResponse<{ wallet: UserWallet; transaction: WalletTransaction }>>(
        '/wallet/demo-recharge',
        { amount }
      );

      if (res.data && res.data.success && res.data.data) {
        const { wallet, transaction } = res.data.data;
        setSuccessMessage(`Successfully recharged +${amount} Coins!`);
        if (onRecharged) {
          onRecharged(wallet, transaction);
        }
      } else {
        setErrorMessage(res.data?.message || 'Failed to recharge coins');
      }
    } catch (err: any) {
      console.error('Recharge error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'An error occurred during demo recharge.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-white ${className}`}
      id="recharge-panel"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Instant Demo Recharge</h3>
            <p className="text-xs text-slate-400">Add free virtual coins to test gifting & tips</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
          Free Demo
        </span>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Recharge Option Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {RECHARGE_OPTIONS.map((amount) => {
          const isSelected = selectedAmount === amount;
          return (
            <button
              key={amount}
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setSelectedAmount(amount);
                handleRecharge(amount);
              }}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800'
              }`}
              id={`recharge-btn-${amount}`}
            >
              <div className="flex items-center gap-1 font-mono font-extrabold text-lg text-amber-400 group-hover:scale-105 transition-transform">
                <span>+{amount}</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Coins</span>
            </button>
          );
        })}
      </div>

      <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-400">
          <PlusCircle className="w-4 h-4 text-amber-400" />
          Click any option above to add coins instantly
        </span>
        {isSubmitting && (
          <span className="flex items-center gap-2 text-amber-400 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Processing...
          </span>
        )}
      </div>
    </div>
  );
};
