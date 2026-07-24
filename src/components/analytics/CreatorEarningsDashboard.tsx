import React from 'react';
import { useCreatorDashboard } from '../../hooks/useCreatorDashboard';
import { RevenueCards } from './RevenueCards';
import { AnalyticsSummaryCards } from './AnalyticsSummaryCards';
import { AnalyticsCharts } from './AnalyticsCharts';
import { SupporterTable } from './SupporterTable';
import { AnalyticsTimeframe } from '../../../shared/types';
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  Layers,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface CreatorEarningsDashboardProps {
  onBack?: () => void;
}

export const CreatorEarningsDashboard: React.FC<CreatorEarningsDashboardProps> = ({ onBack }) => {
  const { dashboardData, analyticsData, timeframe, setTimeframe, isLoading, error, refetch } =
    useCreatorDashboard();

  const handleTimeframeChange = (tf: AnalyticsTimeframe) => {
    setTimeframe(tf);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="creator-earnings-dashboard">
      {/* Top Header & Filter Control Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">Creator Revenue Dashboard</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                Analytics Only
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Complete financial summary & supporter insights from gifts, tips, and 1-on-1 calls
            </p>
          </div>
        </div>

        {/* Right Time Period Filter & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => handleTimeframeChange('today')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeframe === 'today'
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              id="filter-today-btn"
            >
              Today
            </button>
            <button
              onClick={() => handleTimeframeChange('7d')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeframe === '7d'
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              id="filter-7d-btn"
            >
              7 Days
            </button>
            <button
              onClick={() => handleTimeframeChange('30d')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeframe === '30d'
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              id="filter-30d-btn"
            >
              30 Days
            </button>
            <button
              onClick={() => handleTimeframeChange('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              id="filter-all-btn"
            >
              All Time
            </button>
          </div>

          <button
            onClick={refetch}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Refresh Data"
            id="refresh-analytics-btn"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Back to Stream
            </button>
          )}
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoading && !dashboardData && (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Loading revenue analytics...</p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {dashboardData && (
        <>
          {/* 1. Revenue Cards Row */}
          <RevenueCards revenue={dashboardData.revenue} />

          {/* 2. Key Analytics Summary Metrics */}
          <AnalyticsSummaryCards summary={dashboardData.summary} />

          {/* 3. Analytics Charts */}
          {analyticsData && <AnalyticsCharts chartData={analyticsData.chartData} />}

          {/* 4. Top Supporters Table & Recent Transactions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Top Supporters Table */}
            <div className="lg:col-span-7">
              <SupporterTable supporters={dashboardData.topSupporters} />
            </div>

            {/* Recent Earnings Transactions Summary */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Recent Revenue Log</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Last 15 records</span>
              </div>

              {dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {dashboardData.recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white capitalize">{tx.type}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(tx.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {tx.description}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          +{tx.amount} Coins
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono">Bal: {tx.balanceAfter}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No recent revenue transactions recorded
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
