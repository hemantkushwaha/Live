import {
  CoinPackage,
  PaymentOrder,
  Payment,
  PaymentEvent,
  Refund,
} from '../../shared/types';
import { Logger } from '../utils/logger';

export class PaymentRepository {
  private static instance: PaymentRepository;

  private coinPackages: Map<string, CoinPackage> = new Map();
  private paymentOrders: Map<string, PaymentOrder> = new Map();
  private payments: Map<string, Payment> = new Map();
  private paymentEvents: Map<string, PaymentEvent[]> = new Map();
  private refunds: Map<string, Refund> = new Map();
  private idempotencyKeys: Map<string, string> = new Map(); // key -> orderId

  private constructor() {
    this.seedDefaultCoinPackages();
  }

  public static getInstance(): PaymentRepository {
    if (!PaymentRepository.instance) {
      PaymentRepository.instance = new PaymentRepository();
    }
    return PaymentRepository.instance;
  }

  /**
   * Seed default Coin Packages
   */
  private seedDefaultCoinPackages(): void {
    const now = Date.now();
    const defaultPackages: CoinPackage[] = [
      {
        id: 'pkg_100',
        name: 'Starter Pack',
        coins: 100,
        bonusCoins: 0,
        price: 80, // INR ₹80 ($0.99)
        currency: 'INR',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pkg_500',
        name: 'Booster Pack',
        coins: 500,
        bonusCoins: 25,
        price: 400, // INR ₹400 ($4.99)
        currency: 'INR',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pkg_1000',
        name: 'Popular Pack',
        coins: 1000,
        bonusCoins: 100,
        price: 800, // INR ₹800 ($9.99)
        currency: 'INR',
        badge: 'Most Popular',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pkg_2500',
        name: 'Super Pack',
        coins: 2500,
        bonusCoins: 300,
        price: 2000, // INR ₹2000 ($24.99)
        currency: 'INR',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pkg_5000',
        name: 'VIP Pack',
        coins: 5000,
        bonusCoins: 750,
        price: 4000, // INR ₹4000 ($49.99)
        currency: 'INR',
        badge: 'Best Value',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pkg_10000',
        name: 'Ultimate Pack',
        coins: 10000,
        bonusCoins: 2000,
        price: 8000, // INR ₹8000 ($99.99)
        currency: 'INR',
        badge: 'Mega Bonus',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    defaultPackages.forEach((pkg) => {
      this.coinPackages.set(pkg.id, pkg);
    });
    Logger.info('PaymentRepository', `Initialized ${defaultPackages.length} default coin packages`);
  }

  // --- Coin Packages ---
  public getCoinPackages(activeOnly: boolean = true): CoinPackage[] {
    const pkgs = Array.from(this.coinPackages.values());
    return activeOnly ? pkgs.filter((p) => p.active) : pkgs;
  }

  public getCoinPackageById(id: string): CoinPackage | undefined {
    return this.coinPackages.get(id);
  }

  public saveCoinPackage(pkg: CoinPackage): CoinPackage {
    this.coinPackages.set(pkg.id, pkg);
    return pkg;
  }

  // --- Payment Orders ---
  public saveOrder(order: PaymentOrder): PaymentOrder {
    this.paymentOrders.set(order.id, order);
    if (order.idempotencyKey) {
      this.idempotencyKeys.set(order.idempotencyKey, order.id);
    }
    return order;
  }

  public getOrderById(orderId: string): PaymentOrder | undefined {
    return this.paymentOrders.get(orderId);
  }

  public getOrderByGatewayOrderId(gatewayOrderId: string): PaymentOrder | undefined {
    for (const order of this.paymentOrders.values()) {
      if (order.gatewayOrderId === gatewayOrderId) {
        return order;
      }
    }
    return undefined;
  }

  public getOrderByIdempotencyKey(key: string): PaymentOrder | undefined {
    const orderId = this.idempotencyKeys.get(key);
    if (orderId) {
      return this.getOrderById(orderId);
    }
    return undefined;
  }

  public getOrdersByUserId(userId: string): PaymentOrder[] {
    return Array.from(this.paymentOrders.values())
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // --- Payments ---
  public savePayment(payment: Payment): Payment {
    this.payments.set(payment.id, payment);
    return payment;
  }

  public getPaymentById(paymentId: string): Payment | undefined {
    return this.payments.get(paymentId);
  }

  public getPaymentByOrderId(orderId: string): Payment | undefined {
    for (const payment of this.payments.values()) {
      if (payment.orderId === orderId && payment.status === 'captured') {
        return payment;
      }
    }
    return undefined;
  }

  public getPaymentByGatewayPaymentId(gatewayPaymentId: string): Payment | undefined {
    for (const payment of this.payments.values()) {
      if (payment.gatewayPaymentId === gatewayPaymentId) {
        return payment;
      }
    }
    return undefined;
  }

  public getPaymentsByUserId(userId: string): Payment[] {
    return Array.from(this.payments.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // --- Payment Events ---
  public recordEvent(event: PaymentEvent): PaymentEvent {
    const orderKey = event.orderId || 'global';
    let list = this.paymentEvents.get(orderKey);
    if (!list) {
      list = [];
      this.paymentEvents.set(orderKey, list);
    }
    list.push(event);
    return event;
  }

  public getEventsByOrderId(orderId: string): PaymentEvent[] {
    return this.paymentEvents.get(orderId) || [];
  }

  // --- Refunds ---
  public saveRefund(refund: Refund): Refund {
    this.refunds.set(refund.id, refund);
    return refund;
  }

  public getRefundByPaymentId(paymentId: string): Refund | undefined {
    for (const r of this.refunds.values()) {
      if (r.paymentId === paymentId) {
        return r;
      }
    }
    return undefined;
  }
}

export const paymentRepository = PaymentRepository.getInstance();
