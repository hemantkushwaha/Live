import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../shared/events';
import { ConnectionRegistry } from './peer/ConnectionRegistry';
import { PeerConnectionManager, PeerConnectionState } from './peer/PeerConnectionManager';

export interface SignalingEngineEvents {
  onConnectionStateChange?: (peerId: string, state: PeerConnectionState) => void;
  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  onStreamEnded?: (streamId: string) => void;
  onError?: (peerId: string, error: Error) => void;
}

export class SignalingEngine {
  private socket: Socket;
  private currentUserId: string;
  private registry: ConnectionRegistry;
  private events: SignalingEngineEvents;
  private activeStreamId: string | null = null;
  private isHost: boolean = false;
  private localMediaStream: MediaStream | null = null;

  constructor(socket: Socket, currentUserId: string, events: SignalingEngineEvents = {}) {
    this.socket = socket;
    this.currentUserId = currentUserId;
    this.registry = new ConnectionRegistry();
    this.events = events;

    this.bindSocketListeners();
  }

  private bindSocketListeners(): void {
    // 1. Host receives notification that a viewer joined the stream
    this.socket.on(
      SOCKET_EVENTS.WEBRTC_USER_JOINED,
      async (data: { streamId: string; viewerUserId: string; viewerSocketId?: string }) => {
        if (!this.isHost || !data || data.streamId !== this.activeStreamId) return;
        const { streamId, viewerUserId } = data;
        console.log(`[SignalingEngine] Viewer ${viewerUserId} joined stream ${streamId}. Initiating WebRTC offer.`);

        await this.initiateHostPeerConnection(streamId, viewerUserId);
      }
    );

    // 2. Viewer receives WebRTC Offer from Host
    this.socket.on(
      SOCKET_EVENTS.WEBRTC_OFFER,
      async (data: { streamId: string; senderUserId: string; offer: RTCSessionDescriptionInit }) => {
        if (this.isHost || !data) return;
        const { streamId, senderUserId, offer } = data;
        console.log(`[SignalingEngine] Received WebRTC offer from host ${senderUserId} for stream ${streamId}`);

        await this.handleIncomingOffer(streamId, senderUserId, offer);
      }
    );

    // 3. Host receives WebRTC Answer from Viewer
    this.socket.on(
      SOCKET_EVENTS.WEBRTC_ANSWER,
      async (data: { streamId: string; senderUserId: string; answer: RTCSessionDescriptionInit }) => {
        if (!this.isHost || !data) return;
        const { streamId, senderUserId, answer } = data;
        console.log(`[SignalingEngine] Received WebRTC answer from viewer ${senderUserId} for stream ${streamId}`);

        await this.handleIncomingAnswer(senderUserId, answer);
      }
    );

    // 4. Peer receives ICE Candidate
    this.socket.on(
      SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE,
      async (data: { streamId: string; senderUserId: string; candidate: RTCIceCandidateInit }) => {
        if (!data) return;
        const { senderUserId, candidate } = data;

        const peerManager = this.registry.get(senderUserId);
        if (peerManager) {
          await peerManager.addIceCandidate(candidate);
        }
      }
    );

    // 5. Peer leaves stream notification
    this.socket.on(SOCKET_EVENTS.WEBRTC_USER_LEFT, (data: { streamId: string; viewerUserId: string }) => {
      if (!data) return;
      console.log(`[SignalingEngine] User ${data.viewerUserId} left stream. Closing peer connection.`);
      this.registry.close(data.viewerUserId);
    });

    // 6. Host ends stream notification
    this.socket.on(SOCKET_EVENTS.STREAM_ENDED, (data: { streamId: string }) => {
      if (!data) return;
      console.log(`[SignalingEngine] Stream ${data.streamId} ended by host.`);
      if (this.events.onStreamEnded) {
        this.events.onStreamEnded(data.streamId);
      }
      this.reset();
    });
  }

  /**
   * Set local MediaStream to be attached when hosting
   */
  public setLocalMediaStream(stream: MediaStream | null): void {
    this.localMediaStream = stream;
  }

  /**
   * Host starts WebRTC signaling for hosted stream
   */
  public startHosting(streamId: string): void {
    this.activeStreamId = streamId;
    this.isHost = true;
    console.log(`[SignalingEngine] Started WebRTC host signaling engine for stream ${streamId}`);
  }

  /**
   * Viewer joins WebRTC signaling for stream
   */
  public joinStream(streamId: string): void {
    this.activeStreamId = streamId;
    this.isHost = false;
    this.socket.emit(SOCKET_EVENTS.WEBRTC_JOIN_STREAM, { streamId });
    console.log(`[SignalingEngine] Sent WEBRTC_JOIN_STREAM for stream ${streamId}`);
  }

