import { Socket } from 'socket.io-client';
import { PeerConnectionManager, PeerConnectionState } from './peer/PeerConnectionManager';
import { SOCKET_EVENTS } from '../../shared/events';

export interface PrivateCallEngineCallbacks {
  onRemoteStream?: (stream: MediaStream) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: PeerConnectionState) => void;
  onError?: (error: Error) => void;
}

export class PrivateCallEngine {
  public readonly sessionId: string;
  public readonly targetUserId: string;
  public readonly isHost: boolean;

  private socket: Socket;
  private peerManager: PeerConnectionManager | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callbacks: PrivateCallEngineCallbacks;
  private isClosed: boolean = false;

  constructor(
    sessionId: string,
    targetUserId: string,
    isHost: boolean,
    socket: Socket,
    callbacks: PrivateCallEngineCallbacks = {}
  ) {
    this.sessionId = sessionId;
    this.targetUserId = targetUserId;
    this.isHost = isHost;
    this.socket = socket;
    this.callbacks = callbacks;

    this.bindSocketListeners();
  }

  /**
   * Start the private WebRTC media session
   * Acquire local camera & mic (or reuse stream) and initiate WebRTC handshake
   */
  public async start(existingLocalStream?: MediaStream | null): Promise<void> {
    try {
      console.log(`[PrivateCallEngine:${this.sessionId}] Starting private call session (isHost: ${this.isHost})...`);

      // Acquire or prepare local media stream for private call
      if (existingLocalStream) {
        // Clone or use existing tracks
        this.localStream = existingLocalStream;
      } else {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
            audio: true,
          });
        } catch (mediaErr) {
          console.warn(`[PrivateCallEngine:${this.sessionId}] Could not acquire video/audio, trying audio-only...`, mediaErr);
          try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          } catch (audioErr) {
            console.error(`[PrivateCallEngine:${this.sessionId}] Failed to acquire media:`, audioErr);
            this.localStream = new MediaStream();
          }
        }
      }

      if (this.callbacks.onLocalStream && this.localStream) {
        this.callbacks.onLocalStream(this.localStream);
      }

      // Instantiate dedicated PeerConnectionManager
      this.peerManager = new PeerConnectionManager(
        `private_${this.targetUserId}`,
        this.sessionId,
        this.isHost,
        {
          onIceCandidate: (candidate) => {
            if (this.socket && !this.isClosed) {
              this.socket.emit(SOCKET_EVENTS.PRIVATE_ICE_CANDIDATE, {
                sessionId: this.sessionId,
                targetUserId: this.targetUserId,
                candidate: candidate.toJSON(),
              });
            }
          },
          onConnectionStateChange: (state) => {
            console.log(`[PrivateCallEngine:${this.sessionId}] Connection state: ${state}`);
            if (this.callbacks.onConnectionStateChange) {
              this.callbacks.onConnectionStateChange(state);
            }
          },
          onRemoteStream: (stream) => {
            console.log(`[PrivateCallEngine:${this.sessionId}] Received remote stream!`);
            this.remoteStream = stream;
            if (this.callbacks.onRemoteStream) {
              this.callbacks.onRemoteStream(stream);
            }
          },
          onError: (err) => {
            console.error(`[PrivateCallEngine:${this.sessionId}] Peer error:`, err);
            if (this.callbacks.onError) {
              this.callbacks.onError(err);
            }
          },
        }
      );

      // Attach local stream tracks to the private PeerConnection
      if (this.localStream && this.localStream.getTracks().length > 0) {
        this.peerManager.attachLocalStream(this.localStream);
      }

      // If this client is the host (caller), create and send SDP offer
      if (this.isHost) {
        console.log(`[PrivateCallEngine:${this.sessionId}] Creating private offer...`);
        const offer = await this.peerManager.createOffer();
        this.socket.emit(SOCKET_EVENTS.PRIVATE_OFFER, {
          sessionId: this.sessionId,
          targetUserId: this.targetUserId,
          offer,
        });
      }
    } catch (err: any) {
      console.error(`[PrivateCallEngine:${this.sessionId}] Error starting private call engine:`, err);
      if (this.callbacks.onError) {
        this.callbacks.onError(err);
      }
    }
  }

  /**
   * Bind socket events for private offer, answer, and ICE candidates
   */
  private bindSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on(
      SOCKET_EVENTS.PRIVATE_OFFER,
      async (data: { sessionId: string; senderUserId: string; offer: RTCSessionDescriptionInit }) => {
        if (data?.sessionId !== this.sessionId || this.isClosed) return;
        try {
          console.log(`[PrivateCallEngine:${this.sessionId}] Received private offer from ${data.senderUserId}`);
          if (this.peerManager) {
            const answer = await this.peerManager.handleOfferAndCreateAnswer(data.offer);
            this.socket.emit(SOCKET_EVENTS.PRIVATE_ANSWER, {
              sessionId: this.sessionId,
              targetUserId: this.targetUserId,
              answer,
            });
          }
        } catch (err: any) {
          console.error(`[PrivateCallEngine:${this.sessionId}] Error handling private offer:`, err);
        }
      }
    );

    this.socket.on(
      SOCKET_EVENTS.PRIVATE_ANSWER,
      async (data: { sessionId: string; senderUserId: string; answer: RTCSessionDescriptionInit }) => {
        if (data?.sessionId !== this.sessionId || this.isClosed) return;
        try {
          console.log(`[PrivateCallEngine:${this.sessionId}] Received private answer from ${data.senderUserId}`);
          if (this.peerManager) {
            await this.peerManager.handleAnswer(data.answer);
          }
        } catch (err: any) {
          console.error(`[PrivateCallEngine:${this.sessionId}] Error handling private answer:`, err);
        }
      }
    );

    this.socket.on(
      SOCKET_EVENTS.PRIVATE_ICE_CANDIDATE,
      async (data: { sessionId: string; senderUserId: string; candidate: RTCIceCandidateInit }) => {
        if (data?.sessionId !== this.sessionId || this.isClosed) return;
        try {
          if (this.peerManager) {
            await this.peerManager.addIceCandidate(data.candidate);
          }
        } catch (err: any) {
          console.error(`[PrivateCallEngine:${this.sessionId}] Error adding private ICE candidate:`, err);
        }
      }
    );
  }

  public toggleAudio(isMuted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }

  public toggleVideo(isDisabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isDisabled;
      });
    }
  }

  public close(): void {
    if (this.isClosed) return;
    this.isClosed = true;

    console.log(`[PrivateCallEngine:${this.sessionId}] Closing private call engine...`);

    if (this.peerManager) {
      this.peerManager.close();
      this.peerManager = null;
    }

    if (this.socket) {
      this.socket.off(SOCKET_EVENTS.PRIVATE_OFFER);
      this.socket.off(SOCKET_EVENTS.PRIVATE_ANSWER);
      this.socket.off(SOCKET_EVENTS.PRIVATE_ICE_CANDIDATE);
    }
  }
}
