import { PeerConnectionManager } from './PeerConnectionManager';

/**
 * Registry to manage active RTCPeerConnection instances.
 * Rule: Host may have multiple viewers. Each viewer has one PeerConnection. One PeerConnection per Viewer.
 */
export class ConnectionRegistry {
  private connections: Map<string, PeerConnectionManager> = new Map();

  /**
   * Register a new peer connection manager for a given peerId
   */
  public register(peerId: string, manager: PeerConnectionManager): void {
    if (this.connections.has(peerId)) {
      this.close(peerId);
    }
    this.connections.set(peerId, manager);
  }

  /**
   * Retrieve manager by peerId
   */
  public get(peerId: string): PeerConnectionManager | undefined {
    return this.connections.get(peerId);
  }

  /**
   * Check if peer connection exists
   */
  public has(peerId: string): boolean {
    return this.connections.has(peerId);
  }

  /**
   * Close and remove connection for a peer
   */
  public close(peerId: string): void {
    const manager = this.connections.get(peerId);
    if (manager) {
      manager.close();
      this.connections.delete(peerId);
    }
  }

  /**
   * Close all active connections
   */
  public closeAll(): void {
    for (const [peerId, manager] of this.connections.entries()) {
      manager.close();
    }
    this.connections.clear();
  }

  /**
   * Get list of all registered peer IDs
   */
  public getPeerIds(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Number of active connections
   */
  public get size(): number {
    return this.connections.size;
  }
}
