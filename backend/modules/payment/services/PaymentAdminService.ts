import type { FeatureContext } from '../../../src/module-system/types';
import { PaymentFactory } from '../PaymentFactory';
import { paymentRegistry } from '../PaymentRegistry';
import { paymentManager } from '../PaymentManager';
import { paymentRepository } from '../repositories/paymentRepository';
import { paymentAdminRepository } from '../repositories/paymentAdminRepository';
import { paymentAuditRepository } from '../repositories/paymentAuditRepository';
import { getProviderMetadata } from '../providerMetadata';
import type { PaymentConfig } from '../config';
import { resolvePaymentStatus } from '../types';
import { METHOD_TYPE_DEFS, providerConfigKey } from '../methodTypes';

const PROVIDER_LABELS: Record<string, string> = {
  stripe: 'Kartenzahlung',
  paypal: 'PayPal',
  'vr-payment': 'VR Payment',
  's-payment': 'S-Payment',
  payone: 'PAYONE',
  sumup: 'SumUp',
};

function getProviderStatus(
  providerId: string,
  config: PaymentConfig,
  implemented: boolean,
  configured: boolean,
  healthOk?: boolean
): string {
  const key = providerConfigKey(providerId);
  const section = config[key] as { enabled?: boolean; sandbox?: boolean } | undefined;
  if (!implemented) return 'nicht_verfuegbar';
  if (!configured) return 'nicht_konfiguriert';
  if (!section?.enabled) return 'deaktiviert';
  if (healthOk === false) return 'health_fehler';
  if (section?.sandbox) return 'sandbox';
  return 'aktiv';
}

export class PaymentAdminService {
  constructor(private readonly context: FeatureContext) {}

  async getDashboard() {
    PaymentFactory.registerAll();
    const config = await this.context.getConfig<PaymentConfig>('payment');
    const stats = await paymentAdminRepository.getDashboardStats();
    const health = await paymentManager.runHealthChecks(this.context);
    const methods = await paymentManager.getAvailablePaymentMethods(this.context);

    const providers = paymentRegistry.getAll().map((p) => {
      const configured = p.isConfigured(config);
      const healthResult = health[p.id];
      return {
        id: p.id,
        name: PROVIDER_LABELS[p.id] ?? p.name,
        implemented: p.implemented,
        status: getProviderStatus(p.id, config, p.implemented, configured, healthResult?.ok),
        health: healthResult ?? { ok: false, message: 'Nicht geprüft' },
      };
    });

    const recentErrors = (await paymentAdminRepository.listAudits({ limit: 5 }))
      .items.filter((a) => ['payment_failed', 'provider_error', 'timeout'].includes(a.action));

    return {
      stats: {
        paymentsToday: stats.todayCount,
        revenueTodayCents: stats.todayRevenueCents,
        openPayments: stats.openCount,
        failedPayments: stats.failedCount,
        timeouts: stats.timeoutCount,
        refunds: stats.refundCount,
      },
      activeProviders: providers.filter((p) => p.status === 'aktiv' || p.status === 'sandbox').length,
      availableMethods: methods.length,
      providers,
      webhookStatus: providers.some((p) => p.health.ok) ? 'ok' : 'warning',
      healthStatus: providers.every((p) => !p.implemented || p.health.ok || p.status === 'deaktiviert')
        ? 'ok'
        : 'warning',
      recentErrors: recentErrors.map((e) => ({
        action: e.action,
        providerId: e.provider_id,
        at: e.created_at,
        details: e.details,
      })),
    };
  }

