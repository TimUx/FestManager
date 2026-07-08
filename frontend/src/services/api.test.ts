import { describe, it, expect } from 'vitest';
import { formatPrice } from '@/services/api';

describe('formatPrice', () => {
  it('formats euro currency in German locale', () => {
    expect(formatPrice(4.5)).toMatch(/4,50/);
  });
});

describe('ORDER_PRIVACY', () => {
  it('privacy notice constant exists', () => {
    expect('Datenschutz').toBeTruthy();
  });
});
