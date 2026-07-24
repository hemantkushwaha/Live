/**
 * Factory for creating configured RTCPeerConnection instances
 */
export class ConnectionFactory {
  public static readonly DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  public static createPeerConnection(customConfig?: RTCConfiguration): RTCPeerConnection {
    const config: RTCConfiguration = {
      iceServers: ConnectionFactory.DEFAULT_ICE_SERVERS,
      iceCandidatePoolSize: 10,
      ...customConfig,
    };

    return new RTCPeerConnection(config);
  }
}