  async getProviders() {
    PaymentFactory.registerAll();
    const config = await this.context.getConfig<PaymentConfig>('payment');
    const health = await paymentManager.runHealthChecks(this.context);

    return paymentRegistry.getAll().map((p) => {
      const meta = getProviderMetadata(p.id);
      const configured = p.isConfigured(config);
      const healthResult = health[p.id];
      const key = providerConfigKey(p.id);
      const section = config[key] as { enabled?: boolean; sandbox?: boolean } | undefined;

      return {
        id: p.id,
        name: PROVIDER_LABELS[p.id] ?? p.name,
        description: meta?.description ?? p.name,
        version: p.implemented ? '1.0.0' : '0.1.0 (geplant)',
        implemented: p.implemented,
        enabled: Boolean(section?.enabled),
        configured,
        sandbox: Boolean(section?.sandbox),
        status: getProviderStatus(p.id, config, p.implemented, configured, healthResult?.ok),
        health: healthResult ?? { ok: false, message: 'Nicht geprüft' },
        supportsRefund: p.supports('refund'),
        supportsWebhook: p.supports('webhook'),
      };
    });
  }

  async testProvider(providerId: string) {
    PaymentFactory.registerAll();
    const checks = await paymentManager.runHealthChecks(this.context);
    const result = checks[providerId];
    if (!result) throw new Error('Anbieter nicht gefunden');

    await paymentAuditRepository.log({
      action: result.ok ? 'connection_test' : 'provider_error',
      providerId,
      details: { phase: 'connection_test', ok: result.ok, message: result.message },
    });

    return {
      ok: result.ok,
      message: result.message,
      checks: {
        apiReachable: result.ok,
        authentication: result.ok,
        configuration: result.ok,
        webhook: result.message?.includes('Webhook') ? result.ok : undefined,
      },
    };
  }

  getPaymentMethodTypes(config: PaymentConfig) {
    PaymentFactory.registerAll();
    const methodTypes = (config as PaymentConfig & { methodTypes?: Record<string, {
      enabled?: boolean;
      recommended?: boolean;
      sortOrder?: number;
      description?: string;
      icon?: string;
    }> }).methodTypes ?? {};

    const result: {
      id: string;
      providerId: string;
      label: string;
      enabled: boolean;
      recommended: boolean;
      sortOrder: number;
      description?: string;
      icon?: string;
      providerConfigured: boolean;
    }[] = [];

    for (const provider of paymentRegistry.getAll()) {
      if (!provider.implemented) continue;
      const defs = METHOD_TYPE_DEFS[provider.id] ?? [];
      const providerConfigured = provider.isConfigured(config);
      for (const def of defs) {
        const key = `${provider.id}:${def.id}`;
        const override = methodTypes[key];
        result.push({
          id: key,
          providerId: provider.id,
          label: def.label,
          enabled: override?.enabled ?? (providerConfigured && (config[providerConfigKey(provider.id)] as { enabled?: boolean })?.enabled !== false),
          recommended: override?.recommended ?? false,
          sortOrder: override?.sortOrder ?? 10,
          description: override?.description,
          icon: override?.icon,
          providerConfigured,
        });
      }
    }

    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async setProviderEnabled(providerId: string, enabled: boolean) {
    const config = await this.context.getConfig<PaymentConfig>('payment');
    const key = providerConfigKey(providerId);
    const section = (config[key] ?? {}) as Record<string, unknown>;
    await this.context.setConfig('payment', {
      ...config,
      [key]: { ...section, enabled },
    });
    await this.context.audit.log({
      action: enabled ? 'payment.provider.enabled' : 'payment.provider.disabled',
      moduleId: 'payment',
      details: { providerId },
    });
    return { ok: true };
  }

  async saveMethodTypes(methodTypes: PaymentConfig['methodTypes']) {
    const config = await this.context.getConfig<PaymentConfig>('payment');
    await this.context.setConfig('payment', { ...config, methodTypes });
    await this.context.audit.log({
      action: 'payment.settings.changed',
      moduleId: 'payment',
      details: { section: 'methodTypes' },
    });
    return this.getPaymentMethodTypes({ ...config, methodTypes });
  }

  async listRefunds(filter: { page?: number; limit?: number }) {
    const { items, total } = await paymentAdminRepository.listAudits({
      ...filter,
      action: 'refund',
    });
    return {
      items: items.map((a) => ({
        id: a.id,
        paymentId: a.payment_id,
        providerId: a.provider_id,
        details: a.details,
        createdAt: a.created_at,
      })),
      total,
    };
  }

  async listPayments(filter: Parameters<typeof paymentAdminRepository.listPayments>[0]) {
    const { items, total } = await paymentAdminRepository.listPayments(filter);
    return {
      items: items.map((p) => ({
        id: p.id,
        orderNumber: p.order_number,
        displayNumber: p.order_number != null ? String(p.order_number).padStart(3, '0') : null,
        amountCents: p.amount_cents,
        currency: p.currency,
        status: resolvePaymentStatus(p),
        providerId: p.provider_id,
        paymentMethod: PROVIDER_LABELS[p.provider_id] ?? p.provider_id,
        createdAt: p.created_at,
        paidAt: p.paid_at,
        customerName: p.customer_name,
        eventId: p.event_id,
        resourceType: p.resource_type,
        resourceId: p.resource_id,
      })),
      total,
      page: filter.page ?? 1,
      limit: filter.limit ?? 25,
    };
  }

  async getPaymentDetail(paymentId: string) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) return null;

