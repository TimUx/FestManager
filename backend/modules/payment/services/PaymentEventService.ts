import { eventBusInstance } from '../../../src/platform/bootstrap';
import { PAYMENT_EVENTS, type PaymentEventPayload } from '../types';

export const paymentEventService = {
  emit(event: string, payload: PaymentEventPayload): void {
    eventBusInstance.emitAsync(event, payload);
  },

  paymentCreated(payload: PaymentEventPayload): void {
    this.emit(PAYMENT_EVENTS.CREATED, payload);
  },

  paymentStarted(payload: PaymentEventPayload): void {
    this.emit(PAYMENT_EVENTS.STARTED, payload);
  },

  paymentWaiting(payload: PaymentEventPayload): void {
    this.emit(PAYMENT_EVENTS.WAITING, payload);
  },

  paymentSucceeded(payload: PaymentEventPayload): void {
    this.emit(PAYMENT_EVENTS.SUCCEEDED, payload);
  },

  paymentFailed(payload: PaymentEventPayload): void {
    this.emit(PAYMENT_EVENTS.FAILED, payload);
  },

  paymentCancelled(payload: PaymentEventPayload): void {
    this.emit(PAYMENT_EVENTS.CANCELLED, payload);
  },

  paymentTimeout(payload: PaymentEventPayload): void {
    this.emit(PAYMENT_EVENTS.TIMEOUT, payload);
  },

  paymentRefunded(payload: PaymentEventPayload): void {
    this.emit(PAYMENT_EVENTS.REFUNDED, payload);
  },

  orderReleased(payload: PaymentEventPayload): void {
    this.emit(PAYMENT_EVENTS.ORDER_RELEASED, payload);
  },
};
