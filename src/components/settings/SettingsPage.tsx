import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, Clock, ShieldAlert, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, Camera, Mic, Volume2, ArrowLeft } from 'lucide-react';
import { useCreatorEconomy } from '../../hooks/useCreatorEconomy';
import { useMedia } from '../../contexts/MediaContext';

interface SettingsPageProps {
  onBack?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { creatorSettings, isLoading, error, clearError, updateSettings } = useCreatorEconomy({});
  const {
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    changeVideoDevice,
    changeAudioDevice,
    startPreview,
    stopPreview,
    isPreviewOpen,
  } = useMedia();

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
      setSuccessMsg('Creator & System settings saved successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      // Handled in hook
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 animate-in fade-in duration-300" id="settings-page">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Go Back"
              id="settings-back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Platform Settings</h1>
            <p className="text-xs text-slate-400">Configure private call pricing, minimum tips, and hardware media devices</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 cursor-pointer"
          id="save-settings-btn"
        >
          {isLoading ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Economy & Private Call Rates */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <DollarSign className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Private Call & Tip Rates</h2>
          </div>

          <div className="space-y-4">
            {/* Minimum Tip Requirement */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Minimum Tip Requirement ($ / Coins)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={minTipRequirement}
                onChange={(e) => setMinTipRequirement(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400">Viewers must tip at least this amount before sending private session requests</p>
            </div>

            {/* Private Call Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Private Call Price ($ / Coins per session)</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={privateCallPrice}
                onChange={(e) => setPrivateCallPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400">Required rate for 1-on-1 private video calls</p>
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Toggles */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Auto Reject Requests</h4>
                  <p className="text-[11px] text-slate-400">Automatically decline incoming call requests</p>
                </div>
                <button
                  onClick={() => setAutoReject(!autoReject)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                  <p className="text-[11px] text-slate-400">Pause receiving call requests completely</p>
                </div>
                <button
                  onClick={() => setOfflineMode(!offlineMode)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
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
        </div>

        {/* Right Column: Audio & Video Device Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Camera & Microphone Hardware</h2>
          </div>

          <div className="space-y-4">
            {/* Camera Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>Active Camera Source</span>
              </label>
              <select
                value={selectedVideoDeviceId}
                onChange={(e) => changeVideoDevice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {videoDevices.length > 0 ? (
                  videoDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Camera (${dev.deviceId.slice(0, 8)})`}
                    </option>
                  ))
                ) : (
                  <option value="">Default System Camera</option>
                )}
              </select>
            </div>

            {/* Microphone Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Audio Input Microphone</span>
              </label>
              <select
                value={selectedAudioDeviceId}
                onChange={(e) => changeAudioDevice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {audioDevices.length > 0 ? (
                  audioDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Microphone (${dev.deviceId.slice(0, 8)})`}
                    </option>
                  ))
                ) : (
                  <option value="">Default System Microphone</option>
                )}
              </select>
            </div>

            {/* Camera / Mic Test Button */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Media Test & Preview</h4>
                <p className="text-[11px] text-slate-400">Test hardware camera & mic inputs</p>
              </div>

              {isPreviewOpen ? (
                <button
                  onClick={stopPreview}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Close Test
                </button>
              ) : (
                <button
                  onClick={() => startPreview()}
                  className="px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Test Camera
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
