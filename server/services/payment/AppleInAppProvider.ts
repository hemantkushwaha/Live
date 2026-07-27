import {
  PaymentProvider,
  CreateGatewayOrderParams,
  GatewayOrderResult,
  VerifyGatewayPaymentParams,
  VerifyGatewayResult,
} from './PaymentProvider';

export class AppleInAppProvider implements PaymentProvider {
  public getProviderId(): string {
    return 'apple_pay';
  }

  public async createOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult> {
    const gatewayOrderId = `iap_apple_${Date.now()}`;
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
