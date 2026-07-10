import type { FeatureContext } from '../../src/platform/module-api';
import type {
  PayableResource,
  PaymentCheckoutResult,
  PaymentMethodInfo,
  PaymentStatusResult,
  RefundResult,
  WebhookVerificationResult,
} from '../../src/platform/module-api';
import { payableResourceRegistry } from '../../src/platform/module-api';
import type { PaymentProvider, PaymentResult } from './PaymentProvider';
import { PAYMENT_FEATURES } from './PaymentProvider';
import { PaymentFactory } from './PaymentFactory';
import { paymentRegistry } from './PaymentRegistry';
import type { PaymentConfig } from './config';
import { buildEnabledPaymentMethods, parsePaymentMethodId } from './methodTypes';
import { paymentRepository } from './repositories/paymentRepository';
import { paymentAuditRepository } from './repositories/paymentAuditRepository';
import { paymentEventService } from './services/PaymentEventService';
import { paymentLogger } from './services/PaymentLogger';
import {
  PAYMENT_HOOKS,
  type PaymentCompletedPayload,
  type PaymentFailedPayload,
  type PaymentRefundedPayload,
} from './hooks';
import type { PaymentEventPayload, PaymentStatus } from './types';

class PaymentManagerImpl {
  async initialize(): Promise<void> {
    PaymentFactory.registerAll();
  }

  async getConfig(context: FeatureContext): Promise<PaymentConfig> {
    return context.getConfig<PaymentConfig>('payment');
  }

  async hasActiveProvider(context: FeatureContext): Promise<boolean> {
    PaymentFactory.registerAll();
    return (await paymentRegistry.getConfigured(context)).length > 0;
  }

  async getAvailablePaymentMethods(context: FeatureContext): Promise<PaymentMethodInfo[]> {
    const config = await this.getConfig(context);
    return buildEnabledPaymentMethods(config);
  }

  /** @deprecated use getAvailablePaymentMethods – provider IDs nur intern */
  async getAvailableProviders(context: FeatureContext) {
    const methods = await this.getAvailablePaymentMethods(context);
    return methods.map((m) => ({
      id: m.providerId,
      name: m.displayName,
      enabled: true,
      implemented: true,
    }));
  }

  async getConfiguredProviders(context: FeatureContext): Promise<PaymentProvider[]> {
    PaymentFactory.registerAll();
    return paymentRegistry.getConfigured(context);
  }

  private async resolveProvider(context: FeatureContext, providerId?: string): Promise<PaymentProvider> {
    PaymentFactory.registerAll();
    const parsed = parsePaymentMethodId(providerId);
    const resolvedId = parsed.providerId ?? providerId;
    const config = await this.getConfig(context);
    const providers = await paymentRegistry.getConfigured(context);
    if (providers.length === 0) throw new Error('Kein Zahlungsanbieter konfiguriert');

    const selected = resolvedId
      ? providers.find((p) => p.id === resolvedId)
      : providers.find((p) => p.id === config.defaultProvider) ?? providers[0];

    if (!selected) throw new Error(`Zahlungsanbieter nicht verfügbar: ${resolvedId ?? providerId}`);
    return selected;
  }

  private toCheckoutResult(session: {
    id: string;
    resourceId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    checkoutUrl?: string;
    expiresAt?: Date;
    paymentReference?: string;
    metadata?: Record<string, unknown>;
  }): PaymentCheckoutResult {
    return {
      sessionId: session.id,
      checkoutUrl: session.checkoutUrl ?? '',
      expiresAt: session.expiresAt?.toISOString(),
      paymentReference: session.paymentReference,
      paymentStatus: session.status,
      amount: session.amount,
      currency: session.currency,
      resourceId: session.resourceId,
      metadata: session.metadata,
    };
  }

  private eventPayload(row: {
    id: string;
    resource_type: string;
    resource_id: string;
    amount_cents: number;
    currency: string;
    provider_id: string;
  }, status: PaymentStatus, extra?: Partial<PaymentEventPayload>): PaymentEventPayload {
    return {
      sessionId: row.id,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      amountCents: row.amount_cents,
      currency: row.currency,
      paymentStatus: status,
      providerId: row.provider_id,
      ...extra,
    };
  }

