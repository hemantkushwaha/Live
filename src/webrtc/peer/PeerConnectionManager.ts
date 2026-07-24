import { ConnectionFactory } from './ConnectionFactory';
import { ICEHandler } from './ICEHandler';
import { SDPHandler } from './SDPHandler';

export type PeerConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export interface PeerConnectionCallbacks {
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: PeerConnectionState) => void;
  onIceStateChange?: (state: RTCIceConnectionState) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
}

export class PeerConnectionManager {
  public readonly peerId: string;
  public readonly streamId: string;
  public readonly isHost: boolean;

  private pc: RTCPeerConnection;
  private iceHandler: ICEHandler;
  private sdpHandler: SDPHandler;
  private callbacks: PeerConnectionCallbacks;
  private timeoutTimer: NodeJS.Timeout | null = null;
  private isClosed: boolean = false;

  constructor(
    peerId: string,
    streamId: string,
    isHost: boolean,
    callbacks: PeerConnectionCallbacks = {},
    customRtcConfig?: RTCConfiguration
  ) {
    this.peerId = peerId;
    this.streamId = streamId;
    this.isHost = isHost;
    this.callbacks = callbacks;

    this.pc = ConnectionFactory.createPeerConnection(customRtcConfig);
    this.iceHandler = new ICEHandler(this.pc);
    this.sdpHandler = new SDPHandler(this.pc, this.iceHandler);

    this.bindEvents();
    this.startPeerTimeout(30000); // 30s connection timeout safeguard
  }

  private bindEvents(): void {
    // ICE candidates
    this.iceHandler.setOnCandidate((candidate) => {
      if (this.callbacks.onIceCandidate) {
        this.callbacks.onIceCandidate(candidate);
      }
    });

    // ICE connection state
    this.iceHandler.setOnStateChange((state) => {
      if (this.callbacks.onIceStateChange) {
        this.callbacks.onIceStateChange(state);
      }

      if (state === 'connected' || state === 'completed') {
        this.clearPeerTimeout();
        if (this.callbacks.onConnectionStateChange) {
          this.callbacks.onConnectionStateChange('connected');
        }
      } else if (state === 'failed') {
        this.handleError(new Error(`ICE Failure: ICE connection failed for peer ${this.peerId}`));
        if (this.callbacks.onConnectionStateChange) {
          this.callbacks.onConnectionStateChange('failed');
        }
      } else if (state === 'disconnected') {
        if (this.callbacks.onConnectionStateChange) {
          this.callbacks.onConnectionStateChange('disconnected');
        }
      }
    });

    // Handle incoming remote media tracks
    this.pc.ontrack = (event: RTCTrackEvent) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      console.log(`[PeerConnectionManager:${this.peerId}] Received remote track:`, event.track.kind);
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(stream);
      }
    };

    // PeerConnection connection state
    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState as PeerConnectionState;
      if (state === 'connected') {
        this.clearPeerTimeout();
      } else if (state === 'failed') {
        this.handleError(new Error(`Peer Connection Failed for peer ${this.peerId}`));
      }

      if (this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange(state);
      }
    };
  }

  /**
   * Attach local MediaStream tracks to PeerConnection
   */
  public attachLocalStream(mediaStream: MediaStream): void {
    try {
      mediaStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, mediaStream);
      });
      console.log(`[PeerConnectionManager:${this.peerId}] Attached ${mediaStream.getTracks().length} local tracks`);
    } catch (err: any) {
      console.error(`[PeerConnectionManager:${this.peerId}] Error attaching local stream:`, err);
    }
  }

  /**
   * Host creates offer
   */
  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    try {
      return await this.sdpHandler.createOffer();
    } catch (err: any) {
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Handle incoming offer and create answer
   */
  public async handleOfferAndCreateAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    try {
      await this.sdpHandler.handleRemoteDescription(offer);
      return await this.sdpHandler.createAnswer();
    } catch (err: any) {
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Handle incoming answer
   */
  public async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.sdpHandler.handleRemoteDescription(answer);
    } catch (err: any) {
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.iceHandler.addIceCandidate(candidate);
    } catch (err: any) {
      this.handleError(new Error(`ICE Candidate Error: ${err.message}`));
    }
  }

  /**
   * Start timeout timer to catch stale/stuck connections
   */
  private startPeerTimeout(ms: number): void {
    this.clearPeerTimeout();
    this.timeoutTimer = setTimeout(() => {
      if (this.pc.connectionState !== 'connected' && !this.isClosed) {
        this.handleError(new Error(`Peer Timeout: WebRTC connection timed out after ${ms / 1000}s`));
      }
    }, ms);
  }

  private clearPeerTimeout(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  private handleError(error: Error): void {
    console.error(`[PeerConnectionManager:${this.peerId}]`, error);
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  /**
   * Connection state getter
   */
  public get connectionState(): PeerConnectionState {
    return (this.pc.connectionState as PeerConnectionState) || 'new';
  }

  /**
   * ICE Connection state getter
   */
  public get iceConnectionState(): RTCIceConnectionState {
    return this.pc.iceConnectionState;
  }

  /**
   * Close connection
   */
  public close(): void {
    if (this.isClosed) return;
    this.isClosed = true;
    this.clearPeerTimeout();
    this.iceHandler.clearBuffer();
    try {
      this.pc.close();
    } catch (err) {
      // Ignore cleanup error
    }
  }
}
