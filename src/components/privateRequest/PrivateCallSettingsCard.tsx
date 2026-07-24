import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle, ShieldAlert, Coins, Clock, Loader2 } from 'lucide-react';
import { PrivateCallSettings } from '../../../shared/types';
import { privateRequestClient } from '../../services/privateRequestClient';

interface PrivateCallSettingsCardProps {
  creatorId?: string;
  onSettingsSaved?: (settings: PrivateCallSettings) => void;
  className?: string;
}

export const PrivateCallSettingsCard: React.FC<PrivateCallSettingsCardProps> = ({
  creatorId,
  onSettingsSaved,
  className = '',
}) => {
  const [settings, setSettings] = useState<PrivateCallSettings>({
    creatorId: creatorId || '',
    enabled: true,
    minCoins: 100,
    pricePerMinute: 50,
    maxDuration: 10,
    busyMode: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const data = await privateRequestClient.getSettings(creatorId);
        setSettings(data);
      } catch {
        // Fallback to default
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [creatorId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMsg(null);

      const updated = await privateRequestClient.updateSettings(settings);
      setSettings(updated);
      setSuccessMsg('Private call settings saved successfully!');
      if (onSettingsSaved) onSettingsSaved(updated);

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`p-5 rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 text-xs text-center flex items-center justify-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-4 shadow-2xl ${className}`}
      id="private-call-settings-card"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Private Call Settings</h4>
            <p className="text-[11px] text-slate-400">Configure rates, rules, and call availability</p>
          </div>
        </div>
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

      {/* Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Private Calls</p>
            <p className="text-[10px] text-slate-400">Enable 1-on-1 calls</p>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
              settings.enabled ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
            id="toggle-private-calls-enabled"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Busy Mode</p>
            <p className="text-[10px] text-slate-400">Pause incoming requests</p>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, busyMode: !settings.busyMode })}
            className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
              settings.busyMode ? 'bg-amber-500' : 'bg-slate-800'
            }`}
            id="toggle-busy-mode"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.busyMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">Minimum Coins Required</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={settings.minCoins}
              onChange={(e) => setSettings({ ...settings, minCoins: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              id="input-min-coins"
            />
            <Coins className="w-4 h-4 text-amber-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">Price Per Minute (Coins)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={settings.pricePerMinute}
              onChange={(e) => setSettings({ ...settings, pricePerMinute: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              id="input-price-per-min"
            />
            <Coins className="w-4 h-4 text-amber-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">Max Duration (Mins)</label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="60"
              value={settings.maxDuration}
              onChange={(e) => setSettings({ ...settings, maxDuration: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              id="input-max-duration"
            />
            <Clock className="w-4 h-4 text-indigo-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        id="save-private-settings-btn"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>Save Private Call Settings</span>
      </button>
    </form>
  );
};
