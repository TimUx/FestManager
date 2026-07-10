import type { FeatureContext } from '../../../src/platform/module-api';
import type { NotificationService } from '../../../src/platform/extension-points/NotificationService';
import { notificationManager } from '../NotificationManager';

export function createNotificationService(context: FeatureContext): NotificationService {
  return {
    async isAvailable() {
      return notificationManager.hasActiveChannel(context);
    },
  };
}