  /**
   * Viewer leaves WebRTC signaling for stream
   */
  public leaveStream(): void {
    if (this.activeStreamId && !this.isHost) {
      this.socket.emit(SOCKET_EVENTS.WEBRTC_LEAVE_STREAM, { streamId: this.activeStreamId });
    }
    this.reset();
  }

  /**
   * Host initiates peer connection to new viewer, creates offer and sends via socket
   */
  private async initiateHostPeerConnection(streamId: string, viewerUserId: string): Promise<void> {
    try {
      const peerManager = new PeerConnectionManager(
        viewerUserId,
        streamId,
        true,
        {
          onIceCandidate: (candidate) => {
            this.socket.emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, {
              streamId,
              targetUserId: viewerUserId,
              candidate: candidate.toJSON(),
            });
          },
          onConnectionStateChange: (state) => {
            if (this.events.onConnectionStateChange) {
              this.events.onConnectionStateChange(viewerUserId, state);
            }
          },
          onError: (err) => {
            if (this.events.onError) {
              this.events.onError(viewerUserId, err);
            }
          },
        }
      );

      // Attach local camera/audio stream if host is broadcasting
      if (this.localMediaStream) {
        peerManager.attachLocalStream(this.localMediaStream);
      }

      this.registry.register(viewerUserId, peerManager);

      const offer = await peerManager.createOffer();
      this.socket.emit(SOCKET_EVENTS.WEBRTC_OFFER, {
        streamId,
        targetUserId: viewerUserId,
        offer,
      });
      console.log(`[SignalingEngine] Sent WebRTC offer to viewer ${viewerUserId}`);
    } catch (err: any) {
      console.error(`[SignalingEngine] Failed to initiate peer connection for viewer ${viewerUserId}:`, err);
    }
  }

  /**
   * Viewer handles incoming offer from host, creates answer and sends via socket
   */
  private async handleIncomingOffer(
    streamId: string,
    hostUserId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    try {
      const peerManager = new PeerConnectionManager(
        hostUserId,
        streamId,
        false,
        {
          onIceCandidate: (candidate) => {
            this.socket.emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, {
              streamId,
              targetUserId: hostUserId,
              candidate: candidate.toJSON(),
            });
          },
          onConnectionStateChange: (state) => {
            if (this.events.onConnectionStateChange) {
              this.events.onConnectionStateChange(hostUserId, state);
            }
          },
          onRemoteStream: (stream) => {
            console.log(`[SignalingEngine] Received remote stream from host ${hostUserId}`);
            if (this.events.onRemoteStream) {
              this.events.onRemoteStream(hostUserId, stream);
            }
          },
          onError: (err) => {
            if (this.events.onError) {
              this.events.onError(hostUserId, err);
            }
          },
        }
      );

      this.registry.register(hostUserId, peerManager);

      const answer = await peerManager.handleOfferAndCreateAnswer(offer);
      this.socket.emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
        streamId,
        targetUserId: hostUserId,
        answer,
      });
      console.log(`[SignalingEngine] Sent WebRTC answer to host ${hostUserId}`);
    } catch (err: any) {
      console.error(`[SignalingEngine] Failed to handle offer from host ${hostUserId}:`, err);
    }
  }

  /**
   * Host handles incoming answer from viewer
   */
  private async handleIncomingAnswer(viewerUserId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const peerManager = this.registry.get(viewerUserId);
      if (!peerManager) {
        throw new Error(`No active peer connection manager found for viewer ${viewerUserId}`);
      }
      await peerManager.handleAnswer(answer);
      console.log(`[SignalingEngine] Successfully set remote answer for viewer ${viewerUserId}`);
    } catch (err: any) {
      console.error(`[SignalingEngine] Failed to handle answer from viewer ${viewerUserId}:`, err);
    }
  }

  /**
   * Get peer manager
   */
  public getPeerManager(peerId: string): PeerConnectionManager | undefined {
    return this.registry.get(peerId);
  }

  /**
   * Get active connection count
   */
  public get connectionCount(): number {
    return this.registry.size;
  }

  /**
   * Reset and close all connections
   */
  public reset(): void {
    this.registry.closeAll();
    this.activeStreamId = null;
    this.isHost = false;
  }

  public destroy(): void {
    this.reset();
    this.socket.off(SOCKET_EVENTS.WEBRTC_USER_JOINED);
    this.socket.off(SOCKET_EVENTS.WEBRTC_OFFER);
    this.socket.off(SOCKET_EVENTS.WEBRTC_ANSWER);
    this.socket.off(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE);
    this.socket.off(SOCKET_EVENTS.WEBRTC_USER_LEFT);
  }
}
