import { DEFAULT_STUN_SERVERS } from '../types';

export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  onRemoteTrack?: (stream: MediaStream) => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private config: WebRTCConfig;

  constructor(config: WebRTCConfig) {
    this.config = config;
  }

  async acquireLocalStream(video = true, audio = true): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video, audio });
      return this.localStream;
    } catch (err) {
      console.error('Failed to acquire media devices:', err);
      throw new Error('Camera or Microphone access denied / unavailable.');
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  initPeerConnection(): RTCPeerConnection {
    if (this.pc) {
      return this.pc;
    }

    const iceServers = this.config.iceServers || DEFAULT_STUN_SERVERS;
    this.pc = new RTCPeerConnection({ iceServers });

    this.remoteStream = new MediaStream();

    // Attach local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.pc && this.localStream) {
          this.pc.addTrack(track, this.localStream);
        }
      });
    }

    // Handle remote media track
    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        event.streams[0]?.getTracks().forEach((track) => {
          this.remoteStream?.addTrack(track);
        });
      }
      if (this.remoteStream && this.config.onRemoteTrack) {
        this.config.onRemoteTrack(this.remoteStream);
      }
    };

    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.config.onIceCandidate) {
        this.config.onIceCandidate(event.candidate);
      }
    };

    // Connection state changes
    this.pc.onconnectionstatechange = () => {
      if (this.pc && this.config.onConnectionStateChange) {
        this.config.onConnectionStateChange(this.pc.connectionState);
      }
    };

    return this.pc;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const pc = this.initPeerConnection();
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(offerSdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = this.initPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answerSdp: RTCSessionDescriptionInit): Promise<void> {
    if (this.pc) {
      await this.pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
    }
  }

  async addIceCandidate(candidateInit: RTCIceCandidateInit): Promise<void> {
    if (this.pc) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } catch (e) {
        console.warn('Error adding ICE candidate:', e);
      }
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  closePeerConnection() {
    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.onconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }
    this.remoteStream = null;
  }

  destroy() {
    this.stopLocalStream();
    this.closePeerConnection();
  }
}
