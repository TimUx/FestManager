import type { FeatureContext } from '../../../src/module-system/types';
import type {
  ClubContactData,
  NotificationService,
  OrderEmailData,
} from '../../../src/platform/extension-points/NotificationService';
import { notificationManager } from '../NotificationManager';

export function createNotificationService(context: FeatureContext): NotificationService {
  return {
    async isAvailable() {
      return notificationManager.hasActiveChannel(context);
    },
    async sendOrderConfirmation(email, order, club) {
      await notificationManager.sendOrderConfirmation(context, email, order, club);
    },
    async sendOrderCancellation(email, order, club, options) {
      await notificationManager.sendOrderCancellation(context, email, order, club, options);
    },
  };
}
