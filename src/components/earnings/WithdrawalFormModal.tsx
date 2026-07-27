import React, { useState } from 'react';
import {
  X,
  Coins,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Building2,
  Smartphone,
  CreditCard,
  Lock,
  DollarSign,
} from 'lucide-react';
import { WithdrawalRequest } from '../../../shared/types';

interface WithdrawalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawableBalance: number;
  minWithdrawalAmount: number;
  coinToFiatRate: number;
  hasActivePendingRequest: boolean;
  onSuccess: (request: WithdrawalRequest) => void;
}

export const WithdrawalFormModal: React.FC<WithdrawalFormModalProps> = ({
  isOpen,
  onClose,
  withdrawableBalance,
  minWithdrawalAmount,
  coinToFiatRate,
  hasActivePendingRequest,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>(minWithdrawalAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'upi' | 'paypal'>('bank_transfer');

  // Bank transfer state
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // UPI state
  const [upiId, setUpiId] = useState('');

  // PayPal state
  const [paypalEmail, setPaypalEmail] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;
  const calculatedFiatPayout = Math.round(numAmount * coinToFiatRate * 100) / 100;

  const handleQuickSelectPercentage = (percent: number) => {
    const calculated = Math.floor((withdrawableBalance * percent) / 100);
    setAmount(Math.max(minWithdrawalAmount, calculated).toString());
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validation
    if (hasActivePendingRequest) {
      setError('You already have a pending withdrawal request in progress.');
      return;
    }

    if (numAmount < minWithdrawalAmount) {
      setError(`Minimum withdrawal is ${minWithdrawalAmount} Coins.`);
      return;
    }

    if (numAmount > withdrawableBalance) {
      setError(`Requested amount exceeds available withdrawable balance (${withdrawableBalance} Coins).`);
      return;
    }

    const payoutDetails: any = {};
    if (paymentMethod === 'bank_transfer') {
      if (!bankAccount.trim() || !ifsc.trim() || !accountHolder.trim()) {
        setError('Please fill out all bank account details.');
        return;
      }
      payoutDetails.bankAccount = bankAccount.trim();
      payoutDetails.ifsc = ifsc.trim().toUpperCase();
      payoutDetails.accountHolder = accountHolder.trim();
    } else if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g. name@upi or name@okaxis).');
        return;
      }
      payoutDetails.upiId = upiId.trim();
    } else if (paymentMethod === 'paypal') {
      if (!paypalEmail.trim() || !paypalEmail.includes('@')) {
        setError('Please enter a valid PayPal email address.');
        return;
      }
      payoutDetails.paypalEmail = paypalEmail.trim();
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numAmount,
          paymentMethod,
          payoutDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit withdrawal request');
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" id="withdrawal-modal-overlay">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Request Creator Payout</h2>
              <p className="text-xs text-slate-400">Convert your earned coins into fiat currency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning if pending exists */}
        {hasActivePendingRequest && (
          <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Active Request Pending</span>
              You have a withdrawal request currently being processed by administrators. Please wait for settlement before submitting a new one.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-300">Withdrawal Amount (Coins)</label>
              <span className="text-slate-400">
                Withdrawable: <strong className="text-amber-400">{withdrawableBalance.toLocaleString()} Coins</strong>
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min={minWithdrawalAmount}
                max={withdrawableBalance}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                disabled={hasActivePendingRequest || withdrawableBalance < minWithdrawalAmount}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-lg font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-xl text-xs font-bold border border-amber-500/20">
                <Coins className="w-3.5 h-3.5" /> Coins
              </div>
            </div>

            {/* Quick Percentage Presets */}
            <div className="flex items-center gap-2 pt-1">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  type="button"
                  key={pct}
                  onClick={() => handleQuickSelectPercentage(pct)}
                  disabled={hasActivePendingRequest || withdrawableBalance < minWithdrawalAmount}
                  className="flex-1 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-[11px] font-bold text-slate-300 transition-colors disabled:opacity-40"
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Live Fiat Conversion Summary */}
            <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Estimated Fiat Payout (Rate: 1 Coin = ₹{coinToFiatRate})
              </span>
              <span className="font-mono font-extrabold text-emerald-400 text-sm">
                ₹{calculatedFiatPayout.toLocaleString()} INR
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">Payout Destination</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-xs font-bold ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4 mb-1" />
                Bank Transfer
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-xs font-bold ${
                  paymentMethod === 'upi'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4 mb-1" />
                UPI ID
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-xs font-bold ${
                  paymentMethod === 'paypal'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-1" />
                PayPal
              </button>
            </div>
          </div>

          {/* Method Specific Fields */}
          {paymentMethod === 'bank_transfer' && (
            <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 91823749812"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono uppercase text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs">
              <label className="text-slate-400 block mb-1">VPA / UPI ID</label>
              <input
                type="text"
                placeholder="e.g. creatorname@upi or name@okicici"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {paymentMethod === 'paypal' && (
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs">
              <label className="text-slate-400 block mb-1">PayPal Email Address</label>
              <input
                type="email"
                placeholder="creator@example.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              hasActivePendingRequest ||
              numAmount < minWithdrawalAmount ||
              numAmount > withdrawableBalance
            }
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <span>Submitting Request...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Confirm Withdrawal Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
