/**
 * ICE Handler for managing candidate generation, buffering, and ICE connection state tracking
 */
export class ICEHandler {
  private pc: RTCPeerConnection;
  private candidateBuffer: RTCIceCandidateInit[] = [];
  private onIceCandidateCallback?: (candidate: RTCIceCandidate) => void;
  private onIceStateChangeCallback?: (state: RTCIceConnectionState) => void;

  constructor(pc: RTCPeerConnection) {
    this.pc = pc;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      if (this.onIceStateChangeCallback) {
        this.onIceStateChangeCallback(this.pc.iceConnectionState);
      }
    };
  }

  public setOnCandidate(callback: (candidate: RTCIceCandidate) => void): void {
    this.onIceCandidateCallback = callback;
  }

  public setOnStateChange(callback: (state: RTCIceConnectionState) => void): void {
    this.onIceStateChangeCallback = callback;
  }

  /**
   * Add ICE candidate to peer connection or buffer if remote description is not set yet
   */
  public async addIceCandidate(candidateInit: RTCIceCandidateInit): Promise<void> {
    try {
      if (this.pc.remoteDescription && this.pc.remoteDescription.type) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } else {
        this.candidateBuffer.push(candidateInit);
      }
    } catch (err) {
      console.error('Failed to add ICE candidate:', err);
    }
  }

  /**
   * Flush buffered candidates after remote description is set
   */
  public async processBufferedCandidates(): Promise<void> {
    if (!this.pc.remoteDescription) return;

    while (this.candidateBuffer.length > 0) {
      const candidateInit = this.candidateBuffer.shift();
      if (candidateInit) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        } catch (err) {
          console.error('Failed to add buffered ICE candidate:', err);
        }
      }
    }
  }

  public clearBuffer(): void {
    this.candidateBuffer = [];
  }
}
