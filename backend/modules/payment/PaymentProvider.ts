import type { FeatureContext } from '../../src/module-system/types';
import type { PayableResource } from '../../src/module-system/extension-points';
import type { PaymentStatus } from './types';

export interface PaymentSession {
  id: string;
  resourceType: string;
  resourceId: string;
  providerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  expiresAt?: Date;
  paymentReference?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  sessionId: string;
  transactionId?: string;
  error?: string;
  /** Gesetzt wenn eine PayableResource benachrichtigt werden soll. */
  outcome?: 'completed' | 'failed' | 'cancelled' | 'timeout' | 'refunded';
  resourceType?: string;
  resourceId?: string;
  providerId?: string;
  amountCents?: number;
  failureReason?: string;
  replay?: boolean;
  externalEventId?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface ProviderHealthResult {
  ok: boolean;
  message?: string;
  configValid?: boolean;
  apiReachable?: boolean;
  webhookValid?: boolean;
  sandboxReachable?: boolean;
}

export interface PaymentProvider {
  readonly id: string;
  readonly name: string;
  /** Vollständig implementiert (false = Platzhalter, nie als aktiv zählbar). */
  readonly implemented: boolean;

  isConfigured(config: Record<string, unknown>): boolean;

  supports(feature: string): boolean;

  createCheckoutSession(
    context: FeatureContext,
    resource: PayableResource
  ): Promise<PaymentSession>;

  cancelCheckoutSession(
    context: FeatureContext,
    sessionId: string
  ): Promise<PaymentSession>;

  verifyWebhookSignature(
    context: FeatureContext,
    payload: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<{ valid: boolean; error?: string; eventId?: string; eventType?: string }>;

  handleWebhook(
    context: FeatureContext,
    payload: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<PaymentResult>;

  refund(
    context: FeatureContext,
    transactionId: string,
    amountCents?: number
  ): Promise<RefundResult>;

  healthCheck(context: FeatureContext): Promise<ProviderHealthResult>;
}

export const PAYMENT_FEATURES = {
  CHECKOUT: 'checkout',
  WEBHOOK: 'webhook',
  REFUND: 'refund',
  CANCEL: 'cancel',
  RETRY: 'retry',
} as const;