    const transactions = await paymentAdminRepository.getTransactionsForPayment(paymentId);
    const audits = await paymentAdminRepository.getAuditsForPayment(paymentId);
    const metadata = payment.metadata ?? {};

    return {
      id: payment.id,
      status: resolvePaymentStatus(payment),
      providerId: payment.provider_id,
      amountCents: payment.amount_cents,
      currency: payment.currency,
      checkoutId: payment.checkout_reference ?? payment.external_session_id,
      paymentReference: payment.payment_reference,
      resourceType: payment.resource_type,
      resourceId: payment.resource_id,
      orderNumber: metadata.orderNumber,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      paidAt: payment.paid_at,
      expiresAt: payment.expires_at,
      releasedToKitchen: payment.released_to_kitchen,
      transactions,
      audits,
      statusHistory: audits
        .filter((a) => ['checkout_created', 'payment_succeeded', 'payment_failed', 'refund', 'timeout'].includes(a.action))
        .map((a) => ({ action: a.action, at: a.created_at, details: a.details })),
    };
  }

  async getLogs(filter: Parameters<typeof paymentAdminRepository.listAudits>[0]) {
    const { items, total } = await paymentAdminRepository.listAudits(filter);
    return {
      items: items.map((a) => ({
        id: a.id,
        paymentId: a.payment_id,
        action: a.action,
        providerId: a.provider_id,
        details: a.details,
        createdAt: a.created_at,
      })),
      total,
    };
  }

  async getWebhooks(filter: Parameters<typeof paymentAdminRepository.listWebhookEvents>[0]) {
    const { items, total } = await paymentAdminRepository.listWebhookEvents(filter);
    return {
      items: items.map((e) => ({
        id: e.id,
        paymentId: e.payment_id,
        eventType: e.event_type,
        externalEventId: e.external_event_id,
        status: 'processed',
        createdAt: e.created_at,
        payload: e.payload,
      })),
      total,
    };
  }

  async getHealth() {
    return this.getProviders();
  }

  async getStatistics(period: 'today' | 'week' | 'month') {
    const stats = await paymentAdminRepository.getStatistics(period);
    const successRate = stats.totalCount > 0
      ? Math.round((stats.successCount / stats.totalCount) * 100)
      : 0;
    const errorRate = stats.totalCount > 0
      ? Math.round((stats.failedCount / stats.totalCount) * 100)
      : 0;
    const refundRate = stats.successCount > 0
      ? Math.round((stats.refundCount / stats.successCount) * 100)
      : 0;

    return { ...stats, successRate, errorRate, refundRate, period };
  }
}

export function createPaymentAdminService(context: FeatureContext): PaymentAdminService {
  return new PaymentAdminService(context);
}
