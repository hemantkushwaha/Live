export interface CreateGatewayOrderParams {
  orderId: string;
  amount: number; // in standard units or paise depending on gateway
  currency: string;
  userId: string;
  description?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface GatewayOrderResult {
  gatewayOrderId: string;
  amount: number;
  currency: string;
  provider: string;
  rawResponse?: any;
}

export interface VerifyGatewayPaymentParams {
  orderId: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature?: string;
  payload?: any;
}

export interface VerifyGatewayResult {
  verified: boolean;
  gatewayPaymentId: string;
  gatewayOrderId: string;
  amount?: number;
  currency?: string;
  status: 'captured' | 'failed';
  errorReason?: string;
}

export interface RefundGatewayParams {
  paymentId: string;
  gatewayPaymentId: string;
  amount: number;
  currency: string;
  reason: string;
}

export interface RefundGatewayResult {
  success: boolean;
  gatewayRefundId: string;
  status: 'completed' | 'failed';
  message?: string;
}

export interface PaymentProvider {
  getProviderId(): string;
  createOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult>;
  verifyPayment(params: VerifyGatewayPaymentParams): Promise<VerifyGatewayResult>;
  processRefund?(params: RefundGatewayParams): Promise<RefundGatewayResult>;
}
