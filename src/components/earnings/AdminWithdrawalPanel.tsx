import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Download,
  AlertCircle,
  Percent,
  Search,
  Coins,
  RefreshCw,
} from 'lucide-react';
import { WithdrawalRequest, RevenueShareRule } from '../../../shared/types';

export const AdminWithdrawalPanel: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [revenueRules, setRevenueRules] = useState<RevenueShareRule[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Revenue rule editing
  const [editingRule, setEditingRule] = useState<RevenueShareRule | null>(null);
  const [creatorPct, setCreatorPct] = useState<number>(80);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, ruleRes] = await Promise.all([
        fetch(`/api/v1/admin/withdrawals?status=${statusFilter}`),
        fetch('/api/v1/admin/revenue-rules'),
      ]);

      const reqData = await reqRes.json();
      const ruleData = await ruleRes.json();

      if (reqData.success) setRequests(reqData.data || []);
      if (ruleData.success) setRevenueRules(ruleData.data || []);
    } catch (err: any) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [statusFilter]);

  const handleProcessAction = async () => {
    if (!selectedRequest || !actionType) return;
    setIsProcessing(true);
    setNotification(null);

    try {
      const res = await fetch(`/api/v1/admin/withdrawals/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: actionType,
          remarks: remarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to process request');
      }

      setNotification({
        type: 'success',
        message: `Successfully ${actionType}d withdrawal request ${selectedRequest.id}`,
      });

      setSelectedRequest(null);
      setActionType(null);
      setRemarks('');
      fetchAdminData();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error processing request',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveRevenueRule = async () => {
    if (!editingRule) return;
    const platformPct = 100 - creatorPct;

    try {
      const res = await fetch('/api/v1/admin/revenue-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingRule,
          creatorPercentage: creatorPct,
          platformPercentage: platformPct,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update rule');
      }

      setNotification({ type: 'success', message: `Updated revenue share rule for ${editingRule.category}` });
      setEditingRule(null);
      fetchAdminData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error updating rule' });
    }
  };

  const handleExportAuditableReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      revenueRules,
      withdrawalRequests: requests,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_ledger_audit_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="admin-withdrawal-panel shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Financial Management & Withdrawal Approval Panel
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review creator payouts, adjust platform revenue commission rates, and export auditable reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportAuditableReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Audit Log
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl text-xs font-medium border ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Revenue Share Rules Config */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-400" /> Platform Revenue Share Rules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {revenueRules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-amber-400 capitalize">{rule.category.replace('_', ' ')}</span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {rule.id}</span>
                </div>
                <p className="text-[11px] text-slate-400">{rule.description || 'Category Revenue Sharing'}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <div>
                  <span className="text-emerald-400 font-bold">{rule.creatorPercentage}% Creator</span> /{' '}
                  <span className="text-purple-400 font-bold">{rule.platformPercentage}% Platform</span>
                </div>
                <button
                  onClick={() => {
                    setEditingRule(rule);
                    setCreatorPct(rule.creatorPercentage);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Edit Rule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Edit Revenue Share: {editingRule.category}</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Creator Percentage: {creatorPct}%</label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={creatorPct}
                  onChange={(e) => setCreatorPct(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs flex justify-between">
                <span>Platform Commission:</span>
                <strong className="text-purple-400">{100 - creatorPct}%</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRevenueRule}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Requests Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            Creator Withdrawal Requests
          </h3>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-slate-500 text-xs animate-pulse">
            Loading withdrawal requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs">
            No withdrawal requests matching status filter '{statusFilter}'.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Request ID & Creator</th>
                  <th className="py-3 px-3">Amount Requested</th>
                  <th className="py-3 px-3">Fiat Payout</th>
                  <th className="py-3 px-3">Payment Info</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-200">{req.id}</div>
                      <div className="text-[11px] text-amber-400 font-bold">{req.creatorName}</div>
                      <div className="text-[10px] text-slate-500">{new Date(req.createdAt).toLocaleString()}</div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {req.amount.toLocaleString()} Coins
                    </td>

                    <td className="py-3 px-3 font-mono font-extrabold text-emerald-400">
                      ₹{req.payoutAmount.toLocaleString()} INR
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-300 capitalize">{req.paymentMethod.replace('_', ' ')}</div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {req.payoutDetails.bankAccount || req.payoutDetails.upiId || req.payoutDetails.paypalEmail || 'N/A'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          req.status === 'approved' || req.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : req.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      {req.status === 'pending' || req.status === 'processing' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('approve');
                            }}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('reject');
                            }}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          Processed ({req.processedBy || 'Admin'})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Approval / Rejection Modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {actionType === 'approve' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
              {actionType === 'approve' ? 'Approve' : 'Reject'} Withdrawal #{selectedRequest.id}
            </h3>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Creator:</span>
                <strong className="text-amber-400">{selectedRequest.creatorName}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Coins:</span>
                <strong className="font-mono">{selectedRequest.amount} Coins</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Payout:</span>
                <strong className="font-mono text-emerald-400">₹{selectedRequest.payoutAmount} INR</strong>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Admin Remarks / Note (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'e.g. Transaction completed via IMPS Ref #918237'
                    : 'e.g. Invalid bank account details'
                }
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                  setRemarks('');
                }}
                disabled={isProcessing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessAction}
                disabled={isProcessing}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-slate-950 cursor-pointer ${
                  actionType === 'approve' ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-rose-500 hover:bg-rose-400 text-white'
                }`}
              >
                {isProcessing ? 'Processing...' : `Confirm ${actionType.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
