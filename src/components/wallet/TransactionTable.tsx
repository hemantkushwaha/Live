import React from 'react';
import { History, ArrowUpRight, ArrowDownLeft, RefreshCw, CreditCard, Gift, Heart, Phone } from 'lucide-react';
import { WalletTransaction, TransactionType } from '../../../shared/types';

interface TransactionTableProps {
  transactions: WalletTransaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  isLoading = false,
  onRefresh,
  className = '',
}) => {
  const getBadgeStyle = (type: TransactionType) => {
    switch (type) {
      case 'Credit':
      case 'Recharge':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <ArrowDownLeft className="w-3.5 h-3.5" />,
        };
      case 'Debit':
      case 'Tip':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: <ArrowUpRight className="w-3.5 h-3.5" />,
        };
      case 'Gift':
        return {
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          icon: <Gift className="w-3.5 h-3.5" />,
        };
      case 'Private Call':
        return {
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: <Phone className="w-3.5 h-3.5" />,
        };
      case 'Reserved':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <CreditCard className="w-3.5 h-3.5" />,
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <History className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-white ${className}`}
      id="transaction-table-container"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Transaction History</h3>
            <p className="text-xs text-slate-400">All credits, debits, recharges, tips & gifts</p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            title="Refresh history"
            id="refresh-transactions-btn"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
          <p className="text-xs font-medium">Loading transaction log...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-12 text-center space-y-2 text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800/60">
          <History className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No transactions recorded yet</p>
          <p className="text-xs text-slate-500">
            Recharge coins or send tips/gifts to see your activity here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <th className="pb-3 px-2">Type</th>
                <th className="pb-3 px-2">Description</th>
                <th className="pb-3 px-2 text-right">Amount</th>
                <th className="pb-3 px-2 text-right">Before &rarr; After</th>
                <th className="pb-3 px-2 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {transactions.map((tx) => {
                const style = getBadgeStyle(tx.type);
                const isPositive = tx.type === 'Credit' || tx.type === 'Recharge';

                return (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Type Badge */}
                    <td className="py-3.5 px-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${style.bg}`}
                      >
                        {style.icon}
                        <span>{tx.type}</span>
                      </span>
                    </td>

                    {/* Description & Tx ID */}
                    <td className="py-3.5 px-2 max-w-xs">
                      <p className="font-medium text-slate-200 truncate">{tx.description}</p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">{tx.id}</p>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-2 text-right font-mono font-bold text-sm">
                      <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                        {isPositive ? '+' : '-'}{Math.abs(tx.amount)} Coins
                      </span>
                    </td>

                    {/* Balance Before -> After */}
                    <td className="py-3.5 px-2 text-right font-mono text-slate-400 text-[11px]">
                      <span>{tx.balanceBefore}</span>
                      <span className="mx-1 text-slate-600">&rarr;</span>
                      <span className="text-amber-300 font-semibold">{tx.balanceAfter}</span>
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-2 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(tx.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
