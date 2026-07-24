export interface DeviceList {
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
}

export class MediaService {
  /**
   * Request media permissions and obtain a local MediaStream
   */
  public static async getLocalStream(
    videoDeviceId?: string,
    audioDeviceId?: string
  ): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('WebRTC MediaDevices API is not supported in this browser or context.');
    }

    const videoConstraint: boolean | MediaTrackConstraints = videoDeviceId
      ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
      : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' };

    const audioConstraint: boolean | MediaTrackConstraints = audioDeviceId
      ? { deviceId: { exact: audioDeviceId } }
      : true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraint,
        audio: audioConstraint,
      });

      return stream;
    } catch (error: any) {
      throw this.parseMediaError(error);
    }
  }

  /**
   * Enumerate available media devices (cameras, microphones, speakers)
   */
  public static async getAvailableDevices(): Promise<DeviceList> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { videoDevices: [], audioDevices: [], audioOutputDevices: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        videoDevices: devices.filter((d) => d.kind === 'videoinput'),
        audioDevices: devices.filter((d) => d.kind === 'audioinput'),
        audioOutputDevices: devices.filter((d) => d.kind === 'audiooutput'),
      };
    } catch (error) {
      console.error('Error enumerating devices:', error);
      return { videoDevices: [], audioDevices: [], audioOutputDevices: [] };
    }
  }

  /**
   * Safely stop all tracks on a MediaStream to release camera and mic hardware
   */
  public static stopStream(stream: MediaStream | null): void {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (err) {
        console.error('Error stopping media track:', err);
      }
    });
  }

  /**
   * Inspect current video track resolution
   */
  public static getStreamResolution(stream: MediaStream | null): { width: number; height: number } | null {
    if (!stream) return null;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return null;

    const settings = videoTrack.getSettings();
    if (settings.width && settings.height) {
      return { width: settings.width, height: settings.height };
    }
    return null;
  }

  /**
   * Get track labels for active stream
   */
  public static getTrackLabels(stream: MediaStream | null): { videoLabel: string; audioLabel: string } {
    if (!stream) return { videoLabel: 'No Camera', audioLabel: 'No Microphone' };

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    return {
      videoLabel: videoTrack ? videoTrack.label || 'Default Camera' : 'Camera Disabled',
      audioLabel: audioTrack ? audioTrack.label || 'Default Microphone' : 'Microphone Disabled',
    };
  }

  /**
   * Convert DOMExceptions into human-friendly error messages
   */
  private static parseMediaError(error: any): Error {
    const errorName = error.name || error.toString();

    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
      return new Error('Camera and microphone access was denied. Please grant permissions in your browser address bar and retry.');
    }
    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
      return new Error('No camera or microphone hardware found on your device.');
    }
    if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
      return new Error('Your camera or microphone is currently in use by another application (e.g. Zoom, Teams).');
    }
    if (errorName === 'OverconstrainedError') {
      return new Error('The requested camera settings or resolution are not supported by your device.');
    }
    if (errorName === 'TypeError') {
      return new Error('MediaDevice API is not available on an insecure non-HTTPS connection.');
    }

    return new Error(error.message || 'Failed to initialize local camera and microphone.');
  }
}
