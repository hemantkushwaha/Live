import React, { useState, useEffect } from 'react';
import {
  Coins,
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Receipt,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { apiClient } from '../../config/api';
import { ApiResponse, CoinPackage, PaymentReceipt, UserWallet } from '../../../shared/types';
import { CoinPackageCards } from './CoinPackageCards';

interface BuyCoinsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (receipt: PaymentReceipt, updatedWallet: UserWallet) => void;
  initialPackageId?: string;
}

type CheckoutStep = 'select' | 'pending' | 'success' | 'failed' | 'cancelled';

export const BuyCoinsDialog: React.FC<BuyCoinsDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPackageId,
}) => {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('razorpay');
  const [step, setStep] = useState<CheckoutStep>('select');
  const [isLoadingPackages, setIsLoadingPackages] = useState<boolean>(true);
  const [isProcessingOrder, setIsProcessingOrder] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [updatedWallet, setUpdatedWallet] = useState<UserWallet | null>(null);

  // Fetch available packages from API
  const fetchPackages = async () => {
    setIsLoadingPackages(true);
    try {
      const res = await apiClient.get<ApiResponse<CoinPackage[]>>('/coin-packages');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setPackages(res.data.data);
        if (initialPackageId) {
          const match = res.data.data.find((p) => p.id === initialPackageId);
          if (match) setSelectedPackage(match);
        } else if (res.data.data.length > 0) {
          // Default to popular or 1000 coin package
          const popular = res.data.data.find((p) => p.id === 'pkg_1000') || res.data.data[0];
          setSelectedPackage(popular);
        }
      }
    } catch (err: any) {
      console.error('Failed to load coin packages:', err);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
      setStep('select');
      setErrorMessage(null);
      setReceipt(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Execute Order Creation and Checkout Verification Flow
  const handleProceedToPayment = async () => {
    if (!selectedPackage) return;

    setIsProcessingOrder(true);
    setErrorMessage(null);
    setStep('pending');

    try {
      // 1. Create order on backend
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderRes = await apiClient.post<ApiResponse<any>>('/payments/order', {
        packageId: selectedPackage.id,
        provider: selectedProvider,
        idempotencyKey,
      });

      if (!orderRes.data || !orderRes.data.success || !orderRes.data.data) {
        throw new Error(orderRes.data?.message || 'Failed to initialize payment order');
      }

      const { order, gatewayOrder, keyId } = orderRes.data.data;

      // 2. Razorpay / Gateway Integration or Simulated Test Checkout
      if (selectedProvider === 'razorpay' && typeof (window as any).Razorpay !== 'undefined') {
        // Real Razorpay Checkout Modal
        const options = {
          key: keyId || 'rzp_test_liveconnect_key',
          amount: gatewayOrder.amount,
          currency: gatewayOrder.currency,
          name: 'LiveConnect Coins',
          description: `Purchase ${selectedPackage.coins} Virtual Coins`,
          order_id: gatewayOrder.id,
          handler: async (response: any) => {
            await verifyAndCompletePayment({
              orderId: order.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              setStep('cancelled');
              setIsProcessingOrder(false);
            },
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Simulated / Test Mode Checkout (Immediate Secure Signature Verification)
        setTimeout(async () => {
          try {
            const simulatedPaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await verifyAndCompletePayment({
              orderId: order.id,
              gatewayOrderId: gatewayOrder.id,
              gatewayPaymentId: simulatedPaymentId,
              gatewaySignature: 'simulated_valid_signature',
            });
          } catch (err: any) {
            setErrorMessage(err.message || 'Payment verification failed');
            setStep('failed');
            setIsProcessingOrder(false);
          }
        }, 1200);
      }
    } catch (err: any) {
      console.error('Payment checkout error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'An error occurred initializing payment.'
      );
      setStep('failed');
      setIsProcessingOrder(false);
    }
  };

  // 3. Backend Payment Verification Endpoint Call
  const verifyAndCompletePayment = async (verificationPayload: any) => {
    try {
      const verifyRes = await apiClient.post<ApiResponse<any>>('/payments/verify', verificationPayload);

      if (verifyRes.data && verifyRes.data.success && verifyRes.data.data) {
        const { receipt: newReceipt, wallet: newWallet } = verifyRes.data.data;
        setReceipt(newReceipt);
        setUpdatedWallet(newWallet);
        setStep('success');

        if (onSuccess) {
          onSuccess(newReceipt, newWallet);
        }
      } else {
        throw new Error(verifyRes.data?.message || 'Payment signature verification failed');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Payment verification failed on backend'
      );
      setStep('failed');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" id="buy-coins-modal">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-md">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Buy Virtual Coins
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  Secure Checkout
                </span>
              </h2>
              <p className="text-xs text-slate-400">Refill your wallet to send gifts, tips, and start private calls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            id="buy-coins-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: SELECT COIN PACKAGE */}
          {step === 'select' && (
            <>
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  1. Choose Coin Package
                </label>
                <CoinPackageCards
                  packages={packages}
                  selectedPackageId={selectedPackage?.id || null}
                  onSelectPackage={(pkg) => setSelectedPackage(pkg)}
                  isLoading={isLoadingPackages}
                />
              </div>

              {/* Provider Selection */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  2. Select Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('razorpay')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      selectedProvider === 'razorpay'
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Razorpay</div>
                      <div className="text-[10px] text-slate-400">Cards, UPI, Netbanking</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProvider('stripe')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      selectedProvider === 'stripe'
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Stripe</div>
                      <div className="text-[10px] text-slate-400">Global Credit Cards</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProvider('paypal')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      selectedProvider === 'paypal'
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">PayPal</div>
                      <div className="text-[10px] text-slate-400">International Express</div>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: PENDING / PROCESSING */}
          {step === 'pending' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Connecting to Gateway...</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Please complete the checkout window to verify payment signature securely.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS & DIGITAL RECEIPT */}
          {step === 'success' && receipt && (
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="text-center py-4 space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-white">Payment Successful!</h3>
                <p className="text-xs text-slate-400">
                  +{receipt.coinsPurchased.toLocaleString()} Coins credited to your virtual wallet
                </p>
              </div>

              {/* Receipt Details Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400">
                  <span className="flex items-center gap-1.5 font-sans font-bold text-slate-300">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    Transaction Receipt
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {receipt.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2 pt-1 text-slate-300">
                  <span className="text-slate-500">Payment ID:</span>
                  <span className="text-right truncate font-semibold text-white">{receipt.paymentId}</span>

                  <span className="text-slate-500">Gateway Order:</span>
                  <span className="text-right truncate text-slate-400">{receipt.gatewayOrderId}</span>

                  <span className="text-slate-500">Gateway Tx ID:</span>
                  <span className="text-right truncate text-slate-400">{receipt.gatewayTransactionId}</span>

                  <span className="text-slate-500">Coins Purchased:</span>
                  <span className="text-right font-bold text-amber-400">+{receipt.coinsPurchased} Coins</span>

                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="text-right font-bold text-white">₹{receipt.amount}</span>

                  <span className="text-slate-500">Date & Time:</span>
                  <span className="text-right text-slate-400">{new Date(receipt.timestamp).toLocaleString()}</span>

                  {updatedWallet && (
                    <>
                      <span className="text-slate-500 border-t border-slate-800 pt-2 font-sans font-bold text-slate-300">New Wallet Balance:</span>
                      <span className="text-right border-t border-slate-800 pt-2 font-bold text-amber-400 text-sm">
                        {updatedWallet.balance.toLocaleString()} Coins
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: FAILED */}
          {step === 'failed' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Payment Verification Failed</h3>
                <p className="text-xs text-rose-400 max-w-md mx-auto mt-1">
                  {errorMessage || 'The payment signature could not be verified by the backend gateway.'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: CANCELLED */}
          {step === 'cancelled' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                <X className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Payment Cancelled</h3>
                <p className="text-xs text-slate-400 mt-1">You cancelled the payment before completion.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>256-bit SSL Encrypted Payment</span>
          </div>

          <div className="flex items-center gap-3">
            {step === 'select' && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedPackage || isProcessingOrder}
                  onClick={handleProceedToPayment}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                  id="checkout-proceed-btn"
                >
                  <span>
                    Pay {selectedPackage?.currency === 'INR' ? '₹' : '$'}
                    {selectedPackage?.price}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {(step === 'failed' || step === 'cancelled') && (
              <button
                type="button"
                onClick={() => {
                  setStep('select');
                  setErrorMessage(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}

            {step === 'success' && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                id="buy-coins-done-btn"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
