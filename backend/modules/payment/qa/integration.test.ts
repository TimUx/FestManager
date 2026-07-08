import { describe, it, expect } from 'vitest';
import { EventBus } from '../../../src/platform/EventBus';
import { PAYMENT_EVENTS } from '../types';

describe('payment EventBus integration', () => {
  it('emits PaymentCreated and PaymentSucceeded events', async () => {
    const bus = new EventBus();
    const received: string[] = [];

    bus.on(PAYMENT_EVENTS.CREATED, () => { received.push('created'); });
    bus.on(PAYMENT_EVENTS.SUCCEEDED, () => { received.push('succeeded'); });
    bus.on(PAYMENT_EVENTS.ORDER_RELEASED, () => { received.push('released'); });

    await bus.emit(PAYMENT_EVENTS.CREATED, { sessionId: 's1' });
    await bus.emit(PAYMENT_EVENTS.SUCCEEDED, { sessionId: 's1' });
    await bus.emit(PAYMENT_EVENTS.ORDER_RELEASED, { sessionId: 's1' });

    expect(received).toEqual(['created', 'succeeded', 'released']);
  });

  it('defines all required payment events', () => {
    expect(PAYMENT_EVENTS.CREATED).toBe('PaymentCreated');
    expect(PAYMENT_EVENTS.STARTED).toBe('PaymentStarted');
    expect(PAYMENT_EVENTS.WAITING).toBe('PaymentWaiting');
    expect(PAYMENT_EVENTS.SUCCEEDED).toBe('PaymentSucceeded');
    expect(PAYMENT_EVENTS.FAILED).toBe('PaymentFailed');
    expect(PAYMENT_EVENTS.CANCELLED).toBe('PaymentCancelled');
    expect(PAYMENT_EVENTS.TIMEOUT).toBe('PaymentTimeout');
    expect(PAYMENT_EVENTS.REFUNDED).toBe('PaymentRefunded');
    expect(PAYMENT_EVENTS.ORDER_RELEASED).toBe('OrderReleased');
  });
});

describe('payment module QA', () => {
  it('default config validates', async () => {
    const { paymentConfigSchema, defaultPaymentConfig } = await import('../config');
    expect(paymentConfigSchema.parse(defaultPaymentConfig)).toBeDefined();
  });
});
