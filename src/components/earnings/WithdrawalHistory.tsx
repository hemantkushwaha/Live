import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Building2, Smartphone, CreditCard, DollarSign } from 'lucide-react';
import { WithdrawalRequest, WithdrawalStatus } from '../../../shared/types';

interface WithdrawalHistoryProps {
  history: WithdrawalRequest[];
}

export const WithdrawalHistory: React.FC<WithdrawalHistoryProps> = ({ history }) => {
  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Approved / Settled
          </span>
        );
      case 'pending':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <Building2 className="w-3.5 h-3.5 text-slate-400" />;
      case 'upi':
        return <Smartphone className="w-3.5 h-3.5 text-slate-400" />;
      case 'paypal':
        return <CreditCard className="w-3.5 h-3.5 text-slate-400" />;
      default:
        return <DollarSign className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  if (history.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
        <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-300">No Withdrawal Requests Yet</h4>
        <p className="text-xs text-slate-500 mt-1">
          When you request payouts, your request history and settlement receipts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4" id="withdrawal-history-container">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          Withdrawal Request History
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          Total Requests: {history.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Request ID & Date</th>
              <th className="py-3 px-3">Coins Locked</th>
              <th className="py-3 px-3">Fiat Payout</th>
              <th className="py-3 px-3">Payout Method</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Admin Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {history.map((req) => (
              <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-mono font-bold text-slate-200">{req.id}</div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(req.createdAt).toLocaleString()}
                  </div>
                </td>

                <td className="py-3 px-3 font-mono font-bold text-amber-400">
                  {req.amount.toLocaleString()} Coins
                </td>

                <td className="py-3 px-3 font-mono font-extrabold text-emerald-400">
                  ₹{req.payoutAmount.toLocaleString()} INR
                </td>

                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold capitalize">
                    {getMethodIcon(req.paymentMethod)}
                    {req.paymentMethod.replace('_', ' ')}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">
                    {req.payoutDetails.bankAccount || req.payoutDetails.upiId || req.payoutDetails.paypalEmail || '—'}
                  </div>
                </td>

                <td className="py-3 px-3">{getStatusBadge(req.status)}</td>

                <td className="py-3 px-3 text-right text-slate-400 max-w-xs truncate italic text-[11px]">
                  {req.adminRemarks || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
