import Stripe from 'stripe';
import type { FeatureContext } from '../../../src/platform/module-api';
import type { PayableResource } from '../../../src/platform/module-api';
import type {
  PaymentProvider,
  PaymentResult,
  PaymentSession,
  RefundResult,
  ProviderHealthResult,
} from '../PaymentProvider';
import { PAYMENT_FEATURES } from '../PaymentProvider';
import type { PaymentConfig } from '../config';
import { decryptSecret } from '../services/EncryptionService';
import { paymentRepository } from '../repositories/paymentRepository';
import { paymentAuditRepository } from '../repositories/paymentAuditRepository';
import { paymentLogger } from '../services/PaymentLogger';
import { logger } from '../../../src/utils/logger';

const CHECKOUT_EXPIRY_HOURS = 24;

export class StripeProvider implements PaymentProvider {
  readonly id = 'stripe';
  readonly name = 'Stripe';
  readonly implemented = true;

  supports(feature: string): boolean {
    const features: string[] = [
      PAYMENT_FEATURES.CHECKOUT,
      PAYMENT_FEATURES.WEBHOOK,
      PAYMENT_FEATURES.REFUND,
      PAYMENT_FEATURES.CANCEL,
      PAYMENT_FEATURES.RETRY,
    ];
    return features.includes(feature);
  }

  private getStripeConfig(config: PaymentConfig) {
    return config.stripe;
  }

  isConfigured(config: Record<string, unknown>): boolean {
    const c = config as PaymentConfig;
    const s = this.getStripeConfig(c);
    return Boolean(s?.enabled && s.secretKey && s.publishableKey);
  }

  private getClient(config: PaymentConfig): Stripe {
    const s = this.getStripeConfig(config)!;
    const secretKey = decryptSecret(s.secretKey!);
    return new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createCheckoutSession(
    context: FeatureContext,
    params: PayableResource
  ): Promise<PaymentSession> {
    const config = await context.getConfig<PaymentConfig>('payment');
    const stripe = this.getClient(config);

    const expiresAt = new Date(Date.now() + CHECKOUT_EXPIRY_HOURS * 60 * 60 * 1000);

    const sessionId = await paymentRepository.createPayment({
      resourceType: params.type,
      resourceId: params.id,
      providerId: this.id,
      amountCents: params.amountCents,
      currency: params.currency,
      expiresAt,
      metadata: params.metadata,
    });

    await paymentRepository.updatePayment(sessionId, { paymentStatus: 'PAYMENT_PENDING' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      line_items: [{
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: params.amountCents,
          product_data: { name: params.description },
        },
        quantity: 1,
      }],
      customer_email: params.customerEmail,
      success_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        payableResourceType: params.type,
        payableResourceId: params.id,
        internalSessionId: sessionId,
        ...params.metadata,
      },
    });

    await paymentRepository.updatePayment(sessionId, {
      externalSessionId: session.id,
      checkoutReference: session.id,
      paymentReference: sessionId,
    });

