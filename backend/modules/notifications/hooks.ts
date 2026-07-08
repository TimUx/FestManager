import { CORE_HOOKS } from '../../src/module-system/types';
import type { FeatureContext, HookSubscription } from '../../src/module-system/types';
import { logger } from '../../src/utils/logger';
import { notificationManager } from './NotificationManager';

type OrderHookPayload = {
  id: string;
  displayNumber: string;
  totalPrice: number;
  eventDateLabel?: string;
  items?: { name?: string; quantity: number; lineTotal?: number }[];
  customer?: { email?: string | null } | null;
};

export function createNotificationHookSubscriptions(context: FeatureContext): HookSubscription[] {
  return [
    {
      moduleId: 'notifications',
      hook: CORE_HOOKS.ORDER_PAID,
      handler: async (payload) => {
        try {
          await notificationManager.handleOrderPaid(context, payload as OrderHookPayload);
        } catch (err) {
          logger.warn('ORDER_PAID Benachrichtigung fehlgeschlagen', err);
        }
      },
      priority: 50,
    },
    {
      moduleId: 'notifications',
      hook: CORE_HOOKS.KITCHEN_COMPLETED,
      handler: async (payload) => {
        try {
          await notificationManager.handleKitchenCompleted(context, payload as OrderHookPayload);
        } catch (err) {
          logger.warn('KITCHEN_COMPLETED Benachrichtigung fehlgeschlagen', err);
        }
      },
      priority: 50,
    },
  ];
}
