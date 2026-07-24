import { ICEHandler } from './ICEHandler';

/**
 * SDP Handler for managing Session Description Protocol (SDP) offer/answer exchanges
 */
export class SDPHandler {
  private pc: RTCPeerConnection;
  private iceHandler: ICEHandler;

  constructor(pc: RTCPeerConnection, iceHandler: ICEHandler) {
    this.pc = pc;
    this.iceHandler = iceHandler;
  }

  /**
   * Create an SDP offer and set local description
   */
  public async createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
    try {
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
        ...options,
      });
      await this.pc.setLocalDescription(offer);
      return offer;
    } catch (err: any) {
      throw new Error(`Offer Failure: ${err.message || 'Failed to create SDP offer'}`);
    }
  }

  /**
   * Create an SDP answer and set local description
   */
  public async createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit> {
    try {
      const answer = await this.pc.createAnswer(options);
      await this.pc.setLocalDescription(answer);
      return answer;
    } catch (err: any) {
      throw new Error(`Answer Failure: ${err.message || 'Failed to create SDP answer'}`);
    }
  }

  /**
   * Set remote description and flush buffered ICE candidates
   */
  public async handleRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(description));
      await this.iceHandler.processBufferedCandidates();
    } catch (err: any) {
      throw new Error(`Remote Description Failure: ${err.message || 'Failed to set remote description'}`);
    }
  }
}
