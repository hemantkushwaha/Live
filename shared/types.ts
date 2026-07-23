/**
 * Shared Data Models and Interfaces for LiveConnect
 */

export type UserStatus = 'idle' | 'streaming' | 'watching' | 'in_private_call';

export interface User {
  id: string;
  email: string;
  username: string;
  status: UserStatus;
  socketId?: string;
  connectedAt: number;
}

export interface StreamRoom {
  id: string; // usually streamer's userId
  streamerId: string;
  streamerName: string;
  streamerEmail: string;
  title: string;
  viewers: string[]; // array of viewer userIds
  isPausedForPrivate: boolean; // true when streamer is temporarily in 1-on-1 private call
  createdAt: number;
}

export type CallRequestStatus = 'pending' | 'accepted' | 'rejected' | 'canceled' | 'expired';

export interface PrivateCallRequest {
  id: string;
  streamerId: string;
  viewerId: string;
  viewerName: string;
  viewerEmail: string;
  status: CallRequestStatus;
  createdAt: number;
}

export interface CallSession {
  id: string;
  streamerId: string;
  viewerId: string;
  startedAt: number;
  active: boolean;
}

export interface WebRTCSignalPayload {
  targetUserId: string;
  senderUserId: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  streamId?: string;
  context: 'broadcast' | 'private_call';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
