import { SignalingEngine } from '../webrtc/SignalingEngine';
import { PeerConnectionState } from '../webrtc/peer/PeerConnectionManager';

export type RemoteStreamListener = (peerId: string, stream: MediaStream | null) => void;
export type ConnectionStateListener = (peerId: string, state: PeerConnectionState) => void;
export type StreamEndedListener = (streamId: string) => void;

/**
 * Reusable StreamingService abstraction layer.
 * Isolates transport layer (WebRTC P2P or future SFU) from React UI components.
 * React components deal exclusively with StreamingService and Contexts.
 */
export class StreamingService {
  private static instance: StreamingService;

  private signalingEngine: SignalingEngine | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private remoteStreamListeners: Set<RemoteStreamListener> = new Set();
  private connectionStateListeners: Set<ConnectionStateListener> = new Set();
  private streamEndedListeners: Set<StreamEndedListener> = new Set();

  public static getInstance(): StreamingService {
    if (!StreamingService.instance) {
      StreamingService.instance = new StreamingService();
    }
    return StreamingService.instance;
  }

  /**
   * Bind SignalingEngine instance to StreamingService
   */
  public bindSignalingEngine(engine: SignalingEngine): void {
    this.signalingEngine = engine;
  }

  /**
   * Set host local media stream
   */
  public setLocalStream(stream: MediaStream | null): void {
    if (this.signalingEngine) {
      this.signalingEngine.setLocalMediaStream(stream);
    }
  }

  /**
   * Handle incoming remote stream from WebRTC or SFU
   */
  public handleRemoteStream(peerId: string, stream: MediaStream): void {
    this.remoteStreams.set(peerId, stream);
    this.remoteStreamListeners.forEach((listener) => listener(peerId, stream));
  }

  /**
   * Handle connection state changes
   */
  public handleConnectionStateChange(peerId: string, state: PeerConnectionState): void {
    if (state === 'closed' || state === 'failed' || state === 'disconnected') {
      // Clean up remote stream if failed/closed
      if (state === 'closed' || state === 'failed') {
        this.remoteStreams.delete(peerId);
        this.remoteStreamListeners.forEach((listener) => listener(peerId, null));
      }
    }
    this.connectionStateListeners.forEach((listener) => listener(peerId, state));
  }

  /**
   * Handle host ending stream
   */
  public handleStreamEnded(streamId: string): void {
    this.remoteStreams.clear();
    this.streamEndedListeners.forEach((listener) => listener(streamId));
  }

  /**
   * Join stream viewing mode
   */
  public joinStream(streamId: string): void {
    if (!this.signalingEngine) {
      throw new Error('StreamingService is not initialized with a signaling engine');
    }
    this.signalingEngine.joinStream(streamId);
  }

  /**
   * Leave current stream
   */
  public leaveStream(): void {
    if (this.signalingEngine) {
      this.signalingEngine.leaveStream();
    }
    this.remoteStreams.clear();
    this.remoteStreamListeners.forEach((listener) => {
      // notify listeners that remote stream is cleared
      for (const peerId of Array.from(this.remoteStreams.keys())) {
        listener(peerId, null);
      }
    });
  }

  /**
   * Retrieve active remote stream for a peer/host ID
   */
  public getRemoteStream(peerId: string): MediaStream | null {
    return this.remoteStreams.get(peerId) || null;
  }

  /**
   * Subscribe to remote media stream availability updates
   */
  public onRemoteStream(listener: RemoteStreamListener): () => void {
    this.remoteStreamListeners.add(listener);
    return () => {
      this.remoteStreamListeners.delete(listener);
    };
  }

  /**
   * Subscribe to connection state updates
   */
  public onConnectionState(listener: ConnectionStateListener): () => void {
    this.connectionStateListeners.add(listener);
    return () => {
      this.connectionStateListeners.delete(listener);
    };
  }

  /**
   * Subscribe to stream ended events
   */
  public onStreamEnded(listener: StreamEndedListener): () => void {
    this.streamEndedListeners.add(listener);
    return () => {
      this.streamEndedListeners.delete(listener);
    };
  }

  /**
   * Reset service state
   */
  public reset(): void {
    this.remoteStreams.clear();
  }
}

export const streamingService = StreamingService.getInstance();
