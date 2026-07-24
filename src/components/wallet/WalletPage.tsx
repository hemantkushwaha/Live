import React, { useEffect, useState } from 'react';
import { Coins, ArrowLeft, RefreshCw, Wallet as WalletIcon } from 'lucide-react';
import { apiClient } from '../../config/api';
import { ApiResponse, UserWallet, WalletTransaction } from '../../../shared/types';
import { BalanceCard } from './BalanceCard';
import { WalletCard } from './WalletCard';
import { RechargePanel } from './RechargePanel';
import { TransactionTable } from './TransactionTable';

interface WalletPageProps {
  onBack?: () => void;
  className?: string;
}

export const WalletPage: React.FC<WalletPageProps> = ({ onBack, className = '' }) => {
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const [walletRes, historyRes] = await Promise.all([
        apiClient.get<ApiResponse<UserWallet>>('/wallet'),
        apiClient.get<ApiResponse<WalletTransaction[]>>('/wallet/history'),
      ]);

      if (walletRes.data && walletRes.data.success && walletRes.data.data) {
        setWallet(walletRes.data.data);
      }
      if (historyRes.data && historyRes.data.success && Array.isArray(historyRes.data.data)) {
        setTransactions(historyRes.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load wallet data:', err);
      setError(err.response?.data?.message || err.message || 'Error fetching wallet data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleRecharged = (updatedWallet: UserWallet, newTx: WalletTransaction) => {
    setWallet(updatedWallet);
    setTransactions((prev) => [newTx, ...prev]);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans ${className}`} id="wallet-page-container">
      {/* Top Bar Navigation */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer mr-1"
                title="Back to Lobby"
                id="wallet-back-btn"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-md">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg tracking-tight">Virtual Wallet</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                  Demo Coins
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">EWO-012 Virtual Wallet & Coin System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchWalletData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-50"
              id="wallet-refresh-btn"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Balance</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Overview Row: Balance Card & Wallet Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <BalanceCard wallet={wallet} isLoading={isLoading} />
          <WalletCard wallet={wallet} />
        </div>

        {/* Demo Recharge Options Panel */}
        <RechargePanel onRecharged={handleRecharged} />

        {/* Full Transaction History Table */}
        <TransactionTable
          transactions={transactions}
          isLoading={isLoading}
          onRefresh={fetchWalletData}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        LiveConnect Virtual Wallet &bull; EWO-012 Demo Coin Engine
      </footer>
    </div>
  );
};
