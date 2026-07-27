import {
  PaymentProvider,
  CreateGatewayOrderParams,
  GatewayOrderResult,
  VerifyGatewayPaymentParams,
  VerifyGatewayResult,
} from './PaymentProvider';

export class PayPalProvider implements PaymentProvider {
  public getProviderId(): string {
    return 'paypal';
  }

  public async createOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult> {
    const gatewayOrderId = `PP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return {
      gatewayOrderId,
      amount: params.amount,
      currency: params.currency.toUpperCase(),
      provider: this.getProviderId(),
    };
  }

  public async verifyPayment(params: VerifyGatewayPaymentParams): Promise<VerifyGatewayResult> {
    return {
      verified: true,
      gatewayPaymentId: params.gatewayPaymentId,
      gatewayOrderId: params.gatewayOrderId,
      status: 'captured',
    };
  }
}
