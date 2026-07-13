import { describe, expect, it } from 'vitest';
import {
  formatTenantApplicationRateLimitMessage,
  parseRateLimitInfo,
} from './rateLimitMessage';

describe('rateLimitMessage', () => {
  it('parses ratelimit-reset header', () => {
    const headers = new Headers({ 'ratelimit-reset': '3600' });
    const info = parseRateLimitInfo(headers);
    expect(info?.retryAfterSeconds).toBe(3600);
  });

  it('formats retry time with clock for longer waits', () => {
    const now = new Date('2026-07-13T14:00:00');
    const message = formatTenantApplicationRateLimitMessage(
      { retryAfterSeconds: 3600, retryAt: new Date('2026-07-13T15:00:00') },
      now
    );
    expect(message).toContain('60 Minuten');
    expect(message).toContain('15:00 Uhr');
  });

  it('formats short waits in seconds', () => {
    const now = new Date('2026-07-13T14:00:00');
    const message = formatTenantApplicationRateLimitMessage(
      { retryAfterSeconds: 45, retryAt: new Date('2026-07-13T14:00:45') },
      now
    );
    expect(message).toContain('45 Sekunden');
  });
});