    return {
      id: sessionId,
      resourceType: params.type,
      resourceId: params.id,
      providerId: this.id,
      amount: params.amountCents / 100,
      currency: params.currency,
      status: 'PAYMENT_PENDING',
      checkoutUrl: session.url ?? undefined,
      expiresAt,
      paymentReference: sessionId,
      metadata: params.metadata,
    };
  }

  async cancelCheckoutSession(context: FeatureContext, sessionId: string): Promise<PaymentSession> {
    const row = await paymentRepository.findById(sessionId);
    if (!row) throw new Error('Session nicht gefunden');

    const config = await context.getConfig<PaymentConfig>('payment');
    if (row.external_session_id) {
      try {
        const stripe = this.getClient(config);
        await stripe.checkout.sessions.expire(row.external_session_id);
      } catch (err) {
        paymentLogger.providerError(this.id, 'checkout_cancelled', 'Stripe Session expire fehlgeschlagen');
        logger.warn('Stripe cancel session failed', err);
      }
    }

    await paymentRepository.updatePayment(sessionId, {
      status: 'cancelled',
      paymentStatus: 'PAYMENT_CANCELLED',
    });

    return {
      id: sessionId,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      providerId: this.id,
      amount: row.amount_cents / 100,
      currency: row.currency,
      status: 'PAYMENT_CANCELLED',
    };
  }

  async verifyWebhookSignature(
    context: FeatureContext,
    payload: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<{ valid: boolean; error?: string; eventId?: string; eventType?: string }> {
    const config = await context.getConfig<PaymentConfig>('payment');
    const s = this.getStripeConfig(config)!;
    const stripe = this.getClient(config);
    const sig = headers['stripe-signature'];
    if (!sig || typeof sig !== 'string') {
      return { valid: false, error: 'Fehlende Signatur' };
    }

    const webhookSecret = decryptSecret(s.webhookSecret || '');
    if (!webhookSecret) {
      return { valid: false, error: 'Webhook nicht konfiguriert' };
    }

    try {
      const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
      return { valid: true, eventId: event.id, eventType: event.type };
    } catch {
      return { valid: false, error: 'Ungültige Signatur' };
    }
  }

  async handleWebhook(
    context: FeatureContext,
    payload: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<PaymentResult> {
    const verification = await this.verifyWebhookSignature(context, payload, headers);
    if (!verification.valid) {
      return { success: false, sessionId: '', error: verification.error };
    }

    const config = await context.getConfig<PaymentConfig>('payment');
    const stripe = this.getClient(config);
    const sig = headers['stripe-signature'] as string;
    const webhookSecret = decryptSecret(this.getStripeConfig(config)!.webhookSecret || '');
    const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status && session.payment_status !== 'paid') {
        return { success: true, sessionId: '', externalEventId: event.id };
      }

      const dbSession = await paymentRepository.findByExternalSessionId(session.id);
      if (!dbSession) {
        return { success: false, sessionId: '', error: 'Session nicht gefunden' };
      }

      await paymentRepository.updatePayment(dbSession.id, { paymentStatus: 'PAYMENT_PROCESSING' });

      await paymentRepository.createTransaction({
        paymentId: dbSession.id,
        provider: this.id,
        providerReference: session.payment_intent as string,
        checkoutReference: session.id,
        type: 'payment',
        status: 'completed',
        amountCents: dbSession.amount_cents,
        currency: dbSession.currency,
        paidAt: new Date(),
      });

      return {
        success: true,
        sessionId: dbSession.id,
        transactionId: session.payment_intent as string,
        outcome: 'completed',
        resourceType: dbSession.resource_type,
        resourceId: dbSession.resource_id,
        providerId: this.id,
        amountCents: dbSession.amount_cents,
        externalEventId: event.id,
      };
    }

    if (event.type === 'checkout.session.expired') {
      return this.handleSessionEnded(
        event.data.object as Stripe.Checkout.Session,
        'timeout',
        'abgelaufen',
        event.id
      );
    }

    if (event.type === 'checkout.session.async_payment_failed') {
      return this.handleSessionEnded(
        event.data.object as Stripe.Checkout.Session,
        'failed',
        'Zahlung fehlgeschlagen',
        event.id
      );
    }

    return { success: true, sessionId: '', externalEventId: event.id };
  }

  private async handleSessionEnded(
    session: Stripe.Checkout.Session,
    outcome: 'failed' | 'timeout' | 'cancelled',
    reason: string,
    eventId: string
  ): Promise<PaymentResult> {
    const dbSession = await paymentRepository.findByExternalSessionId(session.id);
    if (!dbSession) {
      return { success: true, sessionId: '' };
    }

    const paymentStatus = outcome === 'timeout' ? 'PAYMENT_TIMEOUT' : outcome === 'cancelled' ? 'PAYMENT_CANCELLED' : 'PAYMENT_FAILED';
    await paymentRepository.updatePayment(dbSession.id, {
      status: outcome === 'failed' ? 'failed' : 'cancelled',
      paymentStatus,
    });

    await paymentAuditRepository.log({
      paymentId: dbSession.id,
      action: outcome === 'timeout' ? 'timeout' : 'payment_failed',
      providerId: this.id,
      details: { reason },
    });

    return {
      success: true,
      sessionId: dbSession.id,
      outcome,
      resourceType: dbSession.resource_type,
      resourceId: dbSession.resource_id,
      providerId: this.id,
      failureReason: reason,
      externalEventId: eventId,
    };
  }

  async refund(
    context: FeatureContext,
    transactionId: string,
    amountCents?: number
  ): Promise<RefundResult> {
    const config = await context.getConfig<PaymentConfig>('payment');
    const stripe = this.getClient(config);

    try {
      const refund = await stripe.refunds.create({
        payment_intent: transactionId,
        ...(amountCents ? { amount: amountCents } : {}),
      });
      return { success: true, refundId: refund.id };
    } catch (err) {
      paymentLogger.providerError(this.id, 'refund', err instanceof Error ? err.message : 'Refund fehlgeschlagen');
      return { success: false, error: err instanceof Error ? err.message : 'Rückerstattung fehlgeschlagen' };
    }
  }

  async healthCheck(context: FeatureContext): Promise<ProviderHealthResult> {
    const config = await context.getConfig<PaymentConfig>('payment');
    const configValid = this.isConfigured(config);
    if (!configValid) {
      return { ok: false, message: 'Stripe nicht konfiguriert', configValid: false };
    }

    const s = this.getStripeConfig(config)!;
    const webhookValid = Boolean(s.webhookSecret);
    const sandbox = Boolean(s.sandbox);

    try {
      const stripe = this.getClient(config);
      await stripe.balance.retrieve();
      const mode = sandbox ? 'Sandbox/Test' : 'Live';
      return {
        ok: true,
        message: `Stripe verbunden (${mode})`,
        configValid: true,
        apiReachable: true,
        webhookValid,
        sandboxReachable: sandbox,
      };
    } catch {
      return {
        ok: false,
        message: 'Stripe-Verbindung fehlgeschlagen',
        configValid: true,
        apiReachable: false,
        webhookValid,
        sandboxReachable: sandbox,
      };
    }
  }
}
