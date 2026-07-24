import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, RefreshCw, LogOut, Camera, Settings } from 'lucide-react';
import { useMedia } from '../../contexts/MediaContext';

export const MediaControlBar: React.FC = () => {
  const {
    isAudioMuted,
    isVideoDisabled,
    toggleAudio,
    toggleVideo,
    stopPreview,
    refreshDevices,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    changeVideoDevice,
    changeAudioDevice,
    isInitializing,
  } = useMedia();

  const [showSettings, setShowSettings] = useState<boolean>(false);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xl mx-auto">
      {/* Device Settings Panel (Collapsible) */}
      {showSettings && (
        <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-indigo-400" /> Media Device Selection
            </span>
            <button
              onClick={refreshDevices}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20"
            >
              <RefreshCw className="w-3 h-3" /> Refresh List
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Camera Selection */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Camera className="w-3 h-3 text-slate-500" /> Camera Device
              </label>
              <select
                value={selectedVideoDeviceId}
                onChange={(e) => changeVideoDevice(e.target.value)}
                disabled={isInitializing || videoDevices.length === 0}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
              >
                {videoDevices.length === 0 ? (
                  <option value="">No Camera Found</option>
                ) : (
                  videoDevices.map((dev, idx) => (
                    <option key={dev.deviceId || idx} value={dev.deviceId}>
                      {dev.label || `Camera ${idx + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Microphone Selection */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Mic className="w-3 h-3 text-slate-500" /> Microphone Device
              </label>
              <select
                value={selectedAudioDeviceId}
                onChange={(e) => changeAudioDevice(e.target.value)}
                disabled={isInitializing || audioDevices.length === 0}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
              >
                {audioDevices.length === 0 ? (
                  <option value="">No Microphone Found</option>
                ) : (
                  audioDevices.map((dev, idx) => (
                    <option key={dev.deviceId || idx} value={dev.deviceId}>
                      {dev.label || `Microphone ${idx + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Primary Floating Action Control Bar */}
      <div className="flex items-center justify-center gap-3 bg-slate-900/90 border border-slate-800/90 p-3 rounded-2xl shadow-2xl backdrop-blur-md">
        {/* Toggle Microphone Mute */}
        <button
          id="toggle-mic-button"
          onClick={toggleAudio}
          className={`p-3.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-all duration-200 shadow-md ${
            isAudioMuted
              ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
          }`}
          title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          <span className="hidden sm:inline">{isAudioMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Toggle Video Enable/Disable */}
        <button
          id="toggle-video-button"
          onClick={toggleVideo}
          className={`p-3.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-all duration-200 shadow-md ${
            isVideoDisabled
              ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
          }`}
          title={isVideoDisabled ? 'Enable Camera' : 'Disable Camera'}
        >
          {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          <span className="hidden sm:inline">{isVideoDisabled ? 'Start Video' : 'Stop Video'}</span>
        </button>

        {/* Device Settings Toggle Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-all duration-200 border ${
            showSettings
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
          title="Media Device Options"
        >
          <Settings className="w-5 h-5" />
          <span className="hidden sm:inline">Devices</span>
        </button>

        {/* Leave Preview / Release Camera & Mic */}
        <button
          id="leave-preview-button"
          onClick={stopPreview}
          className="p-3.5 rounded-xl font-semibold text-xs flex items-center gap-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all duration-200 shadow-md"
          title="Stop camera preview and release hardware"
        >
          <LogOut className="w-5 h-5" />
          <span>Leave Preview</span>
        </button>
      </div>
    </div>
  );
};
