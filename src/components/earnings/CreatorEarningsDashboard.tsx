import React, { useState, useEffect } from 'react';
import {
  Coins,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Lock,
  Percent,
  Download,
  ShieldCheck,
  RefreshCw,
  Gift,
  PhoneCall,
  DollarSign,
  Building2,
  FileText,
} from 'lucide-react';
import { CreatorFinancialSummary, WithdrawalRequest } from '../../../shared/types';
import { FinancialLedgerView } from './FinancialLedgerView';
import { WithdrawalHistory } from './WithdrawalHistory';
import { WithdrawalFormModal } from './WithdrawalFormModal';
import { AdminWithdrawalPanel } from './AdminWithdrawalPanel';

interface CreatorEarningsDashboardProps {
  creatorId?: string;
}

export const CreatorEarningsDashboard: React.FC<CreatorEarningsDashboardProps> = ({
  creatorId = 'usr_creator_1',
}) => {
  const [summary, setSummary] = useState<CreatorFinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ledger' | 'withdrawals' | 'admin'>('ledger');
  const [notification, setNotification] = useState<string | null>(null);

  const fetchEarningsData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/earnings?creatorId=${creatorId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch creator financial summary', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, [creatorId]);

  const handleWithdrawalSuccess = (newRequest: WithdrawalRequest) => {
    setNotification(`Withdrawal request of ${newRequest.amount} Coins (₹${newRequest.payoutAmount}) submitted successfully!`);
    fetchEarningsData();
  };

  if (isLoading || !summary) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-3xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-3xl" />
      </div>
    );
  }

  const { earnings, revenueShareRules, recentLedgerEntries, withdrawalHistory, minWithdrawalAmount, coinToFiatRate } = summary;

  const hasPendingRequest = withdrawalHistory.some((r) => r.status === 'pending' || r.status === 'processing');

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8" id="creator-earnings-dashboard shadow-2xl">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Creator Earnings & Financial Ledger</h1>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Auditable Ledger v1.4.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track earnings, view immutable transaction history, and submit withdrawal requests.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchEarningsData}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-2xl transition-colors cursor-pointer"
            title="Refresh Financial Summary"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={earnings.withdrawableBalance < minWithdrawalAmount || hasPendingRequest}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            Request Payout Withdrawal
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold animate-fade-in">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Separated Balances Grid (Strict Separation as per EWO-025) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earned */}
        <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Total Creator Earnings</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-white">
            {earnings.totalEarned.toLocaleString()} <span className="text-xs text-amber-400 font-sans">Coins</span>
          </div>
          <p className="text-[11px] text-slate-500">Gross coins earned from Gifts, Tips & Calls</p>
        </div>

        {/* Withdrawable Balance */}
        <div className="relative overflow-hidden bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 shadow-xl space-y-2 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between text-xs font-bold text-amber-300">
            <span>Withdrawable Balance</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-amber-400">
            {earnings.withdrawableBalance.toLocaleString()} <span className="text-xs font-sans">Coins</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            ≈ ₹{(earnings.withdrawableBalance * coinToFiatRate).toFixed(2)} INR
          </p>
        </div>

        {/* Pending Withdrawal */}
        <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Pending Withdrawal</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-slate-200">
            {earnings.pendingWithdrawal.toLocaleString()} <span className="text-xs text-amber-400 font-sans">Coins</span>
          </div>
          <p className="text-[11px] text-slate-500">Locked coins in pending review</p>
        </div>

        {/* Total Paid Out */}
        <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Total Withdrawn</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-blue-400">
            {earnings.totalWithdrawn.toLocaleString()} <span className="text-xs text-amber-400 font-sans">Coins</span>
          </div>
          <p className="text-[11px] text-slate-500">Settled payouts completed</p>
        </div>
      </div>

      {/* Revenue Share Percentage Rules Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Percent className="w-4 h-4 text-amber-400" /> Revenue Share Breakdown & Configured Platform Rates
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-200 block">Virtual Gifts</span>
                <span className="text-[10px] text-slate-500">In-stream animations</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-emerald-400 text-sm">80% Creator</span>
              <span className="block text-[10px] text-slate-500 font-mono">20% Platform Fee</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-200 block">Private Calls</span>
                <span className="text-[10px] text-slate-500">1-on-1 audio/video</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-emerald-400 text-sm">85% Creator</span>
              <span className="block text-[10px] text-slate-500 font-mono">15% Platform Fee</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-200 block">Direct Tips</span>
                <span className="text-[10px] text-slate-500">Custom user tips</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-emerald-400 text-sm">90% Creator</span>
              <span className="block text-[10px] text-slate-500 font-mono">10% Platform Fee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Immutable Financial Ledger
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Withdrawal History
            {withdrawalHistory.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-amber-400">
                {withdrawalHistory.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Panel
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'ledger' && <FinancialLedgerView entries={recentLedgerEntries} />}
        {activeTab === 'withdrawals' && <WithdrawalHistory history={withdrawalHistory} />}
        {activeTab === 'admin' && <AdminWithdrawalPanel />}
      </div>

      {/* Withdrawal Form Modal */}
      <WithdrawalFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        withdrawableBalance={earnings.withdrawableBalance}
        minWithdrawalAmount={minWithdrawalAmount}
        coinToFiatRate={coinToFiatRate}
        hasActivePendingRequest={hasPendingRequest}
        onSuccess={handleWithdrawalSuccess}
      />
    </div>
  );
};
