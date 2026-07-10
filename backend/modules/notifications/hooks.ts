import { CORE_HOOKS } from '../../src/platform/module-api';
import type { FeatureContext, HookSubscription } from '../../src/platform/module-api';
import { logger } from '../../src/utils/logger';
import { notificationManager, type OrderHookPayload } from './NotificationManager';

type PaymentFailedHookPayload = {
  sessionId: string;
  providerId: string;
  resourceType: string;
  resourceId: string;
  reason?: string;
  amountCents?: number;
  displayNumber?: string;
};

type PaymentRefundedHookPayload = {
  providerId: string;
  transactionId: string;
  refundId?: string;
  amountCents?: number;
};

type ModuleHookPayload = {
  moduleId: string;
};

export function createNotificationHookSubscriptions(context: FeatureContext): HookSubscription[] {
  const wrap = <T>(label: string, fn: (payload: T) => Promise<void>) =>
    async (payload: T) => {
      try {
        await fn(payload);
      } catch (err) {
        logger.warn(`${label} Benachrichtigung fehlgeschlagen`, err);
      }
    };

  return [
    {
      moduleId: 'notifications',
      hook: CORE_HOOKS.ORDER_CREATED,
      handler: wrap('ORDER_CREATED', (payload) =>
        notificationManager.handleOrderCreated(context, payload as OrderHookPayload)),
      priority: 40,
    },
    {
      moduleId: 'notifications',
      hook: CORE_HOOKS.ORDER_CANCELLED,
      handler: wrap('ORDER_CANCELLED', (payload) =>
        notificationManager.handleOrderCancelled(context, payload as OrderHookPayload)),
      priority: 40,
    },
    {
      moduleId: 'notifications',
      hook: CORE_HOOKS.ORDER_PAID,
      handler: wrap('ORDER_PAID', (payload) =>
        notificationManager.handleOrderPaid(context, payload as OrderHookPayload)),
      priority: 50,
    },
    {
      moduleId: 'notifications',
      hook: CORE_HOOKS.KITCHEN_COMPLETED,
      handler: wrap('KITCHEN_COMPLETED', (payload) =>
        notificationManager.handleKitchenCompleted(context, payload as OrderHookPayload)),
      priority: 50,
    },
    {
      moduleId: 'notifications',
      hook: CORE_HOOKS.PAYMENT_FAILED,
      handler: wrap('PAYMENT_FAILED', (payload) =>
        notificationManager.handlePaymentFailed(context, payload as PaymentFailedHookPayload)),
      priority: 50,
    },
    {
      moduleId: 'notifications',
      hook: CORE_HOOKS.PAYMENT_REFUNDED,
      handler: wrap('PAYMENT_REFUNDED', (payload) =>
        notificationManager.handlePaymentRefunded(context, payload as PaymentRefundedHookPayload)),
      priority: 50,
    },
    {
      moduleId: 'notifications',
      hook: CORE_HOOKS.MODULE_ACTIVATED,
      handler: wrap('MODULE_ACTIVATED', (payload) =>
        notificationManager.handleModuleActivated(context, payload as ModuleHookPayload)),
      priority: 60,
    },
    {
      moduleId: 'notifications',
      hook: CORE_HOOKS.MODULE_DEACTIVATED,
      handler: wrap('MODULE_DEACTIVATED', (payload) =>
        notificationManager.handleModuleDeactivated(context, payload as ModuleHookPayload)),
      priority: 60,
    },
  ];
}
