import { logger } from '../../../src/utils/logger';
import type { PaymentAuditAction } from '../types';

const PREFIX = '[Payment]';

export const paymentLogger = {
  created(sessionId: string, resourceType: string, resourceId: string): void {
    logger.info(`${PREFIX} Payment Created`, { sessionId, resourceType, resourceId });
  },

  checkoutCreated(sessionId: string, providerId: string): void {
    logger.info(`${PREFIX} Checkout Created`, { sessionId, providerId });
  },

  checkoutExpired(sessionId: string): void {
    logger.info(`${PREFIX} Checkout Expired`, { sessionId });
  },

  paymentSuccess(sessionId: string, transactionId?: string): void {
    logger.info(`${PREFIX} Payment Success`, { sessionId, transactionId });
  },

  paymentFailed(sessionId: string, reason?: string): void {
    logger.warn(`${PREFIX} Payment Failed`, { sessionId, reason });
  },

  webhookVerified(providerId: string, eventType: string): void {
    logger.info(`${PREFIX} Webhook Verified`, { providerId, eventType });
  },

  refundSuccess(transactionId: string, refundId?: string): void {
    logger.info(`${PREFIX} Refund Success`, { transactionId, refundId });
  },

  providerError(providerId: string, action: PaymentAuditAction, message: string): void {
    logger.error(`${PREFIX} Provider Error`, { providerId, action, message });
  },
};
