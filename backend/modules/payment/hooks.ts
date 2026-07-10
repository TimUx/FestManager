import { CORE_HOOKS } from '../../src/platform/module-api';
export { PAYMENT_EVENTS } from './types';

/** Payment-Modul Hook-Namen (registriert über CORE_HOOKS / HookSystem). */
export const PAYMENT_HOOKS = {
  COMPLETED: CORE_HOOKS.PAYMENT_COMPLETED,
  FAILED: CORE_HOOKS.PAYMENT_FAILED,
  REFUNDED: CORE_HOOKS.PAYMENT_REFUNDED,
} as const;

export interface PaymentCompletedPayload {
  sessionId: string;
  providerId: string;
  resourceType: string;
  resourceId: string;
  amountCents: number;
  transactionId?: string;
}

export interface PaymentFailedPayload {
  sessionId: string;
  providerId: string;
  resourceType: string;
  resourceId: string;
  reason?: string;
}

export interface PaymentRefundedPayload {
  providerId: string;
  transactionId: string;
  refundId?: string;
  amountCents?: number;
}
