import React, { useState } from 'react';
import { EarningsChartPoint } from '../../../shared/types';
import { BarChart2, Gift, DollarSign, PhoneCall, Layers } from 'lucide-react';

interface AnalyticsChartsProps {
  chartData: EarningsChartPoint[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ chartData }) => {
  const [activeMetric, setActiveMetric] = useState<'total' | 'gifts' | 'tips' | 'privateCalls'>('total');
  const [hoveredPoint, setHoveredPoint] = useState<EarningsChartPoint | null>(null);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
        <BarChart2 className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-400">No chart data available for this period</p>
      </div>
    );
  }

  const maxVal = Math.max(
    1,
    ...chartData.map((p) => {
      if (activeMetric === 'gifts') return p.gifts;
      if (activeMetric === 'tips') return p.tips;
      if (activeMetric === 'privateCalls') return p.privateCalls;
      return p.total;
    })
  );

  const getPointValue = (p: EarningsChartPoint) => {
    if (activeMetric === 'gifts') return p.gifts;
    if (activeMetric === 'tips') return p.tips;
    if (activeMetric === 'privateCalls') return p.privateCalls;
    return p.total;
  };

  const metricColors = {
    total: { bar: 'bg-emerald-500 hover:bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500/40' },
    gifts: { bar: 'bg-indigo-500 hover:bg-indigo-400', text: 'text-indigo-400', border: 'border-indigo-500/40' },
    tips: { bar: 'bg-amber-500 hover:bg-amber-400', text: 'text-amber-400', border: 'border-amber-500/40' },
    privateCalls: { bar: 'bg-purple-500 hover:bg-purple-400', text: 'text-purple-400', border: 'border-purple-500/40' },
  };

  const currentColors = metricColors[activeMetric];

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5" id="analytics-charts-container">
      {/* Header & Metric Selectors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            <span>Earnings Trend Analytics</span>
          </h3>
          <p className="text-xs text-slate-400">Revenue trajectory over time broken down by source</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs font-semibold">
          <button
            onClick={() => setActiveMetric('total')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === 'total'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Revenue</span>
          </button>

          <button
            onClick={() => setActiveMetric('gifts')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === 'gifts'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Gifts</span>
          </button>

          <button
            onClick={() => setActiveMetric('tips')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === 'tips'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Tips</span>
          </button>

          <button
            onClick={() => setActiveMetric('privateCalls')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === 'privateCalls'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Calls</span>
          </button>
        </div>
      </div>

      {/* Hover Information Tooltip */}
      {hoveredPoint && (
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs animate-in fade-in duration-150">
          <span className="font-bold text-slate-300">{hoveredPoint.label}</span>
          <div className="flex items-center gap-4 font-mono font-bold">
            <span className="text-indigo-400">Gifts: +{hoveredPoint.gifts}</span>
            <span className="text-amber-400">Tips: +{hoveredPoint.tips}</span>
            <span className="text-purple-400">Calls: +{hoveredPoint.privateCalls}</span>
            <span className="text-emerald-400 text-sm border-l border-slate-800 pl-3">
              Total: +{hoveredPoint.total} Coins
            </span>
          </div>
        </div>
      )}

      {/* Visual Bar Chart */}
      <div className="h-52 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800 relative">
        {chartData.map((pt, idx) => {
          const val = getPointValue(pt);
          const pct = Math.max(4, Math.round((val / maxVal) * 100));

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Tooltip value on top */}
              <span className="text-[10px] font-mono font-bold text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {val}
              </span>

              {/* Bar */}
              <div
                style={{ height: `${pct}%` }}
                className={`w-full rounded-t-lg transition-all duration-300 ${currentColors.bar} shadow-lg`}
              />
            </div>
          );
        })}
      </div>

      {/* X-Axis Labels */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
        {chartData.map((pt, idx) => {
          if (chartData.length > 14 && idx % 3 !== 0 && idx !== chartData.length - 1) return null;
          return <span key={idx}>{pt.label}</span>;
        })}
      </div>
    </div>
  );
};
