import React, { useState } from 'react';
import {
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Search,
  ShieldCheck,
  Clock,
  Sparkles,
  Coins,
} from 'lucide-react';
import { FinancialLedgerEntry } from '../../../shared/types';

interface FinancialLedgerViewProps {
  entries: FinancialLedgerEntry[];
  isLoading?: boolean;
}

export const FinancialLedgerView: React.FC<FinancialLedgerViewProps> = ({
  entries,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.sourceId && entry.sourceId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || entry.transactionType === typeFilter;

    return matchesSearch && matchesType;
  });

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'coin_purchase':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'gift_received':
      case 'tip_received':
      case 'creator_earnings':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'gift_sent':
      case 'tip_sent':
      case 'private_call_payment':
      case 'withdrawal_request':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'platform_commission':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'withdrawal_approved':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'withdrawal_rejected':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-6 bg-slate-900/60 border border-slate-800 rounded-3xl animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded-lg" />
        <div className="h-40 bg-slate-950 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5" id="financial-ledger-container">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Immutable Financial Ledger
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
              Auditable Log
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Every transaction, commission, and withdrawal is cryptographically logged and immutable.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ledger..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Events</option>
            <option value="creator_earnings">Creator Earnings</option>
            <option value="gift_received">Gifts Received</option>
            <option value="tip_received">Tips Received</option>
            <option value="private_call_payment">Private Call</option>
            <option value="withdrawal_request">Withdrawal Request</option>
            <option value="withdrawal_approved">Withdrawal Approved</option>
            <option value="withdrawal_rejected">Withdrawal Rejected</option>
            <option value="platform_commission">Platform Fee</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-10 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-400">No financial ledger entries found.</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Transactions will automatically stream into this audit trail.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Entry ID & Date</th>
                <th className="py-3 px-3">Event Type</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEntries.map((entry) => {
                const isCredit = entry.direction === 'credit';

                return (
                  <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-mono text-[11px] font-bold text-slate-200">{entry.id}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeStyle(entry.transactionType)}`}>
                        {entry.transactionType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                      {entry.description}
                      {entry.sourceId && (
                        <span className="block text-[10px] font-mono text-slate-500">
                          Ref: {entry.sourceId}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-mono font-bold flex items-center justify-end gap-1 ${
                          isCredit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                        {isCredit ? '+' : '-'}{entry.amount.toLocaleString()} {entry.currency}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {entry.balanceAfter !== undefined ? `${entry.balanceAfter.toLocaleString()} Coins` : '—'}
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
