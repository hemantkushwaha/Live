import { PaymentProvider } from './payment/PaymentProvider';
import { RazorpayProvider } from './payment/RazorpayProvider';
import { StripeProvider } from './payment/StripeProvider';
import { PayPalProvider } from './payment/PayPalProvider';
import { GooglePlayProvider } from './payment/GooglePlayProvider';
import { AppleInAppProvider } from './payment/AppleInAppProvider';
import { paymentRepository } from '../repositories/paymentRepository';
import { PaymentOrder, Payment, PaymentEvent, Refund } from '../../shared/types';
import { Logger } from '../utils/logger';

export class PaymentService {
  private static instance: PaymentService;
  private providers: Map<string, PaymentProvider> = new Map();

  private constructor() {
    this.registerProviders();
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  private registerProviders(): void {
    const razorpay = new RazorpayProvider();
    const stripe = new StripeProvider();
    const paypal = new PayPalProvider();
    const googlePlay = new GooglePlayProvider();
    const appleInApp = new AppleInAppProvider();

    this.providers.set(razorpay.getProviderId(), razorpay);
    this.providers.set(stripe.getProviderId(), stripe);
    this.providers.set(paypal.getProviderId(), paypal);
    this.providers.set(googlePlay.getProviderId(), googlePlay);
    this.providers.set(appleInApp.getProviderId(), appleInApp);

    Logger.info(
      'PaymentService',
      `Registered payment providers: ${Array.from(this.providers.keys()).join(', ')}`
    );
  }

  public getProvider(providerId: string = 'razorpay'): PaymentProvider {
    const provider = this.providers.get(providerId.toLowerCase());
    if (!provider) {
      throw new Error(`Unsupported payment provider: ${providerId}`);
    }
    return provider;
  }

  /**
   * Log an event to PaymentEvents
   */
  public recordEvent(
    provider: string,
    eventType: string,
    payload: Record<string, any>,
    orderId?: string,
    paymentId?: string,
    userId?: string
  ): PaymentEvent {
    const event: PaymentEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId,
      paymentId,
      userId,
      provider,
      eventType,
      payload,
      timestamp: Date.now(),
    };
    return paymentRepository.recordEvent(event);
  }

  /**
   * Process a refund for a payment
   */
  public async processRefund(
    paymentId: string,
    userId: string,
    reason: string
  ): Promise<Refund> {
    const payment = paymentRepository.getPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    if (payment.userId !== userId) {
      throw new Error('Unauthorized refund request');
    }

    if (payment.status === 'refunded') {
      const existing = paymentRepository.getRefundByPaymentId(paymentId);
      if (existing) return existing;
    }

    const provider = this.getProvider(payment.provider);
    let gatewayRefundId = `rfnd_${Date.now()}`;

    if (provider.processRefund) {
      const res = await provider.processRefund({
        paymentId: payment.id,
        gatewayPaymentId: payment.gatewayPaymentId,
        amount: payment.amount,
        currency: payment.currency,
        reason,
      });
      gatewayRefundId = res.gatewayRefundId;
    }

    payment.status = 'refunded';
    paymentRepository.savePayment(payment);

    const refund: Refund = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      paymentId: payment.id,
      orderId: payment.orderId,
      userId,
      amount: payment.amount,
      reason,
      gatewayRefundId,
      status: 'completed',
      createdAt: Date.now(),
    };

    paymentRepository.saveRefund(refund);

    this.recordEvent(
      payment.provider,
      'refund.processed',
      { paymentId, amount: payment.amount, reason },
      payment.orderId,
      payment.id,
      userId
    );

    return refund;
  }
}

export const paymentService = PaymentService.getInstance();
