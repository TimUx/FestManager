/**
 * Abstrakte zahlbare Ressource – Payment-Modul kennt keine Bestellungen.
 * Andere Domänen (Orders, Tickets, Spenden) registrieren Adapter.
 */
export interface PayableResource {
  type: string;
  id: string;
  amountCents: number;
  currency: string;
  description: string;
  customerEmail?: string;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface PayableResourceAdapter {
  readonly type: string;
  toPayableResource(id: string, baseUrl: string): Promise<PayableResource | null>;
  onPaymentCompleted(id: string): Promise<void>;
  onPaymentFailed(id: string): Promise<void>;
  onPaymentCancelled?(id: string): Promise<void>;
}

export type PaymentStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_PAID'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED'
  | 'PAYMENT_TIMEOUT'
  | 'PAYMENT_REFUNDED'
  | 'ORDER_CONFIRMED'
  | 'IN_KITCHEN'
  | 'READY'
  | 'COLLECTED';

/** Öffentliches Checkout-Ergebnis – ohne Provider-Informationen. */
export interface PaymentCheckoutResult {
  sessionId: string;
  checkoutUrl: string;
  expiresAt?: string;
  paymentReference?: string;
  paymentStatus: PaymentStatus;
  amount: number;
  currency: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentMethodInfo {
  displayName: string;
  description: string;
  supportedPaymentMethods: string[];
  checkoutType: 'redirect' | 'embedded' | 'offline';
  icon?: string;
  sortOrder: number;
  recommended?: boolean;
  providerId: string;
}

export interface PaymentStatusResult {
  sessionId: string;
  paymentStatus: PaymentStatus;
  amount: number;
  currency: string;
  resourceType: string;
  resourceId: string;
  checkoutUrl?: string;
  expiresAt?: string;
  paidAt?: string;
  releasedToKitchen: boolean;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
  replay?: boolean;
  eventId?: string;
  eventType?: string;
}

export interface PaymentService {
  isAvailable(): Promise<boolean>;
  getAvailablePaymentMethods(): Promise<PaymentMethodInfo[]>;
  createCheckout(resource: PayableResource, providerId?: string): Promise<PaymentCheckoutResult | null>;
  cancelCheckout(sessionId: string): Promise<PaymentCheckoutResult>;
  retryCheckout(sessionId: string): Promise<PaymentCheckoutResult | null>;
  getPaymentStatus(sessionId: string): Promise<PaymentStatusResult | null>;
  verifyWebhook(
    providerId: string,
    payload: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookVerificationResult>;
  refund(providerId: string, transactionId: string, amountCents?: number): Promise<RefundResult>;
  supports(feature: string): boolean;
  healthCheck(): Promise<Record<string, { ok: boolean; message?: string }>>;
  isResourceReleased(type: string, id: string): Promise<boolean>;
  filterReleasedIds(type: string, ids: string[]): Promise<string[]>;
}
