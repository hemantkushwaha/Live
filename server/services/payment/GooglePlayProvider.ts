import {
  PaymentProvider,
  CreateGatewayOrderParams,
  GatewayOrderResult,
  VerifyGatewayPaymentParams,
  VerifyGatewayResult,
} from './PaymentProvider';

export class GooglePlayProvider implements PaymentProvider {
  public getProviderId(): string {
    return 'google_play';
  }

  public async createOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult> {
    const gatewayOrderId = `gplay_order_${Date.now()}`;
    return {
      gatewayOrderId,
      amount: params.amount,
      currency: params.currency,
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
