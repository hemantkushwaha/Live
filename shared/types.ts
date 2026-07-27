/**
 * Shared Data Models and Interfaces for LiveConnect
 */

export type UserStatus = 'idle' | 'streaming' | 'watching' | 'in_private_call';

export interface User {
  id: string;
  email: string;
  username: string;
  status: UserStatus;
  role?: string;
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
  chartData?: EarningsChartPoint[];
  timeframe: AnalyticsTimeframe;
}

export type CreatorAnalyticsData = CreatorDashboardData;

export interface CreatorProfile {
  id: string; // Creator User ID
  displayName: string;
  username: string;
  avatar: string;
  coverImage: string;
  bio: string;
  country: string;
  languages: string[];
  categories: string[];
  isOnline: boolean;
  isVerified: boolean;
  isLive?: boolean;
  liveStreamId?: string;
  createdAt: number;
}

export interface CreatorProfileStats {
  followersCount: number;
  followingCount: number;
  totalStreams: number;
  totalViewers: number;
  totalLikes: number;
  totalGifts: number;
  totalTips: number;
  totalEarnings: number;
}

export interface CreatorProfileFull extends CreatorProfile {
  stats: CreatorProfileStats;
  isFollowing?: boolean;
}

export interface FollowRecord {
  id: string;
  followerId: string;
  creatorId: string;
  createdAt: number;
}

export interface CreatorDiscoveryPayload {
  trending: CreatorProfileFull[];
  online: CreatorProfileFull[];
  recentlyLive: CreatorProfileFull[];
  newest: CreatorProfileFull[];
  categories: string[];
  totalCreators: number;
}

export interface MediaMetadata {
  id: string;
  ownerId: string;
  provider: 'cloudinary' | 's3' | 'local';
  url: string;
  secureUrl: string;
  width?: number;
  height?: number;
  fileSize: number;
  mimeType: string;
  createdAt: number;
}

// ==========================================
// EWO-024: Payment & Coin Purchase Data Models
// ==========================================

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins?: number;
  price: number; // In minor units (e.g. cents/paise) or standard float
  currency: string; // 'INR', 'USD', etc.
  badge?: string; // e.g. 'Popular', 'Best Value'
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export type PaymentOrderStatus =
  | 'created'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface PaymentOrder {
  id: string;
  userId: string;
  packageId: string;
  coins: number;
  amount: number;
  currency: string;
  provider: string; // 'razorpay', 'stripe', 'paypal', 'google_play', 'apple_pay'
  status: PaymentOrderStatus;
  gatewayOrderId?: string;
  idempotencyKey?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  gatewayPaymentId: string;
  gatewayOrderId?: string;
  gatewaySignature?: string;
  provider: string;
  amount: number;
  currency: string;
  coinsCredited: number;
  status: 'captured' | 'failed' | 'refunded';
  receiptNumber: string;
  createdAt: number;
}

export interface PaymentEvent {
  id: string;
  orderId?: string;
  paymentId?: string;
  userId?: string;
  provider: string;
  eventType: string; // 'order.created', 'payment.authorized', 'payment.captured', 'payment.failed', 'refund.processed'
  payload: Record<string, any>;
  timestamp: number;
}

export interface Refund {
  id: string;
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  reason: string;
  gatewayRefundId?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: number;
}

export interface PaymentReceipt {
  paymentId: string;
  gatewayOrderId: string;
  gatewayTransactionId: string;
  amount: number;
  currency: string;
  coinsPurchased: number;
  timestamp: number;
  status: string;
  userWalletBalanceAfter?: number;
}

// ==========================================
// EWO-025: Creator Withdrawals & Financial Ledger Data Models
// ==========================================

export interface CreatorEarnings {
  creatorId: string;
  totalEarned: number; // Cumulative coins earned
  withdrawableBalance: number; // Current withdrawable coins balance
  totalWithdrawn: number; // Total coins withdrawn
  pendingWithdrawal: number; // Coins locked in pending withdrawal requests
  currency: string; // 'COIN'
  lastUpdated: number;
}

export type LedgerTransactionType =
  | 'coin_purchase'
  | 'gift_sent'
  | 'gift_received'
  | 'tip_sent'
  | 'tip_received'
  | 'private_call_payment'
  | 'platform_commission'
  | 'creator_earnings'
  | 'withdrawal_request'
  | 'withdrawal_approved'
  | 'withdrawal_rejected';

export interface FinancialLedgerEntry {
  id: string;
  transactionType: LedgerTransactionType;
  userId: string; // Actor / Creator / Viewer
  creatorId?: string;
  sourceId?: string; // giftId, tipId, callSessionId, withdrawalRequestId, orderId
  amount: number;
  currency: string; // 'COIN', 'INR', 'USD'
  direction: 'credit' | 'debit';
  balanceAfter?: number;
  description: string;
  metadata?: Record<string, any>;
  createdAt: number; // Immutable timestamp
}

export type WithdrawalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'failed';

export interface WithdrawalRequest {
  id: string;
  creatorId: string;
  creatorName?: string;
  amount: number; // In Coins
  currency: string; // 'COIN'
  conversionRate: number; // e.g. 0.8 INR per Coin
  payoutAmount: number; // In fiat (e.g., INR)
  paymentMethod: 'bank_transfer' | 'upi' | 'paypal';
  payoutDetails: {
    bankAccount?: string;
    ifsc?: string;
    accountHolder?: string;
    upiId?: string;
    paypalEmail?: string;
  };
  status: WithdrawalStatus;
  adminRemarks?: string;
  processedBy?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WithdrawalTransaction {
  id: string;
  requestId: string;
  creatorId: string;
  amount: number;
  currency: string;
  payoutAmount: number;
  status: WithdrawalStatus;
  transactionRef: string;
  processedAt: number;
}

export interface RevenueShareRule {
  id: string;
  category: 'gift' | 'tip' | 'private_call' | 'default';
  creatorPercentage: number; // e.g., 80
  platformPercentage: number; // e.g., 20
  description?: string;
  updatedAt: number;
}

export interface SettlementHistory {
  id: string;
  creatorId: string;
  withdrawalRequestId: string;
  amount: number;
  currency: string;
  payoutAmount: number;
  settledAt: number;
  adminUserId: string;
  remarks?: string;
}

export interface CreatorFinancialSummary {
  earnings: CreatorEarnings;
  revenueShareRules: RevenueShareRule[];
  recentLedgerEntries: FinancialLedgerEntry[];
  withdrawalHistory: WithdrawalRequest[];
  minWithdrawalAmount: number; // e.g., 500 Coins
  coinToFiatRate: number; // e.g., 0.8
}



