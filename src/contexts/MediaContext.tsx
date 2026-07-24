import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MediaService, DeviceList } from '../services/mediaService';

interface MediaContextType {
  stream: MediaStream | null;
  isPreviewOpen: boolean;
  isInitializing: boolean;
  isAudioMuted: boolean;
  isVideoDisabled: boolean;
  hasPermissions: boolean;
  permissionError: string | null;
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  selectedVideoDeviceId: string;
  selectedAudioDeviceId: string;
  resolution: { width: number; height: number } | null;
  activeVideoLabel: string;
  activeAudioLabel: string;
  
  // Actions
  startPreview: (videoDevId?: string, audioDevId?: string) => Promise<boolean>;
  stopPreview: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  refreshDevices: () => Promise<void>;
  changeVideoDevice: (deviceId: string) => Promise<void>;
  changeAudioDevice: (deviceId: string) => Promise<void>;
  clearError: () => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState<boolean>(false);
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');

  const [resolution, setResolution] = useState<{ width: number; height: number } | null>(null);
  const [activeVideoLabel, setActiveVideoLabel] = useState<string>('No Camera');
  const [activeAudioLabel, setActiveAudioLabel] = useState<string>('No Microphone');

  // Enumerate devices on mount and listen to device change events
  const refreshDevices = useCallback(async () => {
    const devices: DeviceList = await MediaService.getAvailableDevices();
    setVideoDevices(devices.videoDevices);
    setAudioDevices(devices.audioDevices);

    if (devices.videoDevices.length > 0 && !selectedVideoDeviceId) {
      setSelectedVideoDeviceId(devices.videoDevices[0].deviceId);
    }
    if (devices.audioDevices.length > 0 && !selectedAudioDeviceId) {
      setSelectedAudioDeviceId(devices.audioDevices[0].deviceId);
    }
  }, [selectedVideoDeviceId, selectedAudioDeviceId]);

  useEffect(() => {
    refreshDevices();

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
      };
    }
  }, [refreshDevices]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      MediaService.stopStream(stream);
    };
  }, [stream]);

  // Update track controls & labels whenever stream changes
  const updateStreamInfo = (newStream: MediaStream | null) => {
    if (!newStream) {
      setResolution(null);
      setActiveVideoLabel('No Camera');
      setActiveAudioLabel('No Microphone');
      return;
    }

    const res = MediaService.getStreamResolution(newStream);
    setResolution(res);

    const labels = MediaService.getTrackLabels(newStream);
    setActiveVideoLabel(labels.videoLabel);
    setActiveAudioLabel(labels.audioLabel);

    const videoTrack = newStream.getVideoTracks()[0];
    const audioTrack = newStream.getAudioTracks()[0];

    setIsVideoDisabled(videoTrack ? !videoTrack.enabled : true);
    setIsAudioMuted(audioTrack ? !audioTrack.enabled : true);
  };

  /**
   * Request media permissions and launch local preview
   */
  const startPreview = async (videoDevId?: string, audioDevId?: string): Promise<boolean> => {
    setIsInitializing(true);
    setPermissionError(null);

    try {
      // Stop old stream if existing
      if (stream) {
        MediaService.stopStream(stream);
      }

      const targetVideoId = videoDevId || selectedVideoDeviceId;
      const targetAudioId = audioDevId || selectedAudioDeviceId;

      const mediaStream = await MediaService.getLocalStream(targetVideoId, targetAudioId);

      setStream(mediaStream);
      setHasPermissions(true);
      setIsPreviewOpen(true);
      setIsAudioMuted(false);
      setIsVideoDisabled(false);

      updateStreamInfo(mediaStream);

      // Refresh device list to capture device labels after permissions granted
      await refreshDevices();

      return true;
    } catch (err: any) {
      setPermissionError(err.message || 'Failed to access camera/microphone.');
      setHasPermissions(false);
      setIsPreviewOpen(true); // Open preview modal to present error & retry options
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Stop local stream and exit preview
   */
  const stopPreview = () => {
    if (stream) {
      MediaService.stopStream(stream);
      setStream(null);
    }
    setIsPreviewOpen(false);
    setPermissionError(null);
    updateStreamInfo(null);
  };

  /**
   * Toggle Microphone Mute State
   */
  const toggleAudio = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  };

  /**
   * Toggle Video Enable/Disable State
   */
  const toggleVideo = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoDisabled(!videoTrack.enabled);
    }
  };

  /**
   * Change Active Video Camera Device
   */
  const changeVideoDevice = async (deviceId: string) => {
    setSelectedVideoDeviceId(deviceId);
    if (isPreviewOpen) {
      await startPreview(deviceId, selectedAudioDeviceId);
    }
  };

  /**
   * Change Active Audio Input Device
   */
  const changeAudioDevice = async (deviceId: string) => {
    setSelectedAudioDeviceId(deviceId);
    if (isPreviewOpen) {
      await startPreview(selectedVideoDeviceId, deviceId);
    }
  };

  const clearError = () => {
    setPermissionError(null);
  };

  return (
    <MediaContext.Provider
      value={{
        stream,
        isPreviewOpen,
        isInitializing,
        isAudioMuted,
        isVideoDisabled,
        hasPermissions,
        permissionError,
        videoDevices,
        audioDevices,
        selectedVideoDeviceId,
        selectedAudioDeviceId,
        resolution,
        activeVideoLabel,
        activeAudioLabel,
        startPreview,
        stopPreview,
        toggleAudio,
        toggleVideo,
        refreshDevices,
        changeVideoDevice,
        changeAudioDevice,
        clearError,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = (): MediaContextType => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
};
