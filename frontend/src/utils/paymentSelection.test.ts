import { describe, it, expect } from 'vitest';
import { buildPaymentSelection, buildPosPaymentSelection, isOnlineChoice, isPaymentFailure, isPaymentSuccess, paymentStatusLabel } from '@/utils/paymentSelection';
import type { PublicPaymentMethod } from '@/types/payment';

const stripe: PublicPaymentMethod = {
  methodId: 'stripe',
  displayName: 'Online bezahlen',
  description: 'Kreditkarte, Apple Pay, Google Pay',
  supportedMethods: ['card'],
  checkoutType: 'redirect',
  icon: 'credit-card',
  sortOrder: 10,
  recommended: true,
};

const paypal: PublicPaymentMethod = {
  methodId: 'paypal',
  displayName: 'Online bezahlen',
  description: 'PayPal',
  supportedMethods: ['paypal'],
  checkoutType: 'redirect',
  icon: 'paypal',
  sortOrder: 20,
};

describe('buildPaymentSelection', () => {
  it('Fall 1: keine Onlinezahlung → keine Auswahl, Barzahlung', () => {
    const result = buildPaymentSelection([], true);
    expect(result.showSelection).toBe(false);
    expect(result.defaultChoice).toBe('cash');
  });

  it('Fall 3: nur eine Online-Methode ohne Bar → auto Online', () => {
    const result = buildPaymentSelection([stripe], false);
    expect(result.showSelection).toBe(false);
    expect(result.defaultChoice).toBe('stripe');
    expect(isOnlineChoice(result.defaultChoice)).toBe(true);
  });

  it('Fall 4: Bar + eine Online → Auswahl anzeigen', () => {
    const result = buildPaymentSelection([stripe], true);
    expect(result.showSelection).toBe(true);
    expect(result.options).toHaveLength(2);
    expect(result.options[0].id).toBe('cash');
    expect(result.defaultChoice).toBe('stripe');
  });

  it('Fall 5: Bar + mehrere Online → Auswahl mit differenzierten Labels', () => {
    const result = buildPaymentSelection([stripe, paypal], true);
    expect(result.showSelection).toBe(true);
    expect(result.options).toHaveLength(3);
    expect(result.options[1].label).toContain('Kreditkarte');
    expect(result.options[2].label).toContain('PayPal');
  });
});

describe('buildPosPaymentSelection', () => {
  it('prefers cash as default in POS mode', () => {
    const result = buildPosPaymentSelection([stripe], true);
    expect(result.defaultChoice).toBe('cash');
    expect(result.showSelection).toBe(true);
  });

  it('auto-selects online when cash not allowed', () => {
    const result = buildPosPaymentSelection([stripe], false);
    expect(result.showSelection).toBe(false);
    expect(result.defaultChoice).toBe('stripe');
  });

  it('shows no selection when only cash available', () => {
    const result = buildPosPaymentSelection([], true);
    expect(result.showSelection).toBe(false);
    expect(result.defaultChoice).toBe('cash');
  });
});

describe('paymentStatusLabel', () => {
  it('uses user-friendly German labels', () => {
    expect(paymentStatusLabel('PAYMENT_PENDING')).toBe('Warte auf Zahlung …');
    expect(paymentStatusLabel('PAYMENT_PAID')).toBe('Zahlung erfolgreich');
    expect(paymentStatusLabel('PAYMENT_TIMEOUT')).toBe('Zahlung abgelaufen');
  });
});

describe('payment status helpers', () => {
  it('detects success and failure states', () => {
    expect(isPaymentSuccess('PAYMENT_PAID')).toBe(true);
    expect(isPaymentSuccess('ORDER_CONFIRMED')).toBe(true);
    expect(isPaymentSuccess('PAYMENT_PENDING')).toBe(false);
    expect(isPaymentFailure('PAYMENT_FAILED')).toBe(true);
    expect(isPaymentFailure('PAYMENT_TIMEOUT')).toBe(true);
    expect(isPaymentFailure('PAYMENT_PAID')).toBe(false);
  });
});
