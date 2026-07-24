import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Settings, DollarSign, Clock, ShieldAlert, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { useCreatorEconomy } from '../../hooks/useCreatorEconomy';

interface CreatorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket?: Socket | null;
}

export const CreatorSettingsModal: React.FC<CreatorSettingsModalProps> = ({ isOpen, onClose, socket }) => {
  const { creatorSettings, isLoading, error, clearError, updateSettings } = useCreatorEconomy({ socket });

  const [minTipRequirement, setMinTipRequirement] = useState<number>(5);
  const [privateCallPrice, setPrivateCallPrice] = useState<number>(5);
  const [maxCallDuration, setMaxCallDuration] = useState<number>(15);
  const [autoReject, setAutoReject] = useState<boolean>(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (creatorSettings) {
      setMinTipRequirement(creatorSettings.minTipRequirement ?? 5);
      setPrivateCallPrice(creatorSettings.privateCallPrice ?? 5);
      setMaxCallDuration(creatorSettings.maxCallDuration ?? 15);
      setAutoReject(creatorSettings.autoReject ?? false);
      setOfflineMode(creatorSettings.offlineMode ?? false);
    }
  }, [creatorSettings]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      clearError();
      setSuccessMsg(null);
      await updateSettings({
        minTipRequirement,
        privateCallPrice,
        maxCallDuration,
        autoReject,
        offlineMode,
      });
      setSuccessMsg('Creator settings saved successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      // Handled in hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="creator-settings-modal">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white w-full max-w-md space-y-5 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Creator Settings</h3>
              <p className="text-xs text-slate-400">Configure private call requirements and pricing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
          {/* Minimum Tip Requirement */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Minimum Tip Requirement ($)</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={minTipRequirement}
              onChange={(e) => setMinTipRequirement(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400">Viewers must tip at least this total amount before sending a private call request</p>
          </div>

          {/* Private Call Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Private Call Price ($)</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={privateCallPrice}
              onChange={(e) => setPrivateCallPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400">Required viewer wallet balance / value for 1-on-1 private calls</p>
          </div>

          {/* Max Call Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Maximum Call Duration (Minutes)</span>
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={maxCallDuration}
              onChange={(e) => setMaxCallDuration(parseInt(e.target.value, 10) || 15)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-white">Auto Reject Requests</h4>
                <p className="text-[11px] text-slate-400">Automatically decline incoming call requests</p>
              </div>
              <button
                onClick={() => setAutoReject(!autoReject)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {autoReject ? (
                  <ToggleRight className="w-7 h-7 text-indigo-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-600" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-white">Offline Mode</h4>
                <p className="text-[11px] text-slate-400">Pause receiving private call requests completely</p>
              </div>
              <button
                onClick={() => setOfflineMode(!offlineMode)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {offlineMode ? (
                  <ToggleRight className="w-7 h-7 text-rose-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
