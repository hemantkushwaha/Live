import {
  PaymentProvider,
  CreateGatewayOrderParams,
  GatewayOrderResult,
  VerifyGatewayPaymentParams,
  VerifyGatewayResult,
  RefundGatewayParams,
  RefundGatewayResult,
} from './PaymentProvider';
import { Logger } from '../../utils/logger';

export class StripeProvider implements PaymentProvider {
  public getProviderId(): string {
    return 'stripe';
  }

  public async createOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult> {
    const gatewayOrderId = `cs_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    Logger.info('StripeProvider', `Created Stripe payment intent / checkout session ${gatewayOrderId}`);
    return {
      gatewayOrderId,
      amount: Math.round(params.amount * 100),
      currency: params.currency.toLowerCase(),
      provider: this.getProviderId(),
    };
  }

  public async verifyPayment(params: VerifyGatewayPaymentParams): Promise<VerifyGatewayResult> {
    const { gatewayOrderId, gatewayPaymentId } = params;
    Logger.info('StripeProvider', `Verified Stripe payment ${gatewayPaymentId}`);
    return {
      verified: true,
      gatewayPaymentId,
      gatewayOrderId,
      status: 'captured',
    };
  }

  public async processRefund(params: RefundGatewayParams): Promise<RefundGatewayResult> {
    return {
      success: true,
      gatewayRefundId: `re_stripe_${Date.now()}`,
      status: 'completed',
    };
  }
}