  async createCheckout(context: FeatureContext, resource: PayableResource, providerId?: string) {
    const provider = await this.resolveProvider(context, providerId);
    const session = await provider.createCheckoutSession(context, resource);

    paymentLogger.created(session.id, resource.type, resource.id);
    paymentLogger.checkoutCreated(session.id, provider.id);
    await paymentAuditRepository.log({
      paymentId: session.id,
      action: 'checkout_created',
      providerId: provider.id,
      details: {
        resourceType: resource.type,
        resourceId: resource.id,
        posMode: resource.metadata?.source === 'CASHIER',
      },
    });

    paymentEventService.paymentCreated(
      this.eventPayload(
        {
          id: session.id,
          resource_type: resource.type,
          resource_id: resource.id,
          amount_cents: resource.amountCents,
          currency: resource.currency,
          provider_id: provider.id,
        },
        'CREATED'
      )
    );
    paymentEventService.paymentWaiting(
      this.eventPayload(
        {
          id: session.id,
          resource_type: resource.type,
          resource_id: resource.id,
          amount_cents: resource.amountCents,
          currency: resource.currency,
          provider_id: provider.id,
        },
        'PAYMENT_PENDING'
      )
    );

    return session;
  }

  async cancelCheckout(context: FeatureContext, sessionId: string): Promise<PaymentCheckoutResult> {
    const row = await paymentRepository.findById(sessionId);
    if (!row) throw new Error('Zahlungssession nicht gefunden');

    const provider = paymentRegistry.get(row.provider_id);
    if (!provider?.supports(PAYMENT_FEATURES.CANCEL)) {
      await paymentRepository.updatePayment(sessionId, {
        status: 'cancelled',
        paymentStatus: 'PAYMENT_CANCELLED',
      });
    } else {
      const session = await provider.cancelCheckoutSession(context, sessionId);
      return this.toCheckoutResult({
        id: session.id,
        resourceId: session.resourceId,
        amount: session.amount,
        currency: session.currency,
        status: session.status,
        checkoutUrl: session.checkoutUrl,
        expiresAt: session.expiresAt,
        paymentReference: session.paymentReference,
        metadata: session.metadata,
      });
    }

    await paymentAuditRepository.log({
      paymentId: sessionId,
      action: 'checkout_cancelled',
      providerId: row.provider_id,
    });

    paymentEventService.paymentCancelled(
      this.eventPayload(row, 'PAYMENT_CANCELLED')
    );

    const adapter = payableResourceRegistry.getAdapter(row.resource_type);
    if (adapter?.onPaymentCancelled) {
      await adapter.onPaymentCancelled(row.resource_id);
    }

    return this.toCheckoutResult({
      id: row.id,
      resourceId: row.resource_id,
      amount: row.amount_cents / 100,
      currency: row.currency,
      status: 'PAYMENT_CANCELLED',
    });
  }

  async retryCheckout(context: FeatureContext, sessionId: string): Promise<PaymentCheckoutResult | null> {
    const row = await paymentRepository.findById(sessionId);
    if (!row) throw new Error('Zahlungssession nicht gefunden');

    const status = paymentRepository.resolveStatus(row);
    const retriable = ['PAYMENT_FAILED', 'PAYMENT_CANCELLED', 'PAYMENT_TIMEOUT'].includes(status);
    if (!retriable) throw new Error('Zahlung kann in diesem Status nicht wiederholt werden');

    const adapter = payableResourceRegistry.getAdapter(row.resource_type);
    if (!adapter) throw new Error('Ressource nicht gefunden');

    const { config } = await import('../../src/config');
    const resource = await adapter.toPayableResource(row.resource_id, config.corsOrigin);
    if (!resource) throw new Error('Ressource nicht verfügbar');

    await paymentAuditRepository.log({
      paymentId: sessionId,
      action: 'checkout_created',
      providerId: row.provider_id,
      details: { previousSessionId: sessionId, retried: true },
    });

    const session = await this.createCheckout(context, resource, row.provider_id);
    return this.toCheckoutResult({
      id: session.id,
      resourceId: session.resourceId,
      amount: session.amount,
      currency: session.currency,
      status: session.status,
      checkoutUrl: session.checkoutUrl,
      expiresAt: session.expiresAt,
      paymentReference: session.paymentReference,
      metadata: session.metadata,
    });
  }

  async getPaymentStatus(context: FeatureContext, sessionId: string): Promise<PaymentStatusResult | null> {
    const row = await paymentRepository.findById(sessionId);
    if (!row) return null;

    if (await paymentRepository.isExpired(row)) {
      const status = paymentRepository.resolveStatus(row);
      if (status === 'PAYMENT_PENDING' || status === 'CREATED') {
        const marked = await paymentRepository.markTimedOutIfPending(sessionId);
        if (marked) {
          paymentLogger.checkoutExpired(sessionId);
          await paymentAuditRepository.log({ paymentId: sessionId, action: 'timeout', providerId: row.provider_id });
          paymentEventService.paymentTimeout(this.eventPayload(row, 'PAYMENT_TIMEOUT'));
          row.payment_status = 'PAYMENT_TIMEOUT';
          row.status = 'cancelled';
        }
      }
    }

    const paymentStatus = paymentRepository.resolveStatus(row);
    return {
      sessionId: row.id,
      paymentStatus,
      amount: row.amount_cents / 100,
      currency: row.currency,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      expiresAt: row.expires_at?.toISOString(),
      paidAt: row.paid_at?.toISOString(),
      releasedToKitchen: row.released_to_kitchen,
    };
  }

