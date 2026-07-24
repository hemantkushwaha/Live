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

export interface PrivateCallSettings {
  creatorId: string;
  enabled: boolean;
  minCoins: number;
  pricePerMinute: number;
  maxDuration: number;
  busyMode: boolean;
}

export interface CreatorSettings {
  creatorId: string;
  privateCallPrice: number; // Price or tokens required for private call
  minTipRequirement: number; // Minimum total tip required to send private call request
  maxCallDuration: number; // Maximum duration in minutes
  autoReject: boolean;
  offlineMode: boolean;
}

export interface GiftItem {
  id: string;
  name: string;
  icon: string; // Emoji or icon code
  price: number;
}

export interface TipGiftRecord {
  id: string;
  streamId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  receiverId: string;
  amount: number;
  type: 'tip' | 'gift';
  giftName?: string;
  giftIcon?: string;
  message?: string;
  createdAt: number;
}

export type TransactionType =
  | 'Credit'
  | 'Debit'
  | 'Recharge'
  | 'Reserved'
  | 'Gift'
  | 'Tip'
  | 'Private Call';

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  timestamp: number;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
}

export interface UserWallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: number;
  updatedAt: number;
  totalTipsSent: number;
  totalTipsReceived: number;
}

export interface StreamRoom {
  id: string; // usually streamer's userId
  streamerId: string;
  streamerName: string;
  streamerEmail: string;
  title: string;
  viewers: string[]; // array of viewer userIds
  peakViewers?: number;
  isPausedForPrivate: boolean; // true when streamer is temporarily in 1-on-1 private call
  createdAt: number;
}

export type CallRequestStatus =
  | 'Pending'
  | 'Cancelled'
  | 'Expired'
  | 'Accepted'
  | 'Rejected'
  | 'pending'
  | 'cancelled'
  | 'expired'
  | 'accepted'
  | 'rejected';

export interface PrivateCallRequest {
  id: string;
  streamId: string;
  creatorId: string;
  streamerId: string;
  viewerId: string;
  viewerName?: string;
  viewerEmail: string;
  status: CallRequestStatus;
  requestedAt: number;
  createdAt: number;
  requestedDuration: number;
  estimatedCost: number;
}

export type PrivateSessionState = 'Connecting' | 'Active' | 'Warning' | 'Ending' | 'Completed';

export interface CallSession {
  id: string;
  requestId?: string;
  streamId: string;
  creatorId: string;
  streamerId?: string;
  viewerId: string;
  viewerName?: string;
  creatorName?: string;
  ratePerMinute?: number;
  durationMinutes?: number;
  maxDurationSeconds?: number;
  startedAt: number;
  endedAt?: number;
  status: 'active' | 'ended' | 'completed';
  state?: PrivateSessionState;
  active: boolean;
  coinsPaid?: number;
  creatorEarned?: number;
  elapsedTimeSeconds?: number;
  remainingTimeSeconds?: number;
}

export interface CallSessionSummary {
  sessionId: string;
  requestId?: string;
  streamId: string;
  creatorId: string;
  creatorName?: string;
  viewerId: string;
  viewerName?: string;
  durationSeconds: number;
  coinsPaid: number;
  creatorEarned: number;
  ratePerMinute: number;
  startedAt: number;
  endedAt: number;
  endReason: 'completed' | 'user_ended' | 'low_balance' | 'timeout' | 'disconnected';
}

export interface WebRTCSignalPayload {
  targetUserId: string;
  senderUserId: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  streamId?: string;
  context: 'broadcast' | 'private_call';
}

export interface PresenceUser {
  userId: string;
  email: string;
  username: string;
  socketId: string;
  connectedAt: number;
  lastSeen: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export type AnalyticsTimeframe = 'today' | '7d' | '30d' | 'all';

export interface RevenueCardsData {
  today: number;
  weekly: number;
  monthly: number;
  lifetime: number;
  walletBalance: number;
}

export interface AnalyticsSummary {
  totalGiftsCoins: number;
  totalGiftsCount: number;
  totalTipsCoins: number;
  totalTipsCount: number;
  privateCallCoins: number;
  privateCallCount: number;
  privateCallMinutes: number;
  totalSessions: number;
  avgSessionTimeMinutes: number;
  peakViewers: number;
}

export interface TopSupporter {
  viewerId: string;
  viewerName: string;
  totalCoinsSpent: number;
  giftsSentCount: number;
  privateCallsCount: number;
  lastActive: number;
}

export interface EarningsChartPoint {
  timestamp: number;
  date: string;
  label: string;
  gifts: number;
  tips: number;
  privateCalls: number;
  total: number;
}

export interface CreatorDashboardData {
  revenue: RevenueCardsData;
  summary: AnalyticsSummary;
  recentTransactions: WalletTransaction[];
  topSupporters: TopSupporter[];
  timeframe: AnalyticsTimeframe;
}

export interface CreatorAnalyticsData {
  timeframe: AnalyticsTimeframe;
  revenue: RevenueCardsData;
  summary: AnalyticsSummary;
  chartData: EarningsChartPoint[];
  topSupporters: TopSupporter[];
}

