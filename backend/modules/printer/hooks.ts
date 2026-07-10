import { CORE_HOOKS } from '../../src/platform/module-api';
import type { FeatureContext, HookSubscription } from '../../src/platform/module-api';
import { logger } from '../../src/utils/logger';
import { printManager } from './PrintManager';
import type { OrderPrintPayload } from '../../src/platform/extension-points/PrinterService';

export function createPrinterHookSubscriptions(context: FeatureContext): HookSubscription[] {
  return [
    {
      moduleId: 'printer',
      hook: CORE_HOOKS.ORDER_CREATED,
      handler: async (payload) => {
        try {
          await printManager.handleOrderCreated(context, payload as OrderPrintPayload);
        } catch (err) {
          logger.warn('ORDER_CREATED Druck fehlgeschlagen', err);
        }
      },
      priority: 40,
    },
    {
      moduleId: 'printer',
      hook: CORE_HOOKS.ORDER_PAID,
      handler: async (payload) => {
        try {
          await printManager.handleOrderPaid(context, payload as OrderPrintPayload);
        } catch (err) {
          logger.warn('ORDER_PAID Druck fehlgeschlagen', err);
        }
      },
      priority: 40,
    },
  ];
}