  async verifyWebhook(
    context: FeatureContext,
    providerId: string,
    payload: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookVerificationResult> {
    PaymentFactory.registerAll();
    const provider = paymentRegistry.get(providerId);
    if (!provider) return { valid: false, error: 'Unbekannter Provider' };

    const result = await provider.verifyWebhookSignature(context, payload, headers);
    if (!result.valid) {
      await paymentAuditRepository.log({
        action: 'provider_error',
        providerId,
        details: { error: result.error, phase: 'verify' },
      });
      return { valid: false, error: result.error };
    }

    await paymentAuditRepository.log({
      action: 'webhook_validated',
      providerId,
      details: { eventId: result.eventId, eventType: result.eventType },
    });
    paymentLogger.webhookVerified(providerId, result.eventType ?? 'unknown');

    return { valid: true, eventId: result.eventId, eventType: result.eventType };
  }

  async runHealthChecks(context: FeatureContext): Promise<Record<string, { ok: boolean; message?: string }>> {
    PaymentFactory.registerAll();
    const config = await this.getConfig(context);
    const results: Record<string, { ok: boolean; message?: string }> = {};

    for (const provider of paymentRegistry.getAll()) {
      const health = await provider.healthCheck(context);
      results[provider.id] = { ok: health.ok, message: health.message };

      await paymentRepository.upsertProviderConfig({
        providerId: provider.id,
        enabled: provider.implemented && provider.isConfigured(config),
        configValid: provider.isConfigured(config),
        apiReachable: health.apiReachable,
        webhookValid: health.webhookValid,
        sandboxReachable: health.sandboxReachable,
        details: { message: health.message },
      });
    }
    return results;
  }

  async handleWebhook(
    context: FeatureContext,
    providerId: string,
    payload: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<PaymentResult> {
    PaymentFactory.registerAll();
    const provider = paymentRegistry.get(providerId);
    if (!provider) throw new Error(`Unbekannter Provider: ${providerId}`);

    await paymentAuditRepository.log({
      action: 'webhook_received',
      providerId,
    });

    const verification = await this.verifyWebhook(context, providerId, payload, headers);
    if (!verification.valid) {
      return { success: false, sessionId: '', error: verification.error };
    }

    const eventId = verification.eventId;
    if (eventId && await paymentRepository.hasWebhookEvent(eventId)) {
      return { success: true, sessionId: '', replay: true };
    }

    const result = await provider.handleWebhook(context, payload, headers);
    if (!result.success) {
      return result;
    }

    await this.dispatchPaymentOutcome(context, result);

    const recordId = eventId ?? result.externalEventId;
    if (recordId) {
      await paymentRepository.recordWebhookEvent({
        paymentId: result.sessionId || undefined,
        eventType: verification.eventType ?? 'webhook',
        externalEventId: recordId,
        payload: { providerId, outcome: result.outcome },
      });
    }

    return result;
  }

  async refund(
    context: FeatureContext,
    providerId: string,
    transactionId: string,
    amountCents?: number
  ): Promise<RefundResult> {
    PaymentFactory.registerAll();
    const provider = paymentRegistry.get(providerId);
    if (!provider) throw new Error(`Unbekannter Provider: ${providerId}`);

    const result = await provider.refund(context, transactionId, amountCents);
    if (result.success) {
      paymentLogger.refundSuccess(transactionId, result.refundId);
      context.hooks.emitAsync(PAYMENT_HOOKS.REFUNDED, {
        providerId,
        transactionId,
        refundId: result.refundId,
        amountCents,
      } satisfies PaymentRefundedPayload);
      paymentEventService.paymentRefunded({
        sessionId: '',
        resourceType: '',
        resourceId: '',
        amountCents: amountCents ?? 0,
        currency: 'EUR',
        paymentStatus: 'PAYMENT_REFUNDED',
        providerId,
        transactionId,
      });
    } else {
      paymentLogger.providerError(providerId, 'refund', result.error ?? 'Refund fehlgeschlagen');
    }
    return result;
  }

  supports(feature: string): boolean {
    PaymentFactory.registerAll();
    return paymentRegistry.getAll().some((p) => p.supports(feature));
  }

  private async dispatchPaymentOutcome(context: FeatureContext, result: PaymentResult): Promise<void> {
    if (!result.outcome || !result.resourceType || !result.resourceId) return;
    if (result.replay) return;

    const adapter = payableResourceRegistry.getAdapter(result.resourceType);
    const row = result.sessionId ? await paymentRepository.findById(result.sessionId) : null;

    if (row) {
      const current = paymentRepository.resolveStatus(row);
      if (
        current === 'PAYMENT_PAID'
        || current === 'ORDER_CONFIRMED'
        || current === 'PAYMENT_REFUNDED'
        || row.released_to_kitchen
      ) {
        return;
      }
    }

    if (result.outcome === 'completed') {
      if (row) {
        await paymentRepository.updatePayment(result.sessionId, {
          status: 'completed',
          paymentStatus: 'PAYMENT_PAID',
          paidAt: new Date(),
        });
      }
      if (adapter) {
        await adapter.onPaymentCompleted(result.resourceId);
        if (row) {
          await paymentRepository.updatePayment(result.sessionId, {
            releasedToKitchen: true,
            paymentStatus: 'ORDER_CONFIRMED',
          });
        }
      }
      paymentLogger.paymentSuccess(result.sessionId, result.transactionId);
      await paymentAuditRepository.log({
        paymentId: result.sessionId,
        action: 'payment_succeeded',
        providerId: result.providerId,
        details: { transactionId: result.transactionId },
      });

      const payload: PaymentEventPayload = {
        sessionId: result.sessionId,
        resourceType: result.resourceType,
        resourceId: result.resourceId,
        amountCents: result.amountCents ?? 0,
        currency: row?.currency ?? 'EUR',
        paymentStatus: 'PAYMENT_PAID',
        providerId: result.providerId,
        transactionId: result.transactionId,
      };
      paymentEventService.paymentSucceeded(payload);
      paymentEventService.orderReleased({ ...payload, paymentStatus: 'ORDER_CONFIRMED' });

      context.hooks.emitAsync(PAYMENT_HOOKS.COMPLETED, {
        sessionId: result.sessionId,
        providerId: result.providerId ?? '',
        resourceType: result.resourceType,
        resourceId: result.resourceId,
        amountCents: result.amountCents ?? 0,
        transactionId: result.transactionId,
      } satisfies PaymentCompletedPayload);
      return;
    }

    if (result.outcome === 'failed' || result.outcome === 'cancelled' || result.outcome === 'timeout') {
      const paymentStatus: PaymentStatus =
        result.outcome === 'timeout' ? 'PAYMENT_TIMEOUT'
        : result.outcome === 'cancelled' ? 'PAYMENT_CANCELLED'
        : 'PAYMENT_FAILED';

      if (row) {
        await paymentRepository.updatePayment(result.sessionId, {
          status: result.outcome === 'cancelled' || result.outcome === 'timeout' ? 'cancelled' : 'failed',
          paymentStatus,
        });
      }

      if (result.outcome === 'cancelled' && adapter?.onPaymentCancelled) {
        await adapter.onPaymentCancelled(result.resourceId);
      } else if (adapter?.onPaymentFailed) {
        await adapter.onPaymentFailed(result.resourceId);
      }

      paymentLogger.paymentFailed(result.sessionId, result.failureReason);
      await paymentAuditRepository.log({
        paymentId: result.sessionId,
        action: 'payment_failed',
        providerId: result.providerId,
        details: { reason: result.failureReason, outcome: result.outcome },
      });

      const failPayload: PaymentEventPayload = {
        sessionId: result.sessionId,
        resourceType: result.resourceType,
        resourceId: result.resourceId,
        amountCents: result.amountCents ?? row?.amount_cents ?? 0,
        currency: row?.currency ?? 'EUR',
        paymentStatus,
        providerId: result.providerId,
        reason: result.failureReason,
      };

      if (result.outcome === 'timeout') paymentEventService.paymentTimeout(failPayload);
      else if (result.outcome === 'cancelled') paymentEventService.paymentCancelled(failPayload);
      else paymentEventService.paymentFailed(failPayload);

      context.hooks.emitAsync(PAYMENT_HOOKS.FAILED, {
        sessionId: result.sessionId,
        providerId: result.providerId ?? '',
        resourceType: result.resourceType,
        resourceId: result.resourceId,
        reason: result.failureReason,
      } satisfies PaymentFailedPayload);
    }
  }
}

export const paymentManager = new PaymentManagerImpl();
